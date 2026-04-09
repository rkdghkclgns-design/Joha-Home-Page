const BASE = import.meta.env.BASE_URL

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-video-wrap">
        <video
          className="hero-video"
          src={`${BASE}hero.mp4`}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="hero-overlay" />
      </div>
      <div className="hero-content">
        <div className="header-ornament">✦</div>
        <h1 className="header-title">Juha</h1>
        <p className="header-subtitle">Gallery of Wonders</p>
        <div className="header-line" />
      </div>
    </section>
  )
}
