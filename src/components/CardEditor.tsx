import { useState } from 'react'
import { GalleryCard } from '../types'

interface Props {
  card: GalleryCard | null
  onSave: (card: GalleryCard) => void
  onClose: () => void
}

const CATEGORIES = ['풍경', '자연', '일상', '공간', '예술', '기타']

export default function CardEditor({ card, onSave, onClose }: Props) {
  const isNew = card === null
  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [imageUrl, setImageUrl] = useState(card?.imageUrl ?? '')
  const [category, setCategory] = useState(card?.category ?? CATEGORIES[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !imageUrl.trim()) return

    const saved: GalleryCard = {
      id: card?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      category,
      createdAt: card?.createdAt ?? new Date().toISOString().slice(0, 10),
    }
    onSave(saved)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal editor-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">{isNew ? '새 작품 등록' : '작품 수정'}</h2>
        <form onSubmit={handleSubmit} className="editor-form">
          <label className="form-label">
            제목
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="작품의 제목을 입력하세요"
              required
            />
          </label>
          <label className="form-label">
            설명
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="작품에 대한 설명을 적어주세요"
              rows={3}
            />
          </label>
          <label className="form-label">
            이미지 URL
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
            />
          </label>
          <label className="form-label">
            카테고리
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          {imageUrl && (
            <div className="preview-image">
              <img src={imageUrl} alt="미리보기" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <div className="editor-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              {isNew ? '등록하기' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
