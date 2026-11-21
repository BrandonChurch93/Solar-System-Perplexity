import patchJson from './patches.json'
export const wrap = {
  full: { color: [8192, 4096] as [number, number] },
  web: { color: [4096, 2048] as [number, number] },
}

export const patches = {
  center: patchJson.centre,
  levels: patchJson.levels.map((l) => ({ file: l.file, widthDeg: l.widthDeg })),
  feather: patchJson.feather,
  fade: patchJson.fade as [number, number],
}
