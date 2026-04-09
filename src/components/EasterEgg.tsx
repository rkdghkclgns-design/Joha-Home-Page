import { useState, useEffect } from 'react'

const EGGS = [
  { id: 'fairy', emoji: '🧚', x: '3%', y: '65%', message: '와! 숨겨진 요정을 찾았어요! 🎉✨', secret: '요정의 축복을 받았습니다! 행운이 따를 거예요 🍀' },
  { id: 'bunny', emoji: '🐰', x: '92%', y: '40%', message: '토끼를 발견했어요! 🥕🐰', secret: '비밀 토끼 정원에 초대합니다! 🌷' },
  { id: 'cat', emoji: '🐱', x: '88%', y: '85%', message: '숨어있던 고양이를 찾았어요! 😺', secret: '냥~ 주하의 비밀 친구를 만났어요! 🐾' },
  { id: 'star', emoji: '⭐', x: '7%', y: '30%', message: '반짝이는 마법 별을 찾았어요! ⭐', secret: '소원을 빌어보세요! 이루어질지도... 🌠' },
]

export default function EasterEgg() {
  const [found, setFound] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('juha-eggs')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [popup, setPopup] = useState<{ message: string; secret: string } | null>(null)

  useEffect(() => {
    localStorage.setItem('juha-eggs', JSON.stringify([...found]))
  }, [found])

  const handleFind = (egg: typeof EGGS[number]) => {
    if (found.has(egg.id)) return
    setFound(prev => new Set([...prev, egg.id]))
    setPopup({ message: egg.message, secret: egg.secret })
  }

  return (
    <>
      {/* 숨겨진 캐릭터들 */}
      {EGGS.map(egg => (
        <button
          key={egg.id}
          className={`easter-egg ${found.has(egg.id) ? 'found' : ''}`}
          style={{ left: egg.x, top: egg.y }}
          onClick={() => handleFind(egg)}
          title="뭔가 숨어있는 것 같은데..."
          aria-label={`숨겨진 ${egg.emoji} 찾기`}
        >
          <span className="egg-emoji">{egg.emoji}</span>
        </button>
      ))}

      {/* 찾은 개수 표시 */}
      {found.size > 0 && (
        <div className="egg-counter" title={`${found.size}/${EGGS.length}개 발견!`}>
          🔍 {found.size}/{EGGS.length}
        </div>
      )}

      {/* 발견 팝업 */}
      {popup && (
        <div className="modal-backdrop z-password" onClick={() => setPopup(null)}>
          <div className="modal egg-popup" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPopup(null)}>&times;</button>
            <div className="egg-popup-content">
              <div className="egg-celebration">🎊</div>
              <h2 className="modal-title">{popup.message}</h2>
              <p className="egg-secret">{popup.secret}</p>
              <p className="egg-progress">
                발견한 이스터에그: {found.size} / {EGGS.length}
                {found.size === EGGS.length && (
                  <span className="egg-complete"> — 🏆 전부 찾았어요!</span>
                )}
              </p>
              <button className="btn-primary" onClick={() => setPopup(null)}>
                좋아요! 🌟
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
