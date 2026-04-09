import { useState, useMemo } from 'react'

const ALL_EGGS = [
  { emoji: '🧚', message: '숨겨진 요정을 찾았어요! 🎉✨', secret: '요정의 축복을 받았습니다! 행운이 따를 거예요 🍀' },
  { emoji: '🐰', message: '토끼를 발견했어요! 🥕🐰', secret: '비밀 토끼 정원에 초대합니다! 🌷' },
  { emoji: '🐱', message: '숨어있던 고양이를 찾았어요! 😺', secret: '냥~ 주하의 비밀 친구를 만났어요! 🐾' },
  { emoji: '⭐', message: '반짝이는 마법 별을 찾았어요! ⭐', secret: '소원을 빌어보세요! 이루어질지도... 🌠' },
  { emoji: '🦋', message: '무지개 나비를 발견했어요! 🦋', secret: '나비가 행복을 전해줍니다! 🌈' },
  { emoji: '🍄', message: '마법 버섯을 찾았어요! 🍄', secret: '버섯 왕국의 열쇠를 얻었어요! 🗝️' },
  { emoji: '🌸', message: '벚꽃 요정을 만났어요! 🌸', secret: '봄바람이 행운을 실어다 줄 거예요! 🌷' },
  { emoji: '🐸', message: '개구리 왕자를 발견! 🐸', secret: '뽀뽀하면 왕자로 변할지도? 👑' },
  { emoji: '🦉', message: '지혜의 부엉이를 찾았어요! 🦉', secret: '부엉이가 비밀 지혜를 나눠줍니다! 📚' },
  { emoji: '🐝', message: '꿀벌을 발견했어요! 🐝', secret: '달콤한 꿀처럼 좋은 일이 생길 거예요! 🍯' },
  { emoji: '🌙', message: '초승달을 찾았어요! 🌙', secret: '달빛이 비밀의 문을 열어줍니다! ✨' },
  { emoji: '🐢', message: '거북이를 발견! 🐢', secret: '느리지만 확실한 행운이 찾아옵니다! 🏆' },
  { emoji: '🎃', message: '호박 친구를 찾았어요! 🎃', secret: '마법의 호박 마차가 기다려요! 🪄' },
  { emoji: '🐞', message: '무당벌레를 발견! 🐞', secret: '유럽에선 행운의 상징이래요! 🍀' },
  { emoji: '🦊', message: '여우를 찾았어요! 🦊', secret: '여우가 비밀 숲길을 알려줍니다! 🌲' },
]

function randomPositions(count: number) {
  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    let x: number, y: number, ok: boolean
    let tries = 0
    do {
      x = 3 + Math.random() * 90
      y = 15 + Math.random() * 75
      ok = positions.every(p => Math.abs(p.x - x) > 8 || Math.abs(p.y - y) > 8)
      tries++
    } while (!ok && tries < 50)
    positions.push({ x, y })
  }
  return positions
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface EggInstance {
  id: string
  emoji: string
  message: string
  secret: string
  x: string
  y: string
}

export default function EasterEgg() {
  // 매 접속(마운트)마다 랜덤 5~10개 생성 — useMemo로 re-render 시 유지
  const eggs = useMemo<EggInstance[]>(() => {
    const count = 5 + Math.floor(Math.random() * 6) // 5~10
    const selected = shuffle(ALL_EGGS).slice(0, count)
    const positions = randomPositions(count)
    return selected.map((egg, i) => ({
      id: `egg-${i}`,
      ...egg,
      x: `${positions[i].x}%`,
      y: `${positions[i].y}%`,
    }))
  }, [])

  const [found, setFound] = useState<Set<string>>(new Set())
  const [popup, setPopup] = useState<{ message: string; secret: string } | null>(null)

  const handleFind = (egg: EggInstance) => {
    if (found.has(egg.id)) return
    setFound(prev => new Set([...prev, egg.id]))
    setPopup({ message: egg.message, secret: egg.secret })
  }

  return (
    <>
      {eggs.map(egg => (
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

      {found.size > 0 && (
        <div className="egg-counter" title={`${found.size}/${eggs.length}개 발견!`}>
          🔍 {found.size}/{eggs.length}
        </div>
      )}

      {popup && (
        <div className="modal-backdrop z-password" onClick={() => setPopup(null)}>
          <div className="modal egg-popup" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPopup(null)}>&times;</button>
            <div className="egg-popup-content">
              <div className="egg-celebration">🎊</div>
              <h2 className="modal-title">{popup.message}</h2>
              <p className="egg-secret">{popup.secret}</p>
              <p className="egg-progress">
                발견한 이스터에그: {found.size} / {eggs.length}
                {found.size === eggs.length && (
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
