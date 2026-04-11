/**
 * Supabase 기반 저장소
 * ────────────────────
 * 기존 IndexedDB 대신 Supabase 클라우드 DB를 사용하여
 * 어떤 환경(다른 PC, 모바일 등)에서도 동일한 데이터를 보여줍니다.
 * 관리자 모드에서 수정한 내역이 실시간으로 저장·반영됩니다.
 */

import { supabase } from './supabaseClient'
import { GalleryCard, MediaItem } from './types'
import { generateUUID } from './utils'

// ── DB row ↔ GalleryCard 변환 유틸 ──────────────────────
interface CardRow {
  id: string
  title: string
  description: string
  media_url: string
  media_type: string
  media_items: MediaItem[] | null
  category: string
  created_at: string
  likes: number
}

function rowToCard(row: CardRow): GalleryCard {
  // media_items가 없으면 기존 단일 미디어로 폴백
  const items: MediaItem[] = Array.isArray(row.media_items) && row.media_items.length > 0
    ? row.media_items
    : [{ url: row.media_url, type: row.media_type as 'image' | 'video' }]

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    mediaUrl: row.media_url,
    mediaType: row.media_type as 'image' | 'video',
    mediaItems: items,
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
    media_items: card.mediaItems,
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
  const fileName = `${generateUUID()}.${ext}`
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

// ── 보안 및 일기 (Supabase & Fallback) ───────────────

export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('verify_admin_password', { input_pw: password })
    if (!error && typeof data === 'boolean') return data
  } catch (e) {
    // RPC failed or not created yet
  }
  return password === '1128' // Fallback
}

export interface DiaryEntry {
  id: string
  date: string
  title: string
  content: string
  mood: string
}

export async function loadDiaryDB(): Promise<DiaryEntry[]> {
  try {
    const { data, error } = await supabase.from('diary_entries').select('*').order('date', { ascending: false })
    if (!error && data) return data
  } catch (e) {}

  // Fallback to localStorage
  try {
    const s = localStorage.getItem('juha-diary-entries')
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

export async function saveDiaryDB(entry: DiaryEntry): Promise<void> {
  try {
    const { error } = await supabase.from('diary_entries').upsert(entry)
    // If no error, we still don't return early to ensure local is also updated for offline fallback
    // Or we return if we want to STRICTLY rely on DB. Let's strictly rely on DB if successful.
    if (!error) return
  } catch (e) {}

  // Fallback
  try {
    const s = localStorage.getItem('juha-diary-entries')
    let prev: DiaryEntry[] = s ? JSON.parse(s) : []
    const exists = prev.find(x => x.id === entry.id)
    if (exists) prev = prev.map(x => x.id === entry.id ? entry : x)
    else prev = [entry, ...prev]
    
    // Sort logic just in case
    prev.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    localStorage.setItem('juha-diary-entries', JSON.stringify(prev))
  } catch (e) {}
}

export async function deleteDiaryDB(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('diary_entries').delete().eq('id', id)
    if (!error) return
  } catch(e) {}

  try {
    const s = localStorage.getItem('juha-diary-entries')
    if (s) {
      const prev: DiaryEntry[] = JSON.parse(s)
      localStorage.setItem('juha-diary-entries', JSON.stringify(prev.filter(x => x.id !== id)))
    }
  } catch(e) {}
}
