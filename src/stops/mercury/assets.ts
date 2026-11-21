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
