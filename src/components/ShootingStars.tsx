import { useEffect, useState } from 'react'

interface Star {
  id: number
  x: number
  y: number
  angle: number
  length: number
  duration: number
  delay: number
}

function createStar(): Star {
  return {
    id: Date.now() + Math.random(),
    x: Math.random() * 100,
    y: Math.random() * 40,
    angle: 25 + Math.random() * 30,
    length: 80 + Math.random() * 120,
    duration: 0.6 + Math.random() * 0.8,
    delay: 0,
  }
}

export default function ShootingStars() {
  const [stars, setStars] = useState<Star[]>([])
  const [isDark, setIsDark] = useState(false)

  // 테마 감지
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'night')
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  // 별똥별 생성 + 정리 단일 타이머
  useEffect(() => {
    if (!isDark) { setStars([]); return }

    const tick = () => {
      setStars(prev => {
        const now = Date.now()
        // 오래된 별 제거 (2초 이상)
        const alive = prev.filter(s => now - s.id < 2000)
        // 새 별 추가
        return [...alive, createStar()].slice(-6)
      })
    }

    tick()
    const interval = setInterval(tick, 2500 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [isDark])

  if (!isDark || stars.length === 0) return null

  return (
    <div className="shooting-stars-container">
      {stars.map(star => (
        <div
          key={star.id}
          className="shooting-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            ['--angle' as string]: `${star.angle}deg`,
            ['--length' as string]: `${star.length}px`,
            ['--duration' as string]: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
