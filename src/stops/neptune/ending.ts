export const ending = {
  blend: 4,
  air: {
    scaleHeight: [0.02, 0.032, 0.02],
    day: [[0.018, 0.071, 0.172], [0.034, 0.094, 0.2], [0.018, 0.086, 0.195]],
    span: 0.06,
    past: 0.04,
  },
  limb: { forward: 1.1, forwardWidth: 0.6, lit: [0, 0.2], night: 12, albedo: [0.07, 0.25, 1], cloudRatio: 5.5, cloudTo: 0.4 },
  ring: { band: [0.24, 0.05, 1], depth: 0.25, open: 0.446 },
}

export type Ending = typeof ending
