import type { ReliefDef } from '../../terrain/relief'
import reliefJson from './relief.json'
import wideJson from './wide.json'
import wrapJson from './wrap.json'

export const wrap = {
  height: true,
  sets: {
    full: { color: wrapJson.color.full as [number, number], height: wrapJson.height.full as [number, number] },
    web: { color: wrapJson.color.web as [number, number], height: wrapJson.height.web as [number, number] },
  },
}

export const patches = {
  spot: { lon: 14.472050590150058, lat: -13.872200112972783 },
  levels: [{ file: 'patch-1.jpg', widthDeg: 76 }, { file: 'patch-2.jpg', widthDeg: 38 }, { file: 'patch-3.jpg', widthDeg: 19 }, { file: 'patch-4.jpg', widthDeg: 9.5 }],
  feather: 0.12,
  fade: [1.02, 1.95] as [number, number],
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

function wideDef(key: 'full' | 'web'): ReliefDef {
  const f = wideJson.files
  const box = wideJson.box[key] as [number, number, number, number]
  return {
    imageSize: wideJson.imageSize[key] as [number, number],
    vfovDeg: wideJson.vfovDeg,
    layers: [{ color: f.color, alpha: f.alpha, dist: f.dist, box, distSize: wideJson.distSize[key] as [number, number], tint: [0.3, 0.6, 0.85] }],
    masks: f.masks,
    maskBox: box,
    mistDir: [1, 0],
  }
}

export const wide = { full: wideDef('full'), web: wideDef('web'), position: wideJson.position as [number, number, number], quaternion: wideJson.quaternion as [number, number, number, number] }
