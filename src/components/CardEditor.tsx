import { useState, useRef } from 'react'
import { GalleryCard } from '../types'
import { uploadMedia } from '../storage'

interface Props {
  card: GalleryCard | null
  categories: string[]
  onSave: (card: GalleryCard) => void
  onClose: () => void
}

function detectMediaType(url: string): 'image' | 'video' {
  const lower = url.toLowerCase()
  if (lower.startsWith('data:video/') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(lower)) {
    return 'video'
  }
  return 'image'
}

export default function CardEditor({ card, categories, onSave, onClose }: Props) {
  const isNew = card === null
  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [mediaUrl, setMediaUrl] = useState(card?.mediaUrl ?? '')
  const [mediaType, setMediaType] = useState<'image' | 'video'>(card?.mediaType ?? 'image')
  const [category, setCategory] = useState(card?.category ?? categories[0])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // 파일 선택 시 → Supabase Storage에 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const publicUrl = await uploadMedia(file)   // Supabase Storage 업로드
      setMediaUrl(publicUrl)
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
    } catch (err) {
      console.error('업로드 실패:', err)
      alert('파일 업로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !mediaUrl.trim()) return

    const saved: GalleryCard = {
      id: card?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      mediaUrl: mediaUrl.trim(),
      mediaType: detectMediaType(mediaUrl) === 'video' ? 'video' : mediaType,
      category,
      createdAt: card?.createdAt ?? new Date().toISOString().slice(0, 10),
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

          {/* File attachment */}
          <div className="form-label">
            미디어 파일
            <div
              className="file-upload-area"
              onClick={() => fileRef.current?.click()}
              style={uploading ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
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
                    : '클릭하여 파일 선택 (jpg, png, mp4, webm)'}
                </span>
              </div>
            </div>
          </div>

          <label className="form-label">
            카테고리
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* Preview */}
          {mediaUrl && (
            <div className="preview-media">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls autoPlay muted playsInline className="preview-video" />
              ) : (
                <img
                  src={mediaUrl}
                  alt="미리보기"
                  className="preview-img"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
          )}

          <div className="editor-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {isNew ? '등록하기' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
