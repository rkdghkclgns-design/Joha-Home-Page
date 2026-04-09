import { useState, useEffect, useCallback, useRef } from 'react'
import { GalleryCard } from './types'
import { defaultCards, DEFAULT_CATEGORIES } from './defaultData'
import {
  loadCardsDB,
  saveCardDB,
  deleteCardDB,
  loadCategoriesDB,
  addCategoryDB,
  removeCategoryDB,
  incrementLikeDB,
  decrementLikeDB,
} from './storage'
import GalleryCardItem from './components/GalleryCardItem'
import PasswordModal from './components/PasswordModal'
import CardEditor from './components/CardEditor'
import CardDetail from './components/CardDetail'
import FloatingMascots from './components/FloatingMascots'
import HeroSection from './components/HeroSection'
import ClickParticles from './components/ClickParticles'
import ThemeToggle from './components/ThemeToggle'
import EasterEgg from './components/EasterEgg'
import Quiz from './components/Quiz'
import StorySection from './components/StorySection'
import './App.css'

export default function App() {
  const [cards, setCards] = useState<GalleryCard[]>(defaultCards)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
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
  const [loading, setLoading] = useState(true)
  const [likedCards, setLikedCards] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('juha-liked-cards')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const isInitRef = useRef(false)

  // ── 앱 시작 시 Supabase에서 데이터 로드 ──
  useEffect(() => {
    async function init() {
      try {
        const [dbCards, dbCats] = await Promise.all([
          loadCardsDB(),
          loadCategoriesDB(),
        ])

        if (dbCards.length > 0) setCards(dbCards)
        if (dbCats.length > 0) setCategories(dbCats)
      } catch (err) {
        console.error('Supabase 초기 로드 실패, 기본 데이터 사용:', err)
      } finally {
        isInitRef.current = true
        setLoading(false)
      }
    }
    init()
  }, [])

  const allCategories = ['전체', ...categories]

  const filteredCards = activeFilter === '전체'
    ? cards
    : cards.filter(c => c.category === activeFilter)

  const executeAction = useCallback(async (action: 'add' | 'edit' | 'delete', cardId?: string) => {
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
      try {
        await deleteCardDB(cardId)
        setCards(prev => prev.filter(c => c.id !== cardId))
        setSelectedCard(null)
      } catch (err) {
        console.error('삭제 실패:', err)
        alert('삭제에 실패했습니다. 다시 시도해주세요.')
      }
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

  const handleSaveCard = async (card: GalleryCard) => {
    try {
      await saveCardDB(card)
      setCards(prev => {
        const exists = prev.find(c => c.id === card.id)
        if (exists) {
          return prev.map(c => c.id === card.id ? card : c)
        }
        return [...prev, card]
      })
      setShowEditor(false)
      setEditingCard(null)
    } catch (err) {
      console.error('저장 실패:', err)
      alert('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim()
    if (trimmed && !categories.includes(trimmed)) {
      try {
        await addCategoryDB(trimmed)
        setCategories(prev => [...prev, trimmed])
        setNewCategory('')
      } catch (err) {
        console.error('카테고리 추가 실패:', err)
        alert('카테고리 추가에 실패했습니다.')
      }
    }
  }

  const handleRemoveCategory = async (cat: string) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return
    try {
      await removeCategoryDB(cat)
      setCategories(prev => prev.filter(c => c !== cat))
      if (activeFilter === cat) setActiveFilter('전체')
    } catch (err) {
      console.error('카테고리 삭제 실패:', err)
      alert('카테고리 삭제에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setShowCategoryEditor(false)
  }

  // ── 좋아요 토글 ──
  const handleLike = async (cardId: string) => {
    const isLiked = likedCards.has(cardId)
    try {
      if (isLiked) {
        await decrementLikeDB(cardId)
        setLikedCards(prev => {
          const next = new Set(prev)
          next.delete(cardId)
          localStorage.setItem('juha-liked-cards', JSON.stringify([...next]))
          return next
        })
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, likes: Math.max(0, c.likes - 1) } : c))
      } else {
        await incrementLikeDB(cardId)
        setLikedCards(prev => {
          const next = new Set(prev)
          next.add(cardId)
          localStorage.setItem('juha-liked-cards', JSON.stringify([...next]))
          return next
        })
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, likes: c.likes + 1 } : c))
      }
      // selectedCard가 열려있으면 같이 업데이트
      if (selectedCard?.id === cardId) {
        setSelectedCard(prev => prev ? { ...prev, likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1 } : prev)
      }
    } catch (err) {
      console.error('좋아요 처리 실패:', err)
    }
  }

  if (loading) {
    return (
      <div className="app" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#b89a6a',
      }}>
        ✦ 갤러리를 불러오는 중... ✦
      </div>
    )
  }

  return (
    <div className="app">
      {/* 클릭 파티클 효과 */}
      <ClickParticles />

      {/* 테마 토글 (우측 상단 고정) */}
      <ThemeToggle />

      {/* 이스터에그 숨겨진 캐릭터들 */}
      <EasterEgg />

      <FloatingMascots />

      <div className="ornament ornament-tl" />
      <div className="ornament ornament-tr" />
      <div className="ornament ornament-bl" />
      <div className="ornament ornament-br" />

      {/* Hero Video Section */}
      <HeroSection />

      {/* 캐릭터 스토리 섹션 */}
      <StorySection />

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
              liked={likedCards.has(card.id)}
              onClick={() => setSelectedCard(card)}
              onLike={(e: React.MouseEvent) => {
                e.stopPropagation()
                handleLike(card.id)
              }}
            />
          ))}
        </div>
        {filteredCards.length === 0 && (
          <div className="gallery-empty">
            <p>이 카테고리에는 아직 작품이 없습니다.</p>
          </div>
        )}
      </main>

      {/* 심리테스트 퀴즈 버튼 */}
      <Quiz />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-line" />
        <p className="footer-text">✦ Juha — Gallery of Wonders ✦</p>
        <p className="footer-copy">&copy; 2026 Juha. All rights reserved.</p>
      </footer>

      {/* Modals */}
      {selectedCard && !showEditor && (
        <CardDetail
          card={selectedCard}
          isAuthenticated={isAuthenticated}
          liked={likedCards.has(selectedCard.id)}
          onEdit={(id) => requireAuth('edit', id)}
          onDelete={(id) => requireAuth('delete', id)}
          onLike={() => handleLike(selectedCard.id)}
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
