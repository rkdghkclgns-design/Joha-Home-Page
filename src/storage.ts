/**
 * Supabase 기반 저장소
 * ────────────────────
 * 기존 IndexedDB 대신 Supabase 클라우드 DB를 사용하여
 * 어떤 환경(다른 PC, 모바일 등)에서도 동일한 데이터를 보여줍니다.
 * 관리자 모드에서 수정한 내역이 실시간으로 저장·반영됩니다.
 */

import { supabase } from './supabaseClient'
import { GalleryCard } from './types'

// ── DB row ↔ GalleryCard 변환 유틸 ──────────────────────
interface CardRow {
  id: string
  title: string
  description: string
  media_url: string
  media_type: string
  category: string
  created_at: string
  likes: number
}

function rowToCard(row: CardRow): GalleryCard {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    mediaUrl: row.media_url,
    mediaType: row.media_type as 'image' | 'video',
    category: row.category,
    createdAt: row.created_at,
    likes: row.likes ?? 0,
  }
}

function cardToRow(card: GalleryCard): Omit<CardRow, 'likes'> {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    media_url: card.mediaUrl,
    media_type: card.mediaType,
    category: card.category,
    created_at: card.createdAt,
  }
}

// ── 카드 CRUD ───────────────────────────────────────────

/** 카드 전체 목록 불러오기 */
export async function loadCardsDB(): Promise<GalleryCard[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('카드 불러오기 실패:', error.message)
    return []
  }

  return (data as CardRow[]).map(rowToCard)
}

/** 카드 한 장 저장 (신규 등록 또는 수정) */
export async function saveCardDB(card: GalleryCard): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .upsert(cardToRow(card))

  if (error) {
    console.error('카드 저장 실패:', error.message)
    throw error
  }
}

/** 카드 삭제 */
export async function deleteCardDB(id: string): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('카드 삭제 실패:', error.message)
    throw error
  }
}

// ── 카테고리 CRUD ───────────────────────────────────────

/** 카테고리 전체 불러오기 */
export async function loadCategoriesDB(): Promise<string[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('id', { ascending: true })

  if (error) {
    console.error('카테고리 불러오기 실패:', error.message)
    return []
  }

  return (data as { name: string }[]).map(r => r.name)
}

/** 카테고리 추가 */
export async function addCategoryDB(name: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .insert({ name })

  if (error) {
    console.error('카테고리 추가 실패:', error.message)
    throw error
  }
}

/** 카테고리 삭제 */
export async function removeCategoryDB(name: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('name', name)

  if (error) {
    console.error('카테고리 삭제 실패:', error.message)
    throw error
  }
}

// ── 좋아요(하트) ────────────────────────────────────────

/** 좋아요 증가 (Supabase RPC) */
export async function incrementLikeDB(cardId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_likes', { card_id: cardId })
  if (error) {
    console.error('좋아요 증가 실패:', error.message)
    throw error
  }
}

/** 좋아요 감소 (Supabase RPC) */
export async function decrementLikeDB(cardId: string): Promise<void> {
  const { error } = await supabase.rpc('decrement_likes', { card_id: cardId })
  if (error) {
    console.error('좋아요 감소 실패:', error.message)
    throw error
  }
}

// ── 미디어 파일 업로드 (Supabase Storage) ───────────────

/**
 * 파일을 Supabase Storage 'media' 버킷에 업로드한 뒤
 * public URL을 반환합니다.
 */
export async function uploadMedia(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const fileName = `${crypto.randomUUID()}.${ext}`
  const filePath = `uploads/${fileName}`

  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('파일 업로드 실패:', error.message)
    throw error
  }

  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(filePath)

  return data.publicUrl
}
