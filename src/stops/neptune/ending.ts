export const ending = {
  blend: 4,
  air: {
    scaleHeight: [0.02, 0.032, 0.02],
    day: [[0.018, 0.071, 0.172], [0.034, 0.094, 0.2], [0.018, 0.086, 0.195]],
    span: 0.06,
    past: 0.04,
  },
  limb: {
    forward: 1.1, forwardWidth: 0.6, lit: [0, 0.2], night: 12, albedo: [0.07, 0.25, 1], cloudRatio: 5.5, cloudTo: 0.25, cloudLimb: [0.2, 0.5],
    nightEdge: [-0.2, 0], nightMid: 256, nightDetail: 1, nightLimb: 0.35, shine: [0.9, 1.8, -0.8, 0], shineNear: 0.46, shinePhase: [100, 146],
    dusk: [0.004, 0.014, 0.05], duskWidth: 0.07, breakUp: 0.09, breakCloud: 1.2, detail: 0.8, limbDark: [0, 0.25], deckBoost: 1.2, cloudGain: 1.6, melt: 0.3,
  },
  ring: { band: [0.1, 0.05, 1.3], depth: 0.25, open: 0.446, shade: [0.86, 1.2, 0], crisp: [0.25, 0.8], foot: 1 },
}

export type Ending = typeof ending
