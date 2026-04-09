/**
 * IndexedDB 기반 저장소
 * localStorage는 5MB 제한이 있어서, base64 이미지를 저장하면 금방 용량 초과됨.
 * IndexedDB는 수백 MB까지 저장 가능하므로 이미지/동영상 base64도 안전하게 저장.
 */

import { GalleryCard } from './types'

const DB_NAME = 'joha-gallery-db'
const DB_VERSION = 1
const STORE_CARDS = 'cards'
const STORE_META = 'meta'

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_CARDS)) {
                db.createObjectStore(STORE_CARDS, { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains(STORE_META)) {
                db.createObjectStore(STORE_META)
            }
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

/** 카드 목록 저장 (IndexedDB) */
export async function saveCardsDB(cards: GalleryCard[]): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_CARDS, 'readwrite')
    const store = tx.objectStore(STORE_CARDS)

    // 기존 데이터 전부 지우고 새로 넣기
    store.clear()
    for (const card of cards) {
        store.put(card)
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); reject(tx.error) }
    })
}

/** 카드 목록 불러오기 (IndexedDB) */
export async function loadCardsDB(): Promise<GalleryCard[] | null> {
    try {
        const db = await openDB()
        const tx = db.transaction(STORE_CARDS, 'readonly')
        const store = tx.objectStore(STORE_CARDS)
        const request = store.getAll()

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                db.close()
                const result = request.result as GalleryCard[]
                resolve(result.length > 0 ? result : null)
            }
            request.onerror = () => { db.close(); reject(request.error) }
        })
    } catch {
        return null
    }
}

/** 카테고리 저장 (IndexedDB) */
export async function saveCategoriesDB(categories: string[]): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_META, 'readwrite')
    const store = tx.objectStore(STORE_META)
    store.put(categories, 'categories')

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); reject(tx.error) }
    })
}

/** 카테고리 불러오기 (IndexedDB) */
export async function loadCategoriesDB(): Promise<string[] | null> {
    try {
        const db = await openDB()
        const tx = db.transaction(STORE_META, 'readonly')
        const store = tx.objectStore(STORE_META)
        const request = store.get('categories')

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                db.close()
                resolve(request.result ?? null)
            }
            request.onerror = () => { db.close(); reject(request.error) }
        })
    } catch {
        return null
    }
}

/**
 * 기존 localStorage 데이터를 IndexedDB로 마이그레이션.
 * 마이그레이션 후 localStorage의 큰 데이터를 삭제하여 용량 확보.
 */
export async function migrateFromLocalStorage(): Promise<{
    cards: GalleryCard[] | null
    categories: string[] | null
}> {
    let cards: GalleryCard[] | null = null
    let categories: string[] | null = null

    try {
        const storedCards = localStorage.getItem('joha-gallery-cards')
        if (storedCards) {
            cards = JSON.parse(storedCards)
            if (cards && cards.length > 0) {
                await saveCardsDB(cards)
            }
            localStorage.removeItem('joha-gallery-cards')
        }
    } catch {
        // localStorage 읽기 실패 시 무시
    }

    try {
        const storedCats = localStorage.getItem('joha-gallery-categories')
        if (storedCats) {
            categories = JSON.parse(storedCats)
            if (categories && categories.length > 0) {
                await saveCategoriesDB(categories)
            }
            localStorage.removeItem('joha-gallery-categories')
        }
    } catch {
        // localStorage 읽기 실패 시 무시
    }

    return { cards, categories }
}
