import { config } from '../config'

function fnv1a(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export interface RandomStream {
  next(): number
  range(a: number, b: number): number
  int(n: number): number
  gauss(): number
}

export function streamFrom(seed: number, name: string): RandomStream {
  let a = (fnv1a(name) ^ Math.imul(seed >>> 0, 0x9e3779b1)) >>> 0
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (n) => Math.floor(next() * n),
    gauss: () => {
      const u = Math.max(next(), 1e-12)
      const v = next()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
  }
}

export function stream(name: string): RandomStream {
  return streamFrom(config.seed, name)
}

export function hash01(a: number, b = 0, c = 0): number {
  let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b)
  h = Math.imul(h ^ (b | 0) ^ (h >>> 13), 0xc2b2ae35)
  h = Math.imul(h ^ (c | 0) ^ (h >>> 16), 0x27d4eb2f)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}
