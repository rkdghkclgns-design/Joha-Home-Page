import { useState, useEffect, useRef, useCallback } from 'react'

const BASE = import.meta.env.BASE_URL

const MASCOTS = [
  { src: `${BASE}mascots/love.png`, alt: '사랑해' },
  { src: `${BASE}mascots/hungry.png`, alt: '배고파' },
  { src: `${BASE}mascots/sleepy.png`, alt: '졸리다' },
  { src: `${BASE}mascots/please.png`, alt: '제발' },
  { src: `${BASE}mascots/excited.png`, alt: '신난다' },
  { src: `${BASE}mascots/angry.png`, alt: '화난다' },
  { src: `${BASE}mascots/crying.png`, alt: 'ㅠㅠ' },
]

interface MascotState {
  id: number
  src: string
  alt: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createMascot(id: number, mascot: typeof MASCOTS[number], w: number, h: number): MascotState {
  const size = randomBetween(48, 80)
  return {
    id,
    src: mascot.src,
    alt: mascot.alt,
    x: randomBetween(0, w - size),
    y: randomBetween(0, h - size),
    vx: randomBetween(-1.2, 1.2) || 0.5,
    vy: randomBetween(-1.2, 1.2) || 0.5,
    size,
    rotation: randomBetween(-15, 15),
    rotationSpeed: randomBetween(-0.5, 0.5),
    opacity: randomBetween(0.7, 0.95),
  }
}

export default function FloatingMascots() {
  const [mascots, setMascots] = useState<MascotState[]>([])
  const frameRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const initial = MASCOTS.map((m, i) => createMascot(i, m, w, h))
    setMascots(initial)
  }, [])

  const animate = useCallback(() => {
    setMascots(prev => {
      const w = window.innerWidth
      const h = window.innerHeight
      return prev.map(m => {
        let nx = m.x + m.vx
        let ny = m.y + m.vy
        let nvx = m.vx
        let nvy = m.vy

        if (nx <= 0 || nx >= w - m.size) {
          nvx = -nvx
          nx = Math.max(0, Math.min(nx, w - m.size))
        }
        if (ny <= 0 || ny >= h - m.size) {
          nvy = -nvy
          ny = Math.max(0, Math.min(ny, h - m.size))
        }

        return {
          ...m,
          x: nx,
          y: ny,
          vx: nvx,
          vy: nvy,
          rotation: m.rotation + m.rotationSpeed,
        }
      })
    })
    frameRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [animate])

  const handleClick = (id: number) => {
    setMascots(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              vx: randomBetween(-2.5, 2.5) || 1,
              vy: randomBetween(-2.5, 2.5) || 1,
              rotation: m.rotation + randomBetween(-30, 30),
            }
          : m
      )
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {mascots.map(m => (
        <img
          key={m.id}
          src={m.src}
          alt={m.alt}
          onClick={() => handleClick(m.id)}
          style={{
            position: 'absolute',
            left: m.x,
            top: m.y,
            width: m.size,
            height: m.size,
            objectFit: 'contain',
            transform: `rotate(${m.rotation}deg)`,
            opacity: m.opacity,
            pointerEvents: 'auto',
            cursor: 'pointer',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))',
            transition: 'width 0.2s, height 0.2s',
            userSelect: 'none',
          }}
          draggable={false}
          title={m.alt}
        />
      ))}
    </div>
  )
}
