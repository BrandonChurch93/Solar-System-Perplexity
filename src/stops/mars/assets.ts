import type { ReliefDef } from '../../terrain/relief'
import reliefJson from './relief.json'

export const wrap = {
  storm: { lon: -112, lat: 18, radiusDeg: 14, sense: 1 },
  cap: { lon: 0, lat: 86 },
  sets: {
    full: { color: [8192, 4096] as [number, number], height: [4096, 2048] as [number, number] },
    web: { color: [4096, 2048] as [number, number], height: [2048, 1024] as [number, number] },
  },
}

export const patches = {
  spot: { lon: -81.86, lat: -4.54 },
  widthsDeg: [48, 12, 3],
  feather: 0.12,
}

const TINTS: [number, number, number][] = [[0.85, 0.3, 0.25], [0.3, 0.75, 0.35], [0.9, 0.75, 0.2], [0.4, 0.5, 0.9]]

function reliefDef(key: 'full' | 'web'): ReliefDef {
  const full = reliefJson.imageSize.full as [number, number]
  const size = reliefJson.imageSize[key] as [number, number]
  const k = size[0] / full[0]
  const layers = reliefJson.layers as Record<string, { files: Record<string, { color: string; alpha: string; dist: string }>; box: { x: number; y: number; w: number; h: number }; distSize: Record<string, number[]> }>
  const name = (path: string): string => path.slice(path.lastIndexOf('/') + 1)
  return {
    imageSize: size,
    vfovDeg: reliefJson.camera.vfovDeg,
    layers: reliefJson.drawOrder.map((id, i) => {
      const l = layers[id]!
      const f = l.files[key]!
      const d = l.distSize[key]!
      return { color: name(f.color), alpha: name(f.alpha), dist: name(f.dist), box: [l.box.x * k, l.box.y * k, l.box.w * k, l.box.h * k], distSize: [d[0]!, d[1]!], tint: TINTS[i % TINTS.length]! }
    }),
    masks: name(reliefJson.masks[key]),
    mistDir: reliefJson.mistDriftImageDir as [number, number],
  }
}

export const relief: Record<'full' | 'web', ReliefDef> = { full: reliefDef('full'), web: reliefDef('web') }
export const reliefCamera = reliefJson.camera
export const reliefSafe = reliefJson.safeMove
