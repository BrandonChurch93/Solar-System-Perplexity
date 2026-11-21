export const wrap = {
  full: { color: [8192, 4096] as [number, number] },
  web: { color: [4096, 2048] as [number, number] },
}

export const patches = {
  levels: [] as { file: string; widthDeg: number }[],
  feather: 0.12,
  fade: [1.02, 1.5] as [number, number],
}
