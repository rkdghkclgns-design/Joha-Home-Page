import { useState, useEffect } from 'react'
import { generateUUID } from '../utils'
import { verifyAdminPassword, loadDiaryDB, saveDiaryDB, deleteDiaryDB, DiaryEntry } from '../storage'

const MOODS = ['😊', '😢', '😡', '🥰', '😴', '🤔', '😎', '🥳', '😰', '🌈']

interface Props {
  onClose: () => void
}

export default function Diary({ onClose }: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [checkingPw, setCheckingPw] = useState(false)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [editing, setEditing] = useState(false)
  const [editEntry, setEditEntry] = useState<DiaryEntry | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('😊')
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)

  useEffect(() => {
    if (unlocked) {
      loadDiaryDB().then(setEntries)
    }
  }, [unlocked])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pw) return
    setCheckingPw(true)
    const isValid = await verifyAdminPassword(pw)
    setCheckingPw(false)
    
    if (isValid) {
      setUnlocked(true)
      setPwError(false)
    } else {
      setPwError(true)
      setPw('')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    const entry: DiaryEntry = {
      id: editEntry?.id ?? generateUUID(),
      date: editEntry?.date ?? new Date().toISOString().slice(0, 10),
      title: title.trim(),
      content: content.trim(),
      mood,
    }
    
    await saveDiaryDB(entry)
    
    setEntries(prev => {
      const exists = prev.find(e => e.id === entry.id)
      let next = exists ? prev.map(e => e.id === entry.id ? entry : e) : [entry, ...prev]
      next.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return next
    })
    
    setEditing(false)
    setEditEntry(null)
    setTitle('')
    setContent('')
    setMood('😊')
  }

  const handleDelete = async (id: string) => {
    await deleteDiaryDB(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setSelectedEntry(null)
  }

  const startEdit = (entry: DiaryEntry) => {
    setEditEntry(entry)
    setTitle(entry.title)
    setContent(entry.content)
    setMood(entry.mood)
    setEditing(true)
    setSelectedEntry(null)
  }

  const startNew = () => {
    setEditEntry(null)
    setTitle('')
    setContent('')
    setMood('😊')
    setEditing(true)
  }

  // 잠금 화면
  if (!unlocked) {
    return (
      <div className="modal-backdrop z-editor" onClick={onClose}>
        <div className="modal diary-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>&times;</button>
          <div className="diary-lock">
            <span className="diary-lock-icon">🔒</span>
            <h2 className="modal-title">비밀 일기장</h2>
            <p className="modal-desc">이 일기장은 비밀번호로 보호됩니다.</p>
            <form onSubmit={handleUnlock} className="password-form">
              <input
                type="password"
                value={pw}
                onChange={e => { setPw(e.target.value); setPwError(false) }}
                placeholder="비밀번호"
                className={`password-input ${pwError ? 'input-error' : ''}`}
                autoFocus
                autoComplete="off"
                disabled={checkingPw}
              />
              {pwError && <p className="error-text">비밀번호가 올바르지 않습니다.</p>}
              <button type="submit" className="btn-primary" disabled={checkingPw}>
                {checkingPw ? '확인 중...' : '열기 🔑'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // 일기 읽기
  if (selectedEntry) {
    return (
      <div className="modal-backdrop z-editor" onClick={onClose}>
        <div className="modal diary-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedEntry(null)}>&times;</button>
          <div className="diary-read">
            <span className="diary-mood-big">{selectedEntry.mood}</span>
            <p className="diary-read-date">{selectedEntry.date}</p>
            <h2 className="diary-read-title">{selectedEntry.title}</h2>
            <div className="diary-read-content">{selectedEntry.content}</div>
            <div className="diary-read-actions">
              <button className="btn-secondary btn-sm" onClick={() => startEdit(selectedEntry)}>수정</button>
              <button className="btn-danger btn-sm" onClick={() => handleDelete(selectedEntry.id)}>삭제</button>
              <button className="btn-secondary btn-sm" onClick={() => setSelectedEntry(null)}>목록</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 일기 작성/수정
  if (editing) {
    return (
      <div className="modal-backdrop z-editor" onClick={onClose}>
        <div className="modal diary-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setEditing(false)}>&times;</button>
          <h2 className="modal-title">{editEntry ? '일기 수정' : '새 일기 쓰기'} ✍️</h2>
          <div className="diary-form">
            <div className="diary-mood-picker">
              {MOODS.map(m => (
                <button
                  key={m}
                  className={`diary-mood-btn ${mood === m ? 'active' : ''}`}
                  onClick={() => setMood(m)}
                >{m}</button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="오늘의 제목"
              className="diary-title-input"
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="오늘 하루는 어땠나요? ✨"
              className="diary-content-input"
              rows={8}
            />
            <div className="editor-actions">
              <button className="btn-secondary" onClick={() => setEditing(false)}>취소</button>
              <button className="btn-primary" onClick={handleSave}>저장하기</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 일기 목록
  return (
    <div className="modal-backdrop z-editor" onClick={onClose}>
      <div className="modal diary-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">📖 비밀 일기장</h2>
        <p className="modal-desc">나만의 비밀스러운 이야기를 적어보세요</p>

        <button className="btn-primary diary-new-btn" onClick={startNew}>
          ✍️ 새 일기 쓰기
        </button>

        {entries.length === 0 ? (
          <div className="diary-empty">
            <p>아직 일기가 없어요.</p>
            <p>첫 번째 일기를 써보세요! 📝</p>
          </div>
        ) : (
          <div className="diary-list">
            {entries.map(entry => (
              <button
                key={entry.id}
                className="diary-item"
                onClick={() => setSelectedEntry(entry)}
              >
                <span className="diary-item-mood">{entry.mood}</span>
                <div className="diary-item-info">
                  <span className="diary-item-title">{entry.title}</span>
                  <span className="diary-item-date">{entry.date}</span>
                </div>
                <span className="diary-item-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
