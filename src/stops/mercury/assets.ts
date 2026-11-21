import type { ReliefDef } from '../../terrain/relief'
import reliefJson from './relief.json'
import wrapJson from './wrap.json'

export const wrap = {
  height: true,
  sets: {
    full: { color: wrapJson.color.full as [number, number], height: wrapJson.height.full as [number, number] },
    web: { color: wrapJson.color.web as [number, number], height: wrapJson.height.web as [number, number] },
  },
}

export const patches = {
  spot: { lon: 0, lat: 0 },
  levels: [] as { file: string; widthDeg: number }[],
  feather: 0.12,
  fade: [1.02, 1.5] as [number, number],
  nearDeg: 12,
}

function reliefDef(key: 'full' | 'web'): ReliefDef {
  const f = reliefJson.files
  return {
    imageSize: reliefJson.imageSize[key] as [number, number],
    vfovDeg: reliefJson.vfovDeg,
    layers: [{ color: f.color, alpha: f.alpha, dist: f.dist, box: reliefJson.box[key] as [number, number, number, number], distSize: reliefJson.distSize[key] as [number, number], tint: [0.85, 0.3, 0.25] }],
    masks: f.masks,
    maskBox: reliefJson.box[key] as [number, number, number, number],
    mistDir: [1, 0],
  }
}

export const relief = { full: reliefDef('full'), web: reliefDef('web') }
