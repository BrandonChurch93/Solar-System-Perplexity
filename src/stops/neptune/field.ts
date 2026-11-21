import * as THREE from 'three'
import fieldJson from './field.json'

export interface LimbField {
  texture: THREE.DataTexture
  muMax: number
  ndlMin: number
  width: number
  span: number
}

const SPAN = 6

export function limbField(): LimbField {
  const [w, h] = fieldJson.size as [number, number]
  const gain = fieldJson.gain as number[][][][]
  const data = new Uint8Array(w * 2 * h * 4)
  for (let s = 0; s < 2; s++) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const o = (j * w * 2 + s * w + i) * 4
        const g = gain[s]![j]![i]!
        for (let c = 0; c < 3; c++) data[o + c] = Math.round(255 * Math.min(Math.max(0.5 + Math.log2(Math.max(g[c]!, 1e-3)) / SPAN, 0), 1))
        data[o + 3] = 255
      }
    }
  }
  const texture = new THREE.DataTexture(data, w * 2, h, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return { texture, muMax: fieldJson.mu[1]!, ndlMin: fieldJson.ndl[0]!, width: w, span: SPAN }
}
