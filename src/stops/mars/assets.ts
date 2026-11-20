import type { ReliefDef } from '../../terrain/relief'

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

export const relief: Record<'full' | 'web', ReliefDef> = {
  full: { imageSize: [2816, 1584], vfovDeg: 60, layers: [], masks: 'relief-masks.png', mistDir: [1, 0] },
  web: { imageSize: [2816, 1584], vfovDeg: 60, layers: [], masks: 'relief-masks.png', mistDir: [1, 0] },
}
