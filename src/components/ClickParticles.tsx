import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  char: string
  size: number
  rotation: number
  rotSpeed: number
}

const CHARS = ['💖', '✨', '⭐', '🌟', '💫', '🩷', '🌸', '🦋']
const THROTTLE_MS = 1000

export default function ClickParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  const lastSpawnRef = useRef<number>(0)

  const spawnParticles = useCallback((x: number, y: number) => {
    const now = Date.now()
    if (now - lastSpawnRef.current < THROTTLE_MS) return
    lastSpawnRef.current = now

    const count = 6 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        size: 14 + Math.random() * 10,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
      })
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const handleClick = (e: MouseEvent) => spawnParticles(e.clientX, e.clientY)
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) spawnParticles(t.clientX, t.clientY)
    }
    window.addEventListener('click', handleClick)
    window.addEventListener('touchstart', handleTouch, { passive: true })

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.current = particles.current.filter(p => p.life > 0)

      for (const p of particles.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.vx *= 0.98
        p.life -= 0.02 / p.maxLife
        p.rotation += p.rotSpeed

        const alpha = Math.max(0, p.life)
        const scale = 0.5 + alpha * 0.5

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.font = `${p.size * scale}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.char, 0, 0)
        ctx.restore()
      }

      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('touchstart', handleTouch)
      cancelAnimationFrame(frameRef.current)
    }
  }, [spawnParticles])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  )
}
