import { useState, useRef } from 'react'
import { GalleryCard, MediaItem } from '../types'
import { uploadMedia } from '../storage'

interface Props {
  card: GalleryCard | null
  categories: string[]
  onSave: (card: GalleryCard) => void
  onAddCategory?: (name: string) => void
  onClose: () => void
}

export default function CardEditor({ card, categories, onSave, onAddCategory, onClose }: Props) {
  const isNew = card === null
  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(card?.mediaItems ?? [])
  const [thumbnailIdx, setThumbnailIdx] = useState(() => {
    if (!card) return 0
    const idx = card.mediaItems.findIndex(m => m.url === card.mediaUrl)
    return idx >= 0 ? idx : 0
  })
  const [category, setCategory] = useState(card?.category ?? categories[0])
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCategoryChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomInput(true)
    } else {
      setCategory(value)
      setShowCustomInput(false)
    }
  }

  const handleAddCustomCategory = () => {
    const trimmed = customCategory.trim()
    if (!trimmed) return
    setCategory(trimmed)
    setShowCustomInput(false)
    setCustomCategory('')
    onAddCategory?.(trimmed)
  }

  // 복수 파일 선택 → Supabase Storage에 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newItems: MediaItem[] = []
      for (const file of Array.from(files)) {
        const publicUrl = await uploadMedia(file)
        newItems.push({
          url: publicUrl,
          type: file.type.startsWith('video/') ? 'video' : 'image',
        })
      }
      setMediaItems(prev => [...prev, ...newItems])
    } catch (err) {
      console.error('업로드 실패:', err)
      alert('파일 업로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeMedia = (idx: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== idx))
    if (thumbnailIdx === idx) setThumbnailIdx(0)
    else if (thumbnailIdx > idx) setThumbnailIdx(prev => prev - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || mediaItems.length === 0) return

    const thumb = mediaItems[thumbnailIdx] ?? mediaItems[0]
    const saved: GalleryCard = {
      id: card?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      mediaUrl: thumb.url,
      mediaType: thumb.type,
      mediaItems,
      category,
      createdAt: card?.createdAt ?? new Date().toISOString().slice(0, 10),
      likes: card?.likes ?? 0,
    }
    onSave(saved)
  }

  return (
    <div className="modal-backdrop z-editor" onClick={onClose}>
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

          {/* 복수 파일 업로드 */}
          <div className="form-label">
            미디어 파일 (복수 선택 가능)
            <div
              className="file-upload-area"
              onClick={() => fileRef.current?.click()}
              style={uploading ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="file-input-hidden"
              />
              <div className="file-upload-content">
                <span className="file-upload-icon">{uploading ? '⏳' : '📁'}</span>
                <span className="file-upload-text">
                  {uploading
                    ? '업로드 중...'
                    : '이미지 또는 동영상을 첨부하세요'}
                </span>
                <span className="file-upload-hint">
                  {uploading
                    ? '잠시만 기다려주세요'
                    : '클릭하여 여러 파일 선택 가능 (jpg, png, mp4, webm)'}
                </span>
              </div>
            </div>
          </div>

          {/* 미디어 목록 + 썸네일 지정 */}
          {mediaItems.length > 0 && (
            <div className="form-label">
              등록된 미디어 ({mediaItems.length}개) — ⭐ 클릭으로 썸네일 지정
              <div className="media-items-grid">
                {mediaItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`media-item-card ${idx === thumbnailIdx ? 'is-thumb' : ''}`}
                  >
                    {item.type === 'video' ? (
                      <video src={item.url} className="media-item-preview" muted />
                    ) : (
                      <img src={item.url} alt={`미디어 ${idx + 1}`} className="media-item-preview" />
                    )}
                    <div className="media-item-actions">
                      <button
                        type="button"
                        className={`thumb-btn ${idx === thumbnailIdx ? 'active' : ''}`}
                        onClick={() => setThumbnailIdx(idx)}
                        title="썸네일로 지정"
                      >
                        {idx === thumbnailIdx ? '⭐' : '☆'}
                      </button>
                      <span className="media-item-type">
                        {item.type === 'video' ? '🎬' : '🖼️'}
                      </span>
                      <button
                        type="button"
                        className="media-item-remove"
                        onClick={() => removeMedia(idx)}
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-label">
            카테고리
            <select
              value={showCustomInput ? '__custom__' : category}
              onChange={e => handleCategoryChange(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">✏️ 직접 입력</option>
            </select>
            {showCustomInput && (
              <div className="custom-category-row">
                <input
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="새 카테고리 이름"
                  className="category-input"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory() } }}
                  autoFocus
                />
                <button type="button" className="btn-primary btn-sm" onClick={handleAddCustomCategory}>
                  추가
                </button>
              </div>
            )}
          </div>

          <div className="editor-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={uploading || mediaItems.length === 0}>
              {isNew ? '등록하기' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
