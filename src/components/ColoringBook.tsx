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

export default function ColoringBook({ onClose }: Props) {
  const [originalSrc, setOriginalSrc] = useState<string | null>(null)
  const [outlineSrc, setOutlineSrc] = useState<string | null>(null)
  const [brushColor, setBrushColor] = useState('#FF0000')
  const [brushSize, setBrushSize] = useState(8)
  const [tool, setTool] = useState<ToolType>('pen')
  const [isDrawing, setIsDrawing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)

  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const dims = useRef({ w: 0, h: 0 })

  // ── 이미지 → 아웃라인 변환 (Sobel Edge Detection) ──
  const generateOutline = useCallback((imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const w = Math.min(img.naturalWidth, 800)
        const h = Math.round((img.naturalHeight / img.naturalWidth) * w)
        dims.current = { w, h }

        const off = document.createElement('canvas')
        off.width = w
        off.height = h
        const ctx = off.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(img, 0, 0, w, h)

        const imgData = ctx.getImageData(0, 0, w, h)
        const px = imgData.data

        // 1) grayscale + gaussian blur (3x3)
        const gray = new Float32Array(w * h)
        for (let i = 0; i < w * h; i++) {
          gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]
        }

        // 간단 blur
        const blurred = new Float32Array(w * h)
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            let sum = 0
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                sum += gray[(y + dy) * w + (x + dx)]
              }
            }
            blurred[y * w + x] = sum / 9
          }
        }

        // 2) Sobel
        const edges = new Float32Array(w * h)
        let maxEdge = 0
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x
            const gx =
              -blurred[(y-1)*w+(x-1)] + blurred[(y-1)*w+(x+1)]
              -2*blurred[y*w+(x-1)] + 2*blurred[y*w+(x+1)]
              -blurred[(y+1)*w+(x-1)] + blurred[(y+1)*w+(x+1)]
            const gy =
              -blurred[(y-1)*w+(x-1)] -2*blurred[(y-1)*w+x] -blurred[(y-1)*w+(x+1)]
              +blurred[(y+1)*w+(x-1)] +2*blurred[(y+1)*w+x] +blurred[(y+1)*w+(x+1)]
            edges[i] = Math.sqrt(gx*gx + gy*gy)
            if (edges[i] > maxEdge) maxEdge = edges[i]
          }
        }

        // 3) adaptive threshold → 흰 배경 + 검정 선
        const threshold = maxEdge * 0.12
        for (let i = 0; i < w * h; i++) {
          const v = edges[i] > threshold ? 0 : 255
          px[i*4] = v
          px[i*4+1] = v
          px[i*4+2] = v
          px[i*4+3] = 255
        }
        ctx.putImageData(imgData, 0, 0)

        resolve(off.toDataURL('image/png'))
      }
      img.src = imgSrc
    })
  }, [])

  // ── outlineSrc가 세팅된 뒤, 캔버스에 그리기 ──
  useEffect(() => {
    if (!outlineSrc) { setCanvasReady(false); return }

    const img = new Image()
    img.onload = () => {
      const olc = outlineCanvasRef.current
      const dc = drawCanvasRef.current
      if (!olc || !dc) return

      const { w, h } = dims.current
      olc.width = w
      olc.height = h
      olc.getContext('2d')!.drawImage(img, 0, 0, w, h)

      dc.width = w
      dc.height = h
      dc.getContext('2d')!.clearRect(0, 0, w, h)

      setCanvasReady(true)
    }
    img.src = outlineSrc
  }, [outlineSrc])

  // ── 파일 업로드 ──
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const src = reader.result as string
      setOriginalSrc(src)
      const outline = await generateOutline(src)
      setOutlineSrc(outline)
      setProcessing(false)
    }
    reader.readAsDataURL(file)
  }

  // ── 좌표 계산 ──
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

  // ── 스프레이 효과 ──
  const sprayAt = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const density = Math.floor(size * 2)
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * size
      const sx = x + Math.cos(angle) * radius
      const sy = y + Math.sin(angle) * radius
      ctx.fillStyle = brushColor
      ctx.globalAlpha = 0.3 + Math.random() * 0.4
      ctx.fillRect(sx, sy, 1, 1)
    }
    ctx.globalAlpha = 1
  }

  // ── 크레파스 효과 ──
  const crayonStroke = (ctx: CanvasRenderingContext2D, from: {x:number;y:number}, to: {x:number;y:number}, size: number) => {
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) / 2
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps
      const cx = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 2
      const cy = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 2
      ctx.globalAlpha = 0.15 + Math.random() * 0.25
      ctx.fillStyle = brushColor
      ctx.beginPath()
      ctx.arc(cx, cy, size / 2 * (0.6 + Math.random() * 0.4), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // ── 채우기 (flood fill) ──
  const floodFill = (startX: number, startY: number) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { width: w, height: h } = canvas
    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data

    const sx = Math.round(startX)
    const sy = Math.round(startY)
    const startIdx = (sy * w + sx) * 4
    const startR = data[startIdx], startG = data[startIdx+1], startB = data[startIdx+2], startA = data[startIdx+3]

    // parse fill color
    const fillR = parseInt(brushColor.slice(1,3), 16)
    const fillG = parseInt(brushColor.slice(3,5), 16)
    const fillB = parseInt(brushColor.slice(5,7), 16)

    if (startR === fillR && startG === fillG && startB === fillB && startA === 255) return

    const tolerance = 40
    const match = (i: number) => {
      return Math.abs(data[i] - startR) <= tolerance &&
             Math.abs(data[i+1] - startG) <= tolerance &&
             Math.abs(data[i+2] - startB) <= tolerance &&
             Math.abs(data[i+3] - startA) <= tolerance
    }

    const stack = [[sx, sy]]
    const visited = new Uint8Array(w * h)

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!
      const pi = cy * w + cx
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue
      if (visited[pi]) continue
      const idx = pi * 4
      if (!match(idx)) continue

      visited[pi] = 1
      data[idx] = fillR
      data[idx+1] = fillG
      data[idx+2] = fillB
      data[idx+3] = 255

      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1])
    }

    ctx.putImageData(imgData, 0, 0)
  }

  // ── 드로잉 핸들러 ──
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPos(e)

    if (tool === 'fill') {
      floodFill(pos.x, pos.y)
      return
    }

    setIsDrawing(true)
    lastPos.current = pos

    // 단일 점 찍기
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx) return
    if (tool === 'spray') {
      sprayAt(ctx, pos.x, pos.y, brushSize)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'fill') return
    e.preventDefault()
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (!ctx || !lastPos.current) return
    const pos = getPos(e)

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    } else if (tool === 'pen') {
      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (tool === 'marker') {
      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushSize * 1.8
      ctx.lineCap = 'square'
      ctx.lineJoin = 'miter'
      ctx.globalAlpha = 0.45
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.globalAlpha = 1
    } else if (tool === 'crayon') {
      crayonStroke(ctx, lastPos.current, pos, brushSize)
    } else if (tool === 'spray') {
      sprayAt(ctx, pos.x, pos.y, brushSize)
    }

    lastPos.current = pos
  }

  const stopDraw = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearCanvas = () => {
    const c = drawCanvasRef.current
    if (!c) return
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
  }

  const handleDownload = () => {
    const olc = outlineCanvasRef.current
    const dc = drawCanvasRef.current
    if (!olc || !dc) return
    const merged = document.createElement('canvas')
    merged.width = olc.width
    merged.height = olc.height
    const ctx = merged.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, merged.width, merged.height)
    ctx.drawImage(dc, 0, 0)
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(olc, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    const a = document.createElement('a')
    a.download = 'juha-coloring-book.png'
    a.href = merged.toDataURL('image/png')
    a.click()
  }

  // 터치 스크롤 방지
  useEffect(() => {
    const c = drawCanvasRef.current
    if (!c) return
    const prevent = (e: TouchEvent) => { if (isDrawing) e.preventDefault() }
    c.addEventListener('touchmove', prevent, { passive: false })
    return () => c.removeEventListener('touchmove', prevent)
  }, [isDrawing, canvasReady])

  const resetAll = () => {
    setOutlineSrc(null)
    setOriginalSrc(null)
    setShowOriginal(false)
    setCanvasReady(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="modal-backdrop z-editor" onClick={onClose}>
      <div className="modal coloring-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">🎨 컬러링북</h2>
        <p className="modal-desc">사진을 올리면 색칠할 수 있는 도안이 만들어집니다!</p>

        {!outlineSrc ? (
          /* ── 업로드 / 진행 화면 ── */
          <div className="coloring-upload">
            {processing ? (
              <div className="coloring-progress">
                <div className="coloring-progress-spinner" />
                <p className="coloring-progress-title">도안을 만들고 있어요...</p>
                <p className="coloring-progress-sub">사진의 윤곽선을 추출하는 중입니다 ✨</p>
                <div className="coloring-progress-bar">
                  <div className="coloring-progress-fill" />
                </div>
              </div>
            ) : (
              <div
                className="file-upload-area"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="file-input-hidden"
                />
                <div className="file-upload-content">
                  <span className="file-upload-icon">🖼️</span>
                  <span className="file-upload-text">사진을 선택하세요</span>
                  <span className="file-upload-hint">jpg, png 이미지</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── 작업 화면 ── */
          <div className="coloring-workspace">
            {/* 도구 바 */}
            <div className="coloring-toolbar">
              {/* 펜 종류 선택 */}
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

              {/* 색상 팔레트 */}
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

              {/* 브러시 크기 */}
              <div className="brush-sizes">
                <span className="brush-label">크기</span>
                {SIZES.map(s => (
                  <button
                    key={s}
                    className={`brush-size-btn ${brushSize === s ? 'active' : ''}`}
                    onClick={() => setBrushSize(s)}
                  >
                    <span
                      className="brush-dot"
                      style={{ width: Math.min(s, 20), height: Math.min(s, 20) }}
                    />
                  </button>
                ))}
              </div>

              {/* 액션 버튼 */}
              <div className="coloring-actions-row">
                <button className="btn-secondary btn-sm" onClick={clearCanvas}>
                  🗑️ 전체 지우기
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setShowOriginal(p => !p)}
                >
                  {showOriginal ? '🎨 도안 보기' : '🖼️ 원본 보기'}
                </button>
                <button className="btn-primary btn-sm" onClick={handleDownload}>
                  💾 다운로드
                </button>
              </div>
            </div>

            {/* 캔버스 영역 */}
            <div className="coloring-canvas-area">
              {showOriginal && originalSrc ? (
                <img src={originalSrc} alt="원본" className="coloring-original-preview" />
              ) : (
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
              )}
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
