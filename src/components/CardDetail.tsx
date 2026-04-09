import { GalleryCard } from '../types'

interface Props {
  card: GalleryCard
  isAuthenticated: boolean
  liked: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onLike: () => void
  onClose: () => void
}

export default function CardDetail({ card, isAuthenticated, liked, onEdit, onDelete, onLike, onClose }: Props) {
  const isVideo = card.mediaType === 'video'

  return (
    <div className="modal-backdrop z-detail" onClick={onClose}>
      <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="detail-image-wrap">
          {isVideo ? (
            <video
              src={card.mediaUrl}
              className="detail-image"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img src={card.mediaUrl} alt={card.title} className="detail-image" />
          )}
        </div>
        <div className="detail-content">
          <span className="card-category">{card.category}</span>
          <h2 className="detail-title">{card.title}</h2>
          <p className="detail-desc">{card.description}</p>
          <p className="detail-date">{card.createdAt}</p>

          {/* 하트 좋아요 버튼 */}
          <button
            className={`detail-heart-btn ${liked ? 'liked' : ''}`}
            onClick={onLike}
          >
            <span className="detail-heart-icon">{liked ? '❤️' : '🤍'}</span>
            <span className="detail-heart-text">
              {liked ? '좋아요 취소' : '좋아요'}
            </span>
            <span className="detail-heart-count">{card.likes}</span>
          </button>

          {isAuthenticated && (
            <div className="detail-actions">
              <button className="btn-secondary" onClick={() => onEdit(card.id)}>
                수정
              </button>
              <button className="btn-danger" onClick={() => onDelete(card.id)}>
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
