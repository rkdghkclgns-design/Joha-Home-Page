import { useState, useEffect, useCallback } from 'react'
import { GalleryCard } from './types'
import { defaultCards, DEFAULT_CATEGORIES } from './defaultData'
import GalleryCardItem from './components/GalleryCardItem'
import PasswordModal from './components/PasswordModal'
import CardEditor from './components/CardEditor'
import CardDetail from './components/CardDetail'
import FloatingMascots from './components/FloatingMascots'
import HeroSection from './components/HeroSection'
import './App.css'

const CARDS_KEY = 'joha-gallery-cards'
const CATS_KEY = 'joha-gallery-categories'

function loadCards(): GalleryCard[] {
  try {
    const stored = localStorage.getItem(CARDS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return defaultCards
}

function loadCategories(): string[] {
  try {
    const stored = localStorage.getItem(CATS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return DEFAULT_CATEGORIES
}

function saveCards(cards: GalleryCard[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
}

function saveCategories(cats: string[]): void {
  localStorage.setItem(CATS_KEY, JSON.stringify(cats))
}

export default function App() {
  const [cards, setCards] = useState<GalleryCard[]>(loadCards)
  const [categories, setCategories] = useState<string[]>(loadCategories)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingCard, setEditingCard] = useState<GalleryCard | null>(null)
  const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null)
  const [activeFilter, setActiveFilter] = useState('전체')
  const [pendingAction, setPendingAction] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [pendingCardId, setPendingCardId] = useState<string | null>(null)
  const [showCategoryEditor, setShowCategoryEditor] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => { saveCards(cards) }, [cards])
  useEffect(() => { saveCategories(categories) }, [categories])

  const allCategories = ['전체', ...categories]

  const filteredCards = activeFilter === '전체'
    ? cards
    : cards.filter(c => c.category === activeFilter)

  const executeAction = useCallback((action: 'add' | 'edit' | 'delete', cardId?: string) => {
    if (action === 'add') {
      setEditingCard(null)
      setSelectedCard(null)
      setShowEditor(true)
    } else if (action === 'edit' && cardId) {
      const card = cards.find(c => c.id === cardId) ?? null
      setEditingCard(card)
      setSelectedCard(null)
      setShowEditor(true)
    } else if (action === 'delete' && cardId) {
      setCards(prev => prev.filter(c => c.id !== cardId))
      setSelectedCard(null)
    }
  }, [cards])

  const requireAuth = useCallback((action: 'add' | 'edit' | 'delete', cardId?: string) => {
    if (isAuthenticated) {
      executeAction(action, cardId)
    } else {
      setPendingAction(action)
      setPendingCardId(cardId ?? null)
      setShowPasswordModal(true)
    }
  }, [isAuthenticated, executeAction])

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true)
    setShowPasswordModal(false)
    if (pendingAction) {
      executeAction(pendingAction, pendingCardId ?? undefined)
      setPendingAction(null)
      setPendingCardId(null)
    }
  }

  const handleSaveCard = (card: GalleryCard) => {
    setCards(prev => {
      const exists = prev.find(c => c.id === card.id)
      if (exists) {
        return prev.map(c => c.id === card.id ? card : c)
      }
      return [...prev, card]
    })
    setShowEditor(false)
    setEditingCard(null)
  }

  const handleAddCategory = () => {
    const trimmed = newCategory.trim()
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed])
      setNewCategory('')
    }
  }

  const handleRemoveCategory = (cat: string) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return
    setCategories(prev => prev.filter(c => c !== cat))
    if (activeFilter === cat) setActiveFilter('전체')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setShowCategoryEditor(false)
  }

  return (
    <div className="app">
      <FloatingMascots />

      <div className="ornament ornament-tl" />
      <div className="ornament ornament-tr" />
      <div className="ornament ornament-bl" />
      <div className="ornament ornament-br" />

      {/* Hero Video Section */}
      <HeroSection />

      {/* Filter Bar */}
      <nav className="filter-bar">
        <div className="filter-inner">
          <div className="filter-scroll">
            {allCategories.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="filter-actions">
            {isAuthenticated && (
              <>
                <button className="add-btn" onClick={() => requireAuth('add')}>
                  + 새 작품
                </button>
                <button
                  className="add-btn"
                  onClick={() => setShowCategoryEditor(prev => !prev)}
                >
                  카테고리 편집
                </button>
                <button className="auth-btn active-auth" onClick={handleLogout}>
                  적용하기
                </button>
              </>
            )}
            {!isAuthenticated && (
              <button
                className="auth-btn"
                onClick={() => {
                  setPendingAction(null)
                  setShowPasswordModal(true)
                }}
              >
                ✦ 관리자
              </button>
            )}
          </div>
        </div>

        {/* Category Editor (inline) */}
        {showCategoryEditor && isAuthenticated && (
          <div className="category-editor">
            <div className="category-list">
              {categories.map(cat => (
                <span key={cat} className="category-tag">
                  {cat}
                  {!DEFAULT_CATEGORIES.includes(cat) && (
                    <button
                      className="category-remove"
                      onClick={() => handleRemoveCategory(cat)}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="category-add-row">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="새 카테고리 이름"
                className="category-input"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              />
              <button className="btn-primary btn-sm" onClick={handleAddCategory}>
                추가
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Gallery Grid */}
      <main className="gallery">
        <div className="gallery-grid">
          {filteredCards.map((card, index) => (
            <GalleryCardItem
              key={card.id}
              card={card}
              index={index}
              onClick={() => setSelectedCard(card)}
            />
          ))}
        </div>
        {filteredCards.length === 0 && (
          <div className="gallery-empty">
            <p>이 카테고리에는 아직 작품이 없습니다.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-line" />
        <p className="footer-text">✦ Joha — Gallery of Wonders ✦</p>
        <p className="footer-copy">&copy; 2026 Joha. All rights reserved.</p>
      </footer>

      {/* Modals — z-index stacking: password(200) > editor(150) > detail(100) */}
      {selectedCard && !showEditor && (
        <CardDetail
          card={selectedCard}
          isAuthenticated={isAuthenticated}
          onEdit={(id) => requireAuth('edit', id)}
          onDelete={(id) => requireAuth('delete', id)}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {showEditor && (
        <CardEditor
          card={editingCard}
          categories={categories}
          onSave={handleSaveCard}
          onClose={() => { setShowEditor(false); setEditingCard(null) }}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          onSuccess={handlePasswordSuccess}
          onClose={() => {
            setShowPasswordModal(false)
            setPendingAction(null)
            setPendingCardId(null)
          }}
        />
      )}
    </div>
  )
}
