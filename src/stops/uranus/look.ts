export const globe = {
  lightSize: [513, 128] as [number, number],
  cloudWhite: 3.0878,
  shadowTint: [1.655, 0.957, 0.841] as [number, number, number],
  bandRate: [0, 0.0042, 2.4, 0.5] as [number, number, number, number],
  cloudRate: [0.006, 0.004, 3.1, 1.2] as [number, number, number, number],
}

export const halo = {
  size: [64, 64] as [number, number],
  range: [1.0, 1.3] as [number, number],
}

export const moons = {
  heightSize: { full: [1536, 768], web: [768, 384] } as Record<'full' | 'web', [number, number]>,
  bump: 0.9,
  sun: [2.6, 2.7, 2.8] as [number, number, number],
  ambient: [0.004, 0.006, 0.008] as [number, number, number],
  bounce: [0.02, 0.06, 0.07] as [number, number, number],
  spinDegPerSecond: 1.5,
}
