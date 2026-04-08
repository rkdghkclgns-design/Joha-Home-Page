export interface GalleryCard {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  createdAt: string
}

export interface GalleryState {
  cards: GalleryCard[]
  isAuthenticated: boolean
}
