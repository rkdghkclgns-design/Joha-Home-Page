import { GalleryCard } from '../types'

interface Props {
  card: GalleryCard
  index: number
  onClick: () => void
}

export default function GalleryCardItem({ card, index, onClick }: Props) {
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
      </div>
    </article>
  )
}
