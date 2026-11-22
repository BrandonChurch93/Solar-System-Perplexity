import type { DeckLook } from './deck'
import type { MistLook } from './mist'
import type { RingLook } from './rings'
import type { VeilLook } from './veil'

export const globe = {
  lightSize: [513, 128] as [number, number],
  shadeSize: [512, 256] as [number, number],
  cloudWhite: 3.0878,
  shadowTint: [1.655, 0.957, 0.841] as [number, number, number],
  bandRate: [0, 0.0042, 2.4, 1.584] as [number, number, number, number],
  cloudRate: [0.006, 0.004, 3.1, 1.2] as [number, number, number, number],
  cloudFine: 4,
  sharp: [0.3, 0.8] as [number, number],
  wrapSoft: 2.2,
  soft: 0,
  diveSoft: [0.16, 2.3, 4.55] as [number, number, number],
  away: 1,
  awayShade: 1,
}

export const face = {
  centre: [0.9263, 0.153, 0.3445] as [number, number, number],
  reachDeg: 100,
  fadeDeg: [78, 94] as [number, number],
  gain: 4,
  weight: 1,
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
  filter: 0.2,
  halfWidth: 0.02,
  gain: 2.17,
  glint: [1.6, 24],
  forward: [5, 6],
  back: [3, 2],
  shadowFloor: 0.05,
  flat: true,
  vary: 0.35,
  far: 1.5,
  near: [0.45, 120],
  shade: [0.55, 0.004],
  air: [1.0, 1.04],
  cutSky: 0,
  hair: { normal: [-0.1548, -0.6212, 0.7682], count: 30, from: 1.25, to: 1.63, amp: [0.0015, 0.006], tiltDeg: 1.2 },
}

export const arrival = { rings: [-18, 10] as [number, number] }

export const departing = { rings: [0.3, 5.5, 0.25] as [number, number, number] }

export const veil: VeilLook = { normal: [-0.1989, -0.6042, 0.7716], range: [1.08, 1.84], max: 0.04, dive: [0.05, 0.17] }

export const deckRings: RingLook = {
  color: [0.78, 1.0, 1.08],
  sigma: 0.0004,
  filter: 0.11,
  halfWidth: 0.02,
  gain: 1.66,
  glint: [0.6, 24],
  forward: [0, 6],
  back: [0, 2],
  shadowFloor: 1,
  flat: false,
  vary: 0,
  far: 1,
  near: [0, 0],
  shade: [0, 0.004],
  air: [1, 1.04],
  cutSky: 1,
  hair: { normal: [0, 1, 0], count: 0, from: 1, to: 1, amp: [0, 0], tiltDeg: 0 },
}

export const deckStrands = { count: 48, spread: 0.012, amp: [0.004, 0.02] as [number, number], minSpan: 2.1 }

export const show = { rings: true, moons: true, deck: true, globe: true, sky: true, cover: true }

export const halo = {
  size: [64, 64] as [number, number],
  range: [1.0, 1.3] as [number, number],
  rim: [0.75, 0.0045, 0.15, 3] as [number, number, number, number],
  rimSun: [-0.25, 0] as [number, number],
}

type Rgb = [number, number, number]

export const moons = {
  heightSize: { full: [1536, 768], web: [768, 384] } as Record<'full' | 'web', [number, number]>,
  bump: 0.07,
  wrap: 0.25,
  knee: [0.6, 1.6] as [number, number],
  bounce: [0.004, 0.012, 0.014] as Rgb,
  spinDegPerSecond: 1.5,
  air: [1.0, 1.04] as [number, number],
  away: 0.45,
  shine: 5,
  bodies: {
    miranda: { light: [-0.811, 0.584, 0.022] as Rgb, sun: [1.8, 1.67, 1.53] as Rgb, ambient: [0.02, 0.044, 0.058] as Rgb, rim: [3.8, 2] as [number, number], seeliger: 0.6, depth: 1.2 },
    ariel: { light: [-0.624, 0.723, -0.296] as Rgb, sun: [1.43, 1.33, 1.3] as Rgb, ambient: [0.008, 0.023, 0.032] as Rgb, rim: [0, 2] as [number, number], seeliger: 0, depth: 1.3 },
  } as Record<string, { light: Rgb; sun: Rgb; ambient: Rgb; rim: [number, number]; seeliger: number; depth: number }>,
}

export const deck: DeckLook = {
  flow: [0, 0.01, 0.9, 0.4],
  limb: [0.02, 0.06],
  edge: 0.05,
  inset: [0.1, 0.2],
  lift: 1,
  sharp: 0.3,
  bloom: 1,
  detail: { tone: 0.2, relief: 0.4, fleck: 0.3, scale: 1.0, stretch: [0.3, 0.8] },
  near: [1.0, 1.25],
  cloud: { height: 0.4, tile: 0.7, stretch: 1.4, group: 1.2, cover: [0.44, 0.6], curve: [0.14, 0.45], drift: 0.03, gain: 1.5, shade: 0.35, reach: [0.3, 0.62], tint: [2.16, 1.92, 1.8], lit: [0.02, 0.12] },
}

export const near = { tint: [0.45, 0.5, 0.6] as [number, number, number], halo: 0.6, span: [0.12, 1] as [number, number] }

export const haze = { line: 0.07, chord: 0.6 }

export const mist: MistLook = {
  glow: [0.2, 0.58, 0.7],
  deep: [0.03, 0.12, 0.17],
  high: [0.012, 0.04, 0.05],
  up: [0.0257, 0.087],
  down: [0.14, 0.14],
  peak: 0.017,
  sun: [0.12, 0.96],
  wisp: [0.35, 0.3],
}

export const air: MistLook = {
  glow: [0.2, 0.5, 0.58],
  deep: [0.035, 0.15, 0.2],
  high: [0.012, 0.04, 0.05],
  up: [0.0257, 0.087],
  down: [0.14, 0.14],
  peak: 0.017,
  sun: [0.12, 0.96],
  wisp: [0.35, 0.3],
}

export const clearing = { mist: [4, 30] as [number, number], arcs: [12, 30] as [number, number] }

export const closing = { mist: [-22, -3] as [number, number], arcs: [-22, -8] as [number, number] }

export const lifting = { mist: [1, 13] as [number, number] }

export const sinking = { mist: [-13, -4] as [number, number] }
