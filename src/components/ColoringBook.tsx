import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  onClose: () => void
}

type ToolType = 'pen' | 'marker' | 'crayon' | 'spray' | 'fill' | 'eraser'

const PALETTE = [
  '#FF0000', '#FF4444', '#FF6B6B', '#FF8C00', '#FFA500', '#FFD700',
  '#ADFF2F', '#32CD32', '#00A86B', '#00CED1', '#1E90FF', '#4169E1',
  '#6A5ACD', '#9370DB', '#FF69B4', '#FF1493', '#8B4513', '#D2691E',
  '#2F4F4F', '#000000', '#808080', '#C0C0C0', '#FFFFFF', '#F5DEB3',
]

const TOOLS: { type: ToolType; icon: string; label: string }[] = [
  { type: 'pen', icon: '✏️', label: '펜' },
  { type: 'marker', icon: '🖊️', label: '마커' },
  { type: 'crayon', icon: '🖍️', label: '크레파스' },
  { type: 'spray', icon: '💨', label: '스프레이' },
  { type: 'fill', icon: '🪣', label: '채우기' },
  { type: 'eraser', icon: '🧹', label: '지우개' },
]

const SIZES = [3, 8, 16, 30, 48]

// 추천 도안 (SVG 인라인 생성 — 저작권 무료)
const TEMPLATES = [
  { name: '🌸 꽃', svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="70" r="25" fill="none" stroke="#333" stroke-width="2"/><circle cx="70" cy="100" r="25" fill="none" stroke="#333" stroke-width="2"/><circle cx="130" cy="100" r="25" fill="none" stroke="#333" stroke-width="2"/><circle cx="80" cy="130" r="25" fill="none" stroke="#333" stroke-width="2"/><circle cx="120" cy="130" r="25" fill="none" stroke="#333" stroke-width="2"/><circle cx="100" cy="100" r="15" fill="none" stroke="#333" stroke-width="2"/><line x1="100" y1="155" x2="100" y2="195" stroke="#333" stroke-width="2"/><path d="M100 170 Q80 160 75 175" fill="none" stroke="#333" stroke-width="2"/><path d="M100 180 Q120 170 125 185" fill="none" stroke="#333" stroke-width="2"/></svg>` },
  { name: '🦋 나비', svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M100 60 Q60 20 30 50 Q10 80 50 100 Q10 120 30 150 Q60 180 100 140" fill="none" stroke="#333" stroke-width="2"/><path d="M100 60 Q140 20 170 50 Q190 80 150 100 Q190 120 170 150 Q140 180 100 140" fill="none" stroke="#333" stroke-width="2"/><line x1="100" y1="60" x2="100" y2="140" stroke="#333" stroke-width="2"/><circle cx="70" cy="70" r="8" fill="none" stroke="#333" stroke-width="1.5"/><circle cx="130" cy="70" r="8" fill="none" stroke="#333" stroke-width="1.5"/><circle cx="60" cy="120" r="6" fill="none" stroke="#333" stroke-width="1.5"/><circle cx="140" cy="120" r="6" fill="none" stroke="#333" stroke-width="1.5"/><path d="M90 55 Q85 30 80 25" fill="none" stroke="#333" stroke-width="1.5"/><path d="M110 55 Q115 30 120 25" fill="none" stroke="#333" stroke-width="1.5"/><circle cx="80" cy="23" r="3" fill="#333"/><circle cx="120" cy="23" r="3" fill="#333"/></svg>` },
  { name: '⭐ 별', svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><polygon points="100,20 120,75 180,80 135,120 150,178 100,145 50,178 65,120 20,80 80,75" fill="none" stroke="#333" stroke-width="2"/><circle cx="85" cy="90" r="5" fill="none" stroke="#333" stroke-width="1.5"/><circle cx="115" cy="90" r="5" fill="none" stroke="#333" stroke-width="1.5"/><path d="M90 110 Q100 120 110 110" fill="none" stroke="#333" stroke-width="1.5"/></svg>` },
  { name: '🏠 집', svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><polygon points="100,30 20,100 40,100 40,170 160,170 160,100 180,100" fill="none" stroke="#333" stroke-width="2"/><rect x="60" y="100" width="30" height="30" fill="none" stroke="#333" stroke-width="2"/><rect x="110" y="100" width="30" height="30" fill="none" stroke="#333" stroke-width="2"/><rect x="80" y="130" width="40" height="40" fill="none" stroke="#333" stroke-width="2"/><circle cx="112" cy="150" r="3" fill="#333"/><rect x="85" y="60" width="15" height="25" fill="none" stroke="#333" stroke-width="2"/></svg>` },
  { name: '🐱 고양이', svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="100" cy="120" rx="50" ry="55" fill="none" stroke="#333" stroke-width="2"/><circle cx="100" cy="80" r="35" fill="none" stroke="#333" stroke-width="2"/><polygon points="72,55 65,25 85,50" fill="none" stroke="#333" stroke-width="2"/><polygon points="128,55 135,25 115,50" fill="none" stroke="#333" stroke-width="2"/><circle cx="88" cy="75" r="5" fill="none" stroke="#333" stroke-width="2"/><circle cx="112" cy="75" r="5" fill="none" stroke="#333" stroke-width="2"/><ellipse cx="100" cy="88" rx="4" ry="3" fill="#333"/><path d="M96 93 Q100 98 104 93" fill="none" stroke="#333" stroke-width="1.5"/><line x1="65" y1="85" x2="40" y2="80" stroke="#333" stroke-width="1.5"/><line x1="65" y1="90" x2="40" y2="92" stroke="#333" stroke-width="1.5"/><line x1="135" y1="85" x2="160" y2="80" stroke="#333" stroke-width="1.5"/><line x1="135" y1="90" x2="160" y2="92" stroke="#333" stroke-width="1.5"/><path d="M60 170 Q80 185 100 175 Q120 185 140 170" fill="none" stroke="#333" stroke-width="2"/></svg>` },
  { name: '🌈 무지개', svg: `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><path d="M10 110 A90 90 0 0 1 190 110" fill="none" stroke="#333" stroke-width="2"/><path d="M25 110 A75 75 0 0 1 175 110" fill="none" stroke="#333" stroke-width="2"/><path d="M40 110 A60 60 0 0 1 160 110" fill="none" stroke="#333" stroke-width="2"/><path d="M55 110 A45 45 0 0 1 145 110" fill="none" stroke="#333" stroke-width="2"/><path d="M70 110 A30 30 0 0 1 130 110" fill="none" stroke="#333" stroke-width="2"/><ellipse cx="25" cy="110" rx="20" ry="12" fill="none" stroke="#333" stroke-width="1.5"/><ellipse cx="175" cy="110" rx="20" ry="12" fill="none" stroke="#333" stroke-width="1.5"/></svg>` },
]

function svgToDataUrl(svgStr: string, w: number, h: number): Promise<string> {
  return new Promise(resolve => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/png'))
    }
    img.src = url
  })
}

// ── 고품질 아웃라인 생성 (Canny-style) ──
function generateHighQualityOutline(imgSrc: string): Promise<{ outline: string; w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // 고해상도 유지 (최대 1200px)
      const maxDim = 1200
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)

      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const ctx = off.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0, w, h)

      const imgData = ctx.getImageData(0, 0, w, h)
      const worker = new Worker(new URL('../workers/cannyWorker.ts', import.meta.url), { type: 'module' })
      worker.postMessage({ pixels: imgData.data.buffer, w, h }, [imgData.data.buffer])
      
      worker.onmessage = (e) => {
        const outPixels = new Uint8ClampedArray(e.data.pixels)
        const outData = new ImageData(outPixels, w, h)
        ctx.putImageData(outData, 0, 0)
        resolve({ outline: off.toDataURL('image/png'), w, h })
        worker.terminate()
      }
    }
    img.src = imgSrc
  })
}

export default function ColoringBook({ onClose }: Props) {
  const [originalSrc, setOriginalSrc] = useState<string | null>(null)
  const [outlineSrc, setOutlineSrc] = useState<string | null>(null)
  const [brushColor, setBrushColor] = useState('#FF0000')
  const [brushSize, setBrushSize] = useState(8)
  const [tool, setTool] = useState<ToolType>('pen')
  const [isDrawing, setIsDrawing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showSideBySide, setShowSideBySide] = useState(false)

  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const dims = useRef({ w: 0, h: 0 })

  // outlineSrc 변경 후 캔버스 세팅 (기존 그림 보존!)
  const initCanvasFromOutline = useCallback((src: string) => {
    const img = new Image()
    img.onload = () => {
      const olc = outlineCanvasRef.current
      const dc = drawCanvasRef.current
      if (!olc || !dc) return

      const { w, h } = dims.current

      // outline 캔버스만 다시 그림
      olc.width = w
      olc.height = h
      olc.getContext('2d')!.drawImage(img, 0, 0, w, h)

      // draw 캔버스: 크기만 맞추되 기존 내용이 없으면 초기화
      if (dc.width !== w || dc.height !== h) {
        dc.width = w
        dc.height = h
      }
    }
    img.src = src
  }, [])

  useEffect(() => {
    if (outlineSrc) initCanvasFromOutline(outlineSrc)
  }, [outlineSrc, initCanvasFromOutline])

  // 파일 업로드
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const src = reader.result as string
      setOriginalSrc(src)
      const { outline, w, h } = await generateHighQualityOutline(src)
      dims.current = { w, h }
      setOutlineSrc(outline)
      setProcessing(false)
    }
    reader.readAsDataURL(file)
  }

  // 추천 도안 로드
  const loadTemplate = async (tpl: typeof TEMPLATES[number]) => {
    setProcessing(true)
    const size = 600
    const dataUrl = await svgToDataUrl(tpl.svg, size, size)
    dims.current = { w: size, h: size }
    setOriginalSrc(dataUrl)
    setOutlineSrc(dataUrl) // SVG 도안은 이미 아웃라인
    setProcessing(false)
  }

  // 좌표
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = drawCanvasRef.current!
    const r = c.getBoundingClientRect()
    const sx = c.width / r.width
    const sy = c.height / r.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy }
    }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }
  }

  const sprayAt = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const density = Math.floor(size * 2.5)
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * size
      ctx.fillStyle = brushColor
      ctx.globalAlpha = 0.2 + Math.random() * 0.5
      ctx.fillRect(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, 1.5, 1.5)
    }
    ctx.globalAlpha = 1
  }

  const crayonStroke = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, size: number) => {
    const dist = Math.hypot(to.x - from.x, to.y - from.y)
    const steps = Math.max(dist / 1.5, 1)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const cx = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 3
      const cy = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 3
      ctx.globalAlpha = 0.1 + Math.random() * 0.2
      ctx.fillStyle = brushColor
      ctx.beginPath()
      ctx.arc(cx, cy, size / 2 * (0.5 + Math.random() * 0.5), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  const floodFill = (startX: number, startY: number) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data

    const sx = Math.round(startX)
    const sy = Math.round(startY)
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return

    const startIdx = (sy * w + sx) * 4
    const sR = data[startIdx], sG = data[startIdx + 1], sB = data[startIdx + 2], sA = data[startIdx + 3]
    const fR = parseInt(brushColor.slice(1, 3), 16)
    const fG = parseInt(brushColor.slice(3, 5), 16)
    const fB = parseInt(brushColor.slice(5, 7), 16)

    if (sR === fR && sG === fG && sB === fB && sA === 255) return

    const tol = 40
    const match = (i: number) =>
      Math.abs(data[i] - sR) <= tol && Math.abs(data[i + 1] - sG) <= tol &&
      Math.abs(data[i + 2] - sB) <= tol && Math.abs(data[i + 3] - sA) <= tol

    const visited = new Uint8Array(w * h)
    const stack = [[sx, sy]]
    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue
      const pi = cy * w + cx
      if (visited[pi]) continue
      const idx = pi * 4
      if (!match(idx)) continue
      visited[pi] = 1
      data[idx] = fR; data[idx + 1] = fG; data[idx + 2] = fB; data[idx + 3] = 255
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
    }
    ctx.putImageData(imgData, 0, 0)
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPos(e)
    if (tool === 'fill') { floodFill(pos.x, pos.y); return }
    setIsDrawing(true)
    lastPos.current = pos
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (ctx && tool === 'spray') sprayAt(ctx, pos.x, pos.y, brushSize)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'fill') return
    e.preventDefault()
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx || !lastPos.current) return
    const pos = getPos(e)

    switch (tool) {
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = brushSize; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y); ctx.stroke()
        ctx.globalCompositeOperation = 'source-over'
        break
      case 'pen':
        ctx.strokeStyle = brushColor; ctx.lineWidth = brushSize
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1
        ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y); ctx.stroke()
        break
      case 'marker':
        ctx.strokeStyle = brushColor; ctx.lineWidth = brushSize * 2
        ctx.lineCap = 'square'; ctx.lineJoin = 'miter'; ctx.globalAlpha = 0.4
        ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.globalAlpha = 1
        break
      case 'crayon':
        crayonStroke(ctx, lastPos.current, pos, brushSize)
        break
      case 'spray':
        sprayAt(ctx, pos.x, pos.y, brushSize)
        break
    }
    lastPos.current = pos
  }

  const stopDraw = () => { setIsDrawing(false); lastPos.current = null }

  const clearCanvas = () => {
    const c = drawCanvasRef.current
    if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
  }

  const handleDownload = () => {
    const olc = outlineCanvasRef.current
    const dc = drawCanvasRef.current
    if (!olc || !dc) return
    const m = document.createElement('canvas')
    m.width = olc.width; m.height = olc.height
    const ctx = m.getContext('2d')!
    ctx.fillStyle = '#FFF'; ctx.fillRect(0, 0, m.width, m.height)
    ctx.drawImage(dc, 0, 0)
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(olc, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    const a = document.createElement('a')
    a.download = 'juha-coloring-book.png'
    a.href = m.toDataURL('image/png')
    a.click()
  }

  useEffect(() => {
    const c = drawCanvasRef.current
    if (!c) return
    const prevent = (e: TouchEvent) => { e.preventDefault() }
    c.addEventListener('touchmove', prevent, { passive: false })
    return () => c.removeEventListener('touchmove', prevent)
  }, [outlineSrc])

  const resetAll = () => {
    setOutlineSrc(null); setOriginalSrc(null)
    setShowSideBySide(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="modal-backdrop z-editor" onClick={onClose}>
      <div className="modal coloring-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">🎨 컬러링북</h2>
        <p className="modal-desc">사진을 올리면 색칠할 수 있는 도안이 만들어집니다!</p>

        {!outlineSrc ? (
          <div className="coloring-upload">
            {processing ? (
              <div className="coloring-progress">
                <div className="coloring-progress-spinner" />
                <p className="coloring-progress-title">도안을 만들고 있어요...</p>
                <p className="coloring-progress-sub">Canny 엣지 검출로 고품질 윤곽선을 추출 중 ✨</p>
                <div className="coloring-progress-bar">
                  <div className="coloring-progress-fill" />
                </div>
              </div>
            ) : (
              <>
                <div className="file-upload-area" onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="file-input-hidden" />
                  <div className="file-upload-content">
                    <span className="file-upload-icon">🖼️</span>
                    <span className="file-upload-text">내 사진으로 도안 만들기</span>
                    <span className="file-upload-hint">jpg, png 이미지</span>
                  </div>
                </div>

                {/* 추천 도안 */}
                <div className="template-section">
                  <p className="template-title">✨ 추천 도안으로 바로 색칠하기</p>
                  <div className="template-grid">
                    {TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        className="template-card"
                        onClick={() => loadTemplate(tpl)}
                      >
                        <div
                          className="template-preview"
                          dangerouslySetInnerHTML={{ __html: tpl.svg }}
                        />
                        <span className="template-name">{tpl.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="coloring-workspace">
            {/* 도구 바 */}
            <div className="coloring-toolbar">
              <div className="tool-row">
                {TOOLS.map(t => (
                  <button
                    key={t.type}
                    className={`tool-btn ${tool === t.type ? 'active' : ''}`}
                    onClick={() => setTool(t.type)}
                    title={t.label}
                  >
                    <span className="tool-icon">{t.icon}</span>
                    <span className="tool-label">{t.label}</span>
                  </button>
                ))}
              </div>

              {tool !== 'eraser' && (
                <div className="palette-grid">
                  {PALETTE.map(color => (
                    <button
                      key={color}
                      className={`palette-swatch ${brushColor === color ? 'active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setBrushColor(color)}
                    />
                  ))}
                </div>
              )}

              <div className="brush-sizes">
                <span className="brush-label">크기</span>
                {SIZES.map(s => (
                  <button
                    key={s}
                    className={`brush-size-btn ${brushSize === s ? 'active' : ''}`}
                    onClick={() => setBrushSize(s)}
                  >
                    <span className="brush-dot" style={{ width: Math.min(s, 20), height: Math.min(s, 20) }} />
                  </button>
                ))}
              </div>

              <div className="coloring-actions-row">
                <button className="btn-secondary btn-sm" onClick={clearCanvas}>🗑️ 전체 지우기</button>
                <button
                  className={`btn-secondary btn-sm ${showSideBySide ? 'active-toggle' : ''}`}
                  onClick={() => setShowSideBySide(p => !p)}
                >
                  {showSideBySide ? '🎨 도안만' : '🖼️ 원본 비교'}
                </button>
                <button className="btn-primary btn-sm" onClick={handleDownload}>💾 다운로드</button>
              </div>
            </div>

            {/* 캔버스 영역 — 원본은 항상 캔버스 옆에 (side-by-side) */}
            <div className={`coloring-canvas-area ${showSideBySide ? 'side-by-side' : ''}`}>
              {/* 원본 프리뷰 (나란히 볼 때만 표시, 캔버스는 항상 유지!) */}
              {showSideBySide && originalSrc && (
                <div className="coloring-side original-side">
                  <span className="side-label">📷 원본</span>
                  <img src={originalSrc} alt="원본" className="coloring-original-preview" />
                </div>
              )}

              {/* 도안+그리기 캔버스 (항상 DOM에 유지 → 그림 보존) */}
              <div className={`coloring-side canvas-side ${showSideBySide ? '' : 'full-width'}`}>
                {showSideBySide && <span className="side-label">🎨 도안</span>}
                <div className="coloring-canvas-wrap">
                  <canvas ref={outlineCanvasRef} className="coloring-outline-layer" />
                  <canvas
                    ref={drawCanvasRef}
                    className="coloring-draw-layer"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
              </div>
            </div>

            <button className="btn-secondary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={resetAll}>
              다른 사진으로 바꾸기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
