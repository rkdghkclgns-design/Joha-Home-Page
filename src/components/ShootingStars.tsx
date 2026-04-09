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

let idCounter = 0

function createStar(): Star {
  return {
    id: idCounter++,
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

  // 별똥별 생성 주기
  useEffect(() => {
    if (!isDark) { setStars([]); return }

    const spawn = () => {
      setStars(prev => {
        const next = [...prev, createStar()]
        return next.slice(-6) // 최대 6개 유지
      })
    }

    spawn()
    const interval = setInterval(spawn, 2000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [isDark])

  // 오래된 별 제거
  useEffect(() => {
    if (stars.length === 0) return
    const timer = setTimeout(() => {
      setStars(prev => prev.slice(1))
    }, 2000)
    return () => clearTimeout(timer)
  }, [stars])

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
