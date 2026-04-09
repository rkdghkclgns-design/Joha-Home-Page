import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  onClose: () => void
}

type BrushSize = 4 | 8 | 16 | 28

const PALETTE = [
  '#FF0000', '#FF6B6B', '#FF8C00', '#FFD700',
  '#32CD32', '#00CED1', '#1E90FF', '#6A5ACD',
  '#FF69B4', '#8B4513', '#2F4F4F', '#000000',
  '#FFFFFF', '#F5DEB3', '#FFC0CB', '#E6E6FA',
]

export default function ColoringBook({ onClose }: Props) {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [outlineImage, setOutlineImage] = useState<string | null>(null)
  const [brushColor, setBrushColor] = useState('#FF0000')
  const [brushSize, setBrushSize] = useState<BrushSize>(8)
  const [isDrawing, setIsDrawing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // 이미지 → 아웃라인(흑백 엣지) 변환
  const convertToOutline = useCallback((img: HTMLImageElement) => {
    const w = Math.min(img.naturalWidth, 800)
    const h = Math.round((img.naturalHeight / img.naturalWidth) * w)

    // 아웃라인 레이어
    const offscreen = document.createElement('canvas')
    offscreen.width = w
    offscreen.height = h
    const octx = offscreen.getContext('2d')!
    octx.drawImage(img, 0, 0, w, h)

    const imageData = octx.getImageData(0, 0, w, h)
    const data = imageData.data

    // Sobel edge detection
    const gray = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
    }

    const edges = new Float32Array(w * h)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x
        const gx =
          -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)]
          - 2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)]
          - gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)]
        const gy =
          -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)]
          + gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)]
        edges[idx] = Math.sqrt(gx * gx + gy * gy)
      }
    }

    // 엣지를 흰 배경 + 검정 선으로 변환
    const threshold = 30
    for (let i = 0; i < w * h; i++) {
      const v = edges[i] > threshold ? 0 : 255
      data[i * 4] = v
      data[i * 4 + 1] = v
      data[i * 4 + 2] = v
      data[i * 4 + 3] = 255
    }
    octx.putImageData(imageData, 0, 0)

    // 아웃라인 이미지 저장
    setOutlineImage(offscreen.toDataURL())

    // 아웃라인 레이어 캔버스 세팅
    const olCanvas = outlineCanvasRef.current
    if (olCanvas) {
      olCanvas.width = w
      olCanvas.height = h
      const olCtx = olCanvas.getContext('2d')!
      olCtx.drawImage(offscreen, 0, 0)
    }

    // 그리기 캔버스 세팅 (투명)
    const drawCanvas = canvasRef.current
    if (drawCanvas) {
      drawCanvas.width = w
      drawCanvas.height = h
      const dctx = drawCanvas.getContext('2d')!
      dctx.clearRect(0, 0, w, h)
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      setOriginalImage(src)

      const img = new Image()
      img.onload = () => {
        convertToOutline(img)
        setProcessing(false)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // 그리기 핸들러
  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !lastPos.current) return

    const pos = getPos(e)
    ctx.strokeStyle = brushColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  // 전체 지우기
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // 다운로드 (아웃라인 + 컬러 합성)
  const handleDownload = () => {
    const outCanvas = outlineCanvasRef.current
    const drawCanvas = canvasRef.current
    if (!outCanvas || !drawCanvas) return

    const merged = document.createElement('canvas')
    merged.width = outCanvas.width
    merged.height = outCanvas.height
    const ctx = merged.getContext('2d')!

    // 흰 배경
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, merged.width, merged.height)
    // 컬러링 레이어
    ctx.drawImage(drawCanvas, 0, 0)
    // 아웃라인 레이어 (multiply 효과)
    ctx.globalCompositeOperation = 'multiply'
    ctx.drawImage(outCanvas, 0, 0)
    ctx.globalCompositeOperation = 'source-over'

    const link = document.createElement('a')
    link.download = 'juha-coloring-book.png'
    link.href = merged.toDataURL('image/png')
    link.click()
  }

  // 터치 스크롤 방지
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const prevent = (e: TouchEvent) => { if (isDrawing) e.preventDefault() }
    canvas.addEventListener('touchmove', prevent, { passive: false })
    return () => canvas.removeEventListener('touchmove', prevent)
  }, [isDrawing])

  return (
    <div className="modal-backdrop z-editor" onClick={onClose}>
      <div className="modal coloring-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">🎨 컬러링북</h2>
        <p className="modal-desc">사진을 올리면 색칠할 수 있는 도안이 만들어집니다!</p>

        {!outlineImage ? (
          <div className="coloring-upload">
            <div
              className="file-upload-area"
              onClick={() => fileRef.current?.click()}
              style={processing ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="file-input-hidden"
              />
              <div className="file-upload-content">
                <span className="file-upload-icon">{processing ? '⏳' : '🖼️'}</span>
                <span className="file-upload-text">
                  {processing ? '도안을 만드는 중...' : '사진을 선택하세요'}
                </span>
                <span className="file-upload-hint">jpg, png 이미지 파일</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="coloring-workspace">
            {/* 도구 바 */}
            <div className="coloring-toolbar">
              <div className="palette-grid">
                {PALETTE.map(color => (
                  <button
                    key={color}
                    className={`palette-swatch ${brushColor === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setBrushColor(color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="brush-sizes">
                {([4, 8, 16, 28] as BrushSize[]).map(s => (
                  <button
                    key={s}
                    className={`brush-size-btn ${brushSize === s ? 'active' : ''}`}
                    onClick={() => setBrushSize(s)}
                  >
                    <span className="brush-dot" style={{ width: s, height: s }} />
                  </button>
                ))}
              </div>
              <div className="coloring-actions-row">
                <button className="btn-secondary btn-sm" onClick={clearCanvas}>지우기</button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setShowOriginal(prev => !prev)}
                >
                  {showOriginal ? '도안 보기' : '원본 보기'}
                </button>
                <button className="btn-primary btn-sm" onClick={handleDownload}>💾 다운로드</button>
              </div>
            </div>

            {/* 캔버스 영역 */}
            <div className="coloring-canvas-area">
              {showOriginal && originalImage ? (
                <img src={originalImage} alt="원본" className="coloring-original-preview" />
              ) : (
                <div className="coloring-canvas-wrap">
                  <canvas ref={outlineCanvasRef} className="coloring-outline-layer" />
                  <canvas
                    ref={canvasRef}
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

            {/* 새 이미지 */}
            <button
              className="btn-secondary"
              style={{ marginTop: '0.75rem', width: '100%' }}
              onClick={() => {
                setOutlineImage(null)
                setOriginalImage(null)
                setShowOriginal(false)
              }}
            >
              다른 사진으로 바꾸기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
