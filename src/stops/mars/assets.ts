import type { ReliefDef } from '../../terrain/relief'
import reliefJson from './relief.json'
import wrapJson from './wrap.json'

export const wrap = {
  storm: { lon: wrapJson.storm.center_lon, lat: wrapJson.storm.center_lat, radiusDeg: wrapJson.storm.radius_core_deg, counterclockwise: true },
  sets: {
    full: { color: [wrapJson.color.full.width, wrapJson.color.full.height] as [number, number], height: [wrapJson.height.full.width, wrapJson.height.full.height] as [number, number] },
    web: { color: [wrapJson.color.web.width, wrapJson.color.web.height] as [number, number], height: [wrapJson.height.web.width, wrapJson.height.web.height] as [number, number] },
  },
}

export const patches = {
  spot: { lon: -81.86, lat: -4.54 },
  levels: [{ file: 'patch-1.jpg', widthDeg: 48 }, { file: 'patch-2.jpg', widthDeg: 12 }, { file: 'patch-3.jpg', widthDeg: 3 }],
  feather: 0.12,
  fade: [1.02, 1.5] as [number, number],
  nearDeg: 12,
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
    maskBox: [reliefJson.masks.box.x * k, reliefJson.masks.box.y * k, reliefJson.masks.box.w * k, reliefJson.masks.box.h * k],
    mistDir: reliefJson.mistDriftImageDir as [number, number],
  }
}

export const relief: Record<'full' | 'web', ReliefDef> = { full: reliefDef('full'), web: reliefDef('web') }
export const reliefCamera = reliefJson.camera
export const reliefSafe = reliefJson.safeMove
