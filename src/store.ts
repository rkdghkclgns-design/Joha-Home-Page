import { create } from 'zustand'
import { GalleryCard } from './types'
import { defaultCards, DEFAULT_CATEGORIES } from './defaultData'

// ── Data & Auth Store ──────────────────────────────
interface AppState {
  cards: GalleryCard[]
  categories: string[]
  activeFilter: string
  loading: boolean
  likedCards: Set<string>
  isAuthenticated: boolean

  // Actions
  setCards: (cards: GalleryCard[] | ((prev: GalleryCard[]) => GalleryCard[])) => void
  setCategories: (categories: string[] | ((prev: string[]) => string[])) => void
  setActiveFilter: (filter: string) => void
  setLoading: (loading: boolean) => void
  setLikedCards: (liked: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setIsAuthenticated: (auth: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  cards: defaultCards,
  categories: DEFAULT_CATEGORIES,
  activeFilter: '전체',
  loading: true,
  likedCards: new Set(), // Will be initialized by App.tsx
  isAuthenticated: false,

  setCards: (val) => set((state) => ({ cards: typeof val === 'function' ? val(state.cards) : val })),
  setCategories: (val) => set((state) => ({ categories: typeof val === 'function' ? val(state.categories) : val })),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setLoading: (loading) => set({ loading }),
  setLikedCards: (val) => set((state) => ({ likedCards: typeof val === 'function' ? val(state.likedCards) : val })),
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
}))

// ── UI Store ───────────────────────────────────────
type PendingAction = 'add' | 'edit' | 'delete' | null

interface UIState {
  showPasswordModal: boolean
  showEditor: boolean
  editingCard: GalleryCard | null
  selectedCard: GalleryCard | null
  pendingAction: PendingAction
  pendingCardId: string | null
  showCategoryEditor: boolean
  newCategory: string
  showColoringBook: boolean
  showDiary: boolean

  // Actions
  setShowPasswordModal: (show: boolean) => void
  setShowEditor: (show: boolean) => void
  setEditingCard: (card: GalleryCard | null) => void
  setSelectedCard: (card: GalleryCard | null | ((prev: GalleryCard | null) => GalleryCard | null)) => void
  setPendingAction: (action: PendingAction) => void
  setPendingCardId: (id: string | null) => void
  setShowCategoryEditor: (show: boolean | ((prev: boolean) => boolean)) => void
  setNewCategory: (category: string) => void
  setShowColoringBook: (show: boolean) => void
  setShowDiary: (show: boolean) => void
  resetPendingState: () => void
}

export const useUIStore = create<UIState>((set) => ({
  showPasswordModal: false,
  showEditor: false,
  editingCard: null,
  selectedCard: null,
  pendingAction: null,
  pendingCardId: null,
  showCategoryEditor: false,
  newCategory: '',
  showColoringBook: false,
  showDiary: false,

  setShowPasswordModal: (show) => set({ showPasswordModal: show }),
  setShowEditor: (show) => set({ showEditor: show }),
  setEditingCard: (card) => set({ editingCard: card }),
  setSelectedCard: (val) => set((state) => ({ selectedCard: typeof val === 'function' ? val(state.selectedCard) : val })),
  setPendingAction: (action) => set({ pendingAction: action }),
  setPendingCardId: (id) => set({ pendingCardId: id }),
  setShowCategoryEditor: (val) => set((state) => ({ showCategoryEditor: typeof val === 'function' ? val(state.showCategoryEditor) : val })),
  setNewCategory: (cat) => set({ newCategory: cat }),
  setShowColoringBook: (show) => set({ showColoringBook: show }),
  setShowDiary: (show) => set({ showDiary: show }),
  resetPendingState: () => set({ pendingAction: null, pendingCardId: null }),
}))
