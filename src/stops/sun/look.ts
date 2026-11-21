import type { GlobeLook } from './globe'

export const globe: GlobeLook = {
  limb: [0.33, 0.36],
  rim: { color: [0.9, 0.42, 0.08], width: 0.09, power: 2 },
  boil: { reach: 0.00035, period: 3.2, step: 0.004, max: 0.006 },
  hot: { from: 3.2, to: 4.9, boost: 2.2 },
  pulse: { amount: 0.16, rate: 1.9, from: 0.55, to: 0.8 },
}

export const wrapFile = 'wrap-color.jpg'
