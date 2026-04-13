import { useEffect, useCallback, useRef } from 'react'
import { GalleryCard } from './types'
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
import { useAppStore, useUIStore } from './store'
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
import ColoringBook from './components/ColoringBook'
import Diary from './components/Diary'
import ShootingStars from './components/ShootingStars'
import { DEFAULT_CATEGORIES } from './defaultData'
import './App.css'

export default function App() {
  const {
    cards, setCards,
    categories, setCategories,
    activeFilter, setActiveFilter,
    loading, setLoading,
    likedCards, setLikedCards,
    isAuthenticated, setIsAuthenticated
  } = useAppStore()

  const {
    showPasswordModal, setShowPasswordModal,
    showEditor, setShowEditor,
    editingCard, setEditingCard,
    selectedCard, setSelectedCard,
    pendingAction, setPendingAction,
    pendingCardId, setPendingCardId,
    showCategoryEditor, setShowCategoryEditor,
    newCategory, setNewCategory,
    showColoringBook, setShowColoringBook,
    showDiary, setShowDiary,
    resetPendingState
  } = useUIStore()

  const isInitRef = useRef(false)

  // ── 앱 시작 시 Supabase에서 데이터 로드 (및 localStorage 좋아요 로드) ──
  useEffect(() => {
    async function init() {
      try {
        const [dbCards, dbCats] = await Promise.all([
          loadCardsDB(),
          loadCategoriesDB(),
        ])

        if (dbCards.length > 0) setCards(dbCards)
        if (dbCats.length > 0) setCategories(dbCats)
        
        // localStorage에서 좋아요 복원
        const savedLikes = localStorage.getItem('juha-liked-cards')
        if (savedLikes) {
          setLikedCards(new Set(JSON.parse(savedLikes)))
        }
      } catch (err) {
        console.error('Supabase 초기 로드 실패, 기본 데이터 사용:', err)
      } finally {
        isInitRef.current = true
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [cards, setEditingCard, setSelectedCard, setShowEditor, setCards])

  const requireAuth = useCallback((action: 'add' | 'edit' | 'delete', cardId?: string) => {
    if (isAuthenticated) {
      executeAction(action, cardId)
    } else {
      setPendingAction(action)
      setPendingCardId(cardId ?? null)
      setShowPasswordModal(true)
    }
  }, [isAuthenticated, executeAction, setPendingAction, setPendingCardId, setShowPasswordModal])

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true)
    setShowPasswordModal(false)
    if (pendingAction) {
      executeAction(pendingAction, pendingCardId ?? undefined)
      resetPendingState()
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

  const handleAddCategory = async (directName?: string) => {
    const trimmed = (directName ?? newCategory).trim()
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
      setSelectedCard(prev => {
        if (prev && prev.id === cardId) {
          return { ...prev, likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1 }
        }
        return prev
      })
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
      <ClickParticles />
      <ThemeToggle />
      <EasterEgg />
      <FloatingMascots />
      <ShootingStars />

      <div className="ornament ornament-tl" />
      <div className="ornament ornament-tr" />
      <div className="ornament ornament-bl" />
      <div className="ornament ornament-br" />

      <HeroSection />
      <StorySection />

      <nav className="filter-bar">
        <div className="filter-inner">
          {/* 모든 버튼을 하나의 가로 스크롤 영역에 배치 */}
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
            <span className="filter-divider" />
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
                  resetPendingState()
                  setShowPasswordModal(true)
                }}
              >
                ✦ 관리자
              </button>
            )}
            <button
              className="add-btn coloring-btn"
              onClick={() => setShowColoringBook(true)}
            >
              🎨 컬러링북
            </button>
            <button
              className="add-btn diary-btn"
              onClick={() => setShowDiary(true)}
            >
              📖 일기장
            </button>
          </div>
        </div>

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
              <button className="btn-primary btn-sm" onClick={() => handleAddCategory()}>
                추가
              </button>
            </div>
          </div>
        )}
      </nav>

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

      <Quiz />

      <footer className="footer">
        <div className="footer-line" />
        <p className="footer-text">✦ Juha — Gallery of Wonders ✦</p>
        <p className="footer-copy">&copy; 2026 Juha. All rights reserved.</p>
      </footer>

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
          onAddCategory={handleAddCategory}
          onClose={() => { setShowEditor(false); setEditingCard(null) }}
        />
      )}

      {showColoringBook && (
        <ColoringBook onClose={() => setShowColoringBook(false)} />
      )}

      {showDiary && (
        <Diary onClose={() => setShowDiary(false)} />
      )}

      {showPasswordModal && (
        <PasswordModal
          onSuccess={handlePasswordSuccess}
          onClose={() => {
            setShowPasswordModal(false)
            resetPendingState()
          }}
        />
      )}
    </div>
  )
}
