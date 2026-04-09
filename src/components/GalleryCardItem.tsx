import { GalleryCard } from '../types'

interface Props {
  card: GalleryCard
  index: number
  liked: boolean
  onClick: () => void
  onLike: (e: React.MouseEvent) => void
}

export default function GalleryCardItem({ card, index, liked, onClick, onLike }: Props) {
  const isVideo = card.mediaType === 'video'

  return (
    <article
      className="card"
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={onClick}
    >
      <div className="card-frame">
        <div className="card-image-wrap">
          {isVideo ? (
            <video
              src={card.mediaUrl}
              className="card-image"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={card.mediaUrl}
              alt={card.title}
              className="card-image"
              loading="lazy"
            />
          )}
          <div className="card-overlay" />
          {isVideo && <span className="card-video-badge">▶ 영상</span>}
        </div>
      </div>
      <div className="card-info">
        <span className="card-category">{card.category}</span>
        <h3 className="card-title">{card.title}</h3>
        <p className="card-desc">{card.description}</p>
        <button
          className={`card-heart-btn ${liked ? 'liked' : ''}`}
          onClick={onLike}
          aria-label="좋아요"
        >
          <span className="heart-icon">{liked ? '❤️' : '🤍'}</span>
          <span className="heart-count">{card.likes}</span>
        </button>
      </div>
    </article>
  )
}
