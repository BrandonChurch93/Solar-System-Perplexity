export const ending = {
  blend: 4,
  air: {
    scaleHeight: [0.014, 0.026, 0.014],
    day: [[0.024, 0.095, 0.23], [0.045, 0.125, 0.27], [0.024, 0.115, 0.26]],
    span: 0.06,
    past: 0.04,
  },
  limb: { forward: 1, lit: [0, 0.2], night: 12, albedo: [0.07, 0.25, 1], cloudRatio: 4, cloudTo: 0.6 },
  ring: { band: [0.24, 0.05, 1], depth: 0.25, open: 0.446 },
}

export type Ending = typeof ending
