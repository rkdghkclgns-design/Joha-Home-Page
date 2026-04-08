import { useState, useEffect, useCallback } from 'react'
import { GalleryCard } from './types'
import { defaultCards } from './defaultData'
import GalleryCardItem from './components/GalleryCardItem'
import PasswordModal from './components/PasswordModal'
import CardEditor from './components/CardEditor'
import CardDetail from './components/CardDetail'
import FloatingMascots from './components/FloatingMascots'
import './App.css'

const STORAGE_KEY = 'joha-gallery-cards'

function loadCards(): GalleryCard[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore parse errors
  }
  return defaultCards
}

function saveCards(cards: GalleryCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

type FilterCategory = '전체' | string

export default function App() {
  const [cards, setCards] = useState<GalleryCard[]>(loadCards)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingCard, setEditingCard] = useState<GalleryCard | null>(null)
  const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('전체')
  const [pendingAction, setPendingAction] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [pendingCardId, setPendingCardId] = useState<string | null>(null)

  useEffect(() => {
    saveCards(cards)
  }, [cards])

  const categories = ['전체', ...Array.from(new Set(cards.map(c => c.category)))]

  const filteredCards = activeFilter === '전체'
    ? cards
    : cards.filter(c => c.category === activeFilter)

  const requireAuth = useCallback((action: 'add' | 'edit' | 'delete', cardId?: string) => {
    if (isAuthenticated) {
      executeAction(action, cardId)
    } else {
      setPendingAction(action)
      setPendingCardId(cardId ?? null)
      setShowPasswordModal(true)
    }
  }, [isAuthenticated, cards])

  const executeAction = (action: 'add' | 'edit' | 'delete', cardId?: string) => {
    if (action === 'add') {
      setEditingCard(null)
      setShowEditor(true)
    } else if (action === 'edit' && cardId) {
      const card = cards.find(c => c.id === cardId) ?? null
      setEditingCard(card)
      setShowEditor(true)
    } else if (action === 'delete' && cardId) {
      setCards(prev => prev.filter(c => c.id !== cardId))
      setSelectedCard(null)
    }
  }

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

  return (
    <div className="app">
      {/* Floating Mascots */}
      <FloatingMascots />

      {/* Decorative corner ornaments */}
      <div className="ornament ornament-tl" />
      <div className="ornament ornament-tr" />
      <div className="ornament ornament-bl" />
      <div className="ornament ornament-br" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-ornament">✦</div>
          <h1 className="header-title">Joha</h1>
          <p className="header-subtitle">Gallery of Wonders</p>
          <div className="header-line" />
        </div>
      </header>

      {/* Filter Bar */}
      <nav className="filter-bar">
        <div className="filter-inner">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
          {isAuthenticated && (
            <button
              className="add-btn"
              onClick={() => requireAuth('add')}
              title="새 작품 추가"
            >
              + 새 작품
            </button>
          )}
          {!isAuthenticated && (
            <button
              className="auth-btn"
              onClick={() => {
                setPendingAction('add')
                setShowPasswordModal(true)
              }}
              title="관리자 모드"
            >
              ✦ 관리자
            </button>
          )}
        </div>
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
        <p className="footer-text">
          ✦ Joha — Gallery of Wonders ✦
        </p>
        <p className="footer-copy">&copy; 2026 Joha. All rights reserved.</p>
      </footer>

      {/* Modals */}
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

      {showEditor && (
        <CardEditor
          card={editingCard}
          onSave={handleSaveCard}
          onClose={() => {
            setShowEditor(false)
            setEditingCard(null)
          }}
        />
      )}

      {selectedCard && (
        <CardDetail
          card={selectedCard}
          isAuthenticated={isAuthenticated}
          onEdit={(id) => requireAuth('edit', id)}
          onDelete={(id) => requireAuth('delete', id)}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  )
}
