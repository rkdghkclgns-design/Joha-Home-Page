import { GalleryCard } from '../types'

interface Props {
  card: GalleryCard
  isAuthenticated: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function CardDetail({ card, isAuthenticated, onEdit, onDelete, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="detail-image-wrap">
          <img src={card.imageUrl} alt={card.title} className="detail-image" />
        </div>
        <div className="detail-content">
          <span className="card-category">{card.category}</span>
          <h2 className="detail-title">{card.title}</h2>
          <p className="detail-desc">{card.description}</p>
          <p className="detail-date">{card.createdAt}</p>
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
