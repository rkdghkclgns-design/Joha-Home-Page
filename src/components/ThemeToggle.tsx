import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('juha-theme') === 'night'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'night' : 'day')
    localStorage.setItem('juha-theme', isDark ? 'night' : 'day')
  }, [isDark])

  return (
    <button
      className="theme-toggle"
      onClick={() => setIsDark(prev => !prev)}
      title={isDark ? '낮 테마로 전환' : '밤 테마로 전환'}
      aria-label="테마 변경"
    >
      <span className={`theme-icon ${isDark ? 'night' : 'day'}`}>
        {isDark ? '🌙' : '☀️'}
      </span>
      <span className="theme-stars">
        {isDark && (
          <>
            <span className="mini-star s1">✦</span>
            <span className="mini-star s2">✧</span>
            <span className="mini-star s3">✦</span>
          </>
        )}
      </span>
    </button>
  )
}
