import type { RingLook } from './rings'

export const globe = {
  lightSize: [513, 128] as [number, number],
  shadeSize: [512, 256] as [number, number],
  cloudWhite: 3.0878,
  shadowTint: [1.655, 0.957, 0.841] as [number, number, number],
  bandRate: [0, 0.0042, 2.4, 0.5] as [number, number, number, number],
  cloudRate: [0.006, 0.004, 3.1, 1.2] as [number, number, number, number],
}

export const shape = {
  axis: [0.99885, -0.04789, 0] as [number, number, number],
  polar: 0.9833,
  equator: 1.00403,
  center: [-0.00273, -0.00263, 0] as [number, number, number],
}

export const rings: RingLook = {
  color: [0.943, 1.013, 1.039],
  sigma: 0.0009,
  halfWidth: 0.02,
  gain: 2.17,
  glint: [1.6, 24],
  forward: [5, 6],
  shadowFloor: 0.05,
  hair: { normal: [-0.1548, -0.6212, 0.7682], count: 30, from: 1.25, to: 1.63, amp: [0.0015, 0.006], tiltDeg: 1.2 },
}

export const show = { rings: true, moons: true }

export const halo = {
  size: [64, 64] as [number, number],
  range: [1.0, 1.3] as [number, number],
}

type Rgb = [number, number, number]

export const moons = {
  heightSize: { full: [1536, 768], web: [768, 384] } as Record<'full' | 'web', [number, number]>,
  bump: 0.07,
  wrap: 0.25,
  bounce: [0.004, 0.012, 0.014] as Rgb,
  spinDegPerSecond: 1.5,
  bodies: {
    miranda: { light: [-0.811, 0.584, 0.022] as Rgb, sun: [6.2, 5.4, 4.5] as Rgb, ambient: [0.012, 0.026, 0.034] as Rgb },
    ariel: { light: [-0.624, 0.723, -0.296] as Rgb, sun: [1.45, 1.33, 1.28] as Rgb, ambient: [0.007, 0.02, 0.028] as Rgb },
  } as Record<string, { light: Rgb; sun: Rgb; ambient: Rgb }>,
}
