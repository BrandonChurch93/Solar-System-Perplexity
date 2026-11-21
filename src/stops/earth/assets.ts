import wrapJson from './wrap.json'

export const wrap = {
  sets: {
    full: { surface: wrapJson.surface.full as [number, number] },
    web: { surface: wrapJson.surface.web as [number, number] },
  },
}

export const patches = {
  spot: { lon: -77.4757, lat: 18.1499 },
  levels: [] as { file: string; widthDeg: number }[],
  feather: 0.12,
  fade: [1.02, 1.5] as [number, number],
}
