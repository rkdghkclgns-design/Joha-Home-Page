self.onmessage = (e: MessageEvent) => {
  const { pixels, w, h } = e.data
  const px = new Uint8ClampedArray(pixels)
  const total = w * h

  // 1) Grayscale
  const gray = new Float32Array(total)
  for (let i = 0; i < total; i++) {
    gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]
  }

  // 2) Gaussian blur
  const kernel = [1, 4, 6, 4, 1]
  const temp = new Float32Array(total)
  const blurred = new Float32Array(total)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let k = -2; k <= 2; k++) {
        const xx = Math.min(Math.max(x + k, 0), w - 1)
        sum += gray[y * w + xx] * kernel[k + 2]
      }
      temp[y * w + x] = sum / 16
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      for (let k = -2; k <= 2; k++) {
        const yy = Math.min(Math.max(y + k, 0), h - 1)
        sum += temp[yy * w + x] * kernel[k + 2]
      }
      blurred[y * w + x] = sum / 16
    }
  }

  // 3) Sobel gradient magnitude + direction
  const mag = new Float32Array(total)
  const dir = new Float32Array(total)
  let maxMag = 0

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx =
        -blurred[(y-1)*w+(x-1)] + blurred[(y-1)*w+(x+1)]
        - 2 * blurred[y*w+(x-1)] + 2 * blurred[y*w+(x+1)]
        - blurred[(y+1)*w+(x-1)] + blurred[(y+1)*w+(x+1)]
      const gy =
        -blurred[(y-1)*w+(x-1)] - 2 * blurred[(y-1)*w+x] - blurred[(y-1)*w+(x+1)]
        + blurred[(y+1)*w+(x-1)] + 2 * blurred[(y+1)*w+x] + blurred[(y+1)*w+(x+1)]
      mag[i] = Math.sqrt(gx * gx + gy * gy)
      dir[i] = Math.atan2(gy, gx)
      if (mag[i] > maxMag) maxMag = mag[i]
    }
  }

  // 4) Non-maximum suppression
  const nms = new Float32Array(total)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      let angle = dir[i] * 180 / Math.PI
      if (angle < 0) angle += 180

      let q = 0, r = 0
      if ((angle < 22.5) || (angle >= 157.5)) {
        q = mag[y * w + (x + 1)]
        r = mag[y * w + (x - 1)]
      } else if (angle < 67.5) {
        q = mag[(y + 1) * w + (x - 1)]
        r = mag[(y - 1) * w + (x + 1)]
      } else if (angle < 112.5) {
        q = mag[(y + 1) * w + x]
        r = mag[(y - 1) * w + x]
      } else {
        q = mag[(y - 1) * w + (x - 1)]
        r = mag[(y + 1) * w + (x + 1)]
      }
      nms[i] = (mag[i] >= q && mag[i] >= r) ? mag[i] : 0
    }
  }

  // 5) Double threshold + hysteresis
  const highThresh = maxMag * 0.08
  const lowThresh = highThresh * 0.4
  const strong = 255
  const weak = 80
  const result = new Uint8Array(total)

  for (let i = 0; i < total; i++) {
    if (nms[i] >= highThresh) result[i] = strong
    else if (nms[i] >= lowThresh) result[i] = weak
  }

  let changed = true
  while (changed) {
    changed = false
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (result[i] !== weak) continue
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (result[(y + dy) * w + (x + dx)] === strong) {
              result[i] = strong
              changed = true
              break
            }
          }
          if (result[i] === strong) break
        }
      }
    }
  }

  // 6) Render
  for (let i = 0; i < total; i++) {
    const isEdge = result[i] === strong
    const v = isEdge ? 0 : 255
    px[i * 4] = v
    px[i * 4 + 1] = v
    px[i * 4 + 2] = v
    px[i * 4 + 3] = 255
  }

  // Line thickening
  const copy = new Uint8Array(px)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      if (copy[i] === 0) continue
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ni = ((y + dy) * w + (x + dx)) * 4
          if (copy[ni] === 0) {
            px[i] = 40
            px[i + 1] = 40
            px[i + 2] = 40
            break
          }
        }
        if (px[i] === 40) break
      }
    }
  }

  ;(self as any).postMessage({ pixels: px.buffer }, [px.buffer])
}

export default {}
