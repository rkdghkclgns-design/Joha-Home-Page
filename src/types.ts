export interface GalleryCard {
  id: string
  title: string
  description: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  category: string
  createdAt: string
}

export interface GalleryState {
  cards: GalleryCard[]
  categories: string[]
  isAuthenticated: boolean
}
