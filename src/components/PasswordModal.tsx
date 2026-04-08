import { useState, useRef, useEffect } from 'react'

const CORRECT_PASSWORD = '1128'

interface Props {
  onSuccess: () => void
  onClose: () => void
}

export default function PasswordModal({ onSuccess, onClose }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      onSuccess()
    } else {
      setError(true)
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal password-modal ${shake ? 'shake' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-ornament">&#x1F511;</div>
        <h2 className="modal-title">관리자 인증</h2>
        <p className="modal-desc">
          작품을 관리하려면 비밀번호를 입력하세요.
        </p>
        <form onSubmit={handleSubmit} className="password-form">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              setError(false)
            }}
            placeholder="비밀번호"
            className={`password-input ${error ? 'input-error' : ''}`}
            autoComplete="off"
          />
          {error && <p className="error-text">비밀번호가 올바르지 않습니다.</p>}
          <button type="submit" className="btn-primary">
            입장하기
          </button>
        </form>
      </div>
    </div>
  )
}
