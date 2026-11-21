import wrapJson from './wrap.json'

export const wrap = {
  top: wrapJson.top,
  sets: {
    full: { color: wrapJson.color.full as [number, number], flow: wrapJson.flow.full as [number, number], bolt: wrapJson.bolt.full },
    web: { color: wrapJson.color.web as [number, number], flow: wrapJson.flow.web as [number, number], bolt: wrapJson.bolt.web },
  },
  bolt: { lon: wrapJson.bolt.lon, lat: wrapJson.bolt.lat, widthDeg: wrapJson.bolt.widthDeg },
}

export const patches = {
  levels: [] as { file: string; widthDeg: number }[],
  feather: 0.12,
  fade: [1.02, 1.5] as [number, number],
}
