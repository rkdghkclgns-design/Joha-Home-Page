export interface MediaItem {
  url: string
  type: 'image' | 'video'
}

export interface GalleryCard {
  id: string
  title: string
  description: string
  mediaUrl: string           // 썸네일 URL
  mediaType: 'image' | 'video'  // 썸네일 타입
  mediaItems: MediaItem[]    // 전체 미디어 목록
  category: string
  createdAt: string
  likes: number
}

export interface GalleryState {
  cards: GalleryCard[]
  categories: string[]
  isAuthenticated: boolean
}
