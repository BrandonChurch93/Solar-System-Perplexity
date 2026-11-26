import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { COUNT_GLSL, drawnCount, laidCount } from '../../src/stops/neptune/count'

// The texel view of Neptune's place counts what is drawn (MAIL 1049, ruling 1). Run: npx vitest run --config assets-src/neptune/vitest.config.ts

const deep = readFileSync(join(__dirname, '../../src/stops/neptune/deep.ts'), 'utf8')

describe("the count of the place's scene", () => {
  it('is the map alone where the map alone is drawn', () => {
    // No code is asked there: its count is that of a made detail of one unit, far under one texel a pixel. It has no say.
    expect(drawnCount(1.8, 0.2, 1, 0, 0, true)).toBeCloseTo(1.8, 12)
    expect(drawnCount(1.8, 37, 1, 0, 0, true)).toBeCloseTo(1.8, 12)
  })

  it("is the finer of the map and the code by the code's share", () => {
    expect(drawnCount(0.4, 1.2, 0, 0, 0, true)).toBeCloseTo(1.2, 12)
    expect(drawnCount(1.6, 1.2, 0, 0, 0, true)).toBeCloseTo(1.6, 12)
    expect(drawnCount(0.4, 1.2, 0.25, 0, 0, true)).toBeCloseTo(0.75 * 1.2 + 0.25 * 0.4, 12)
    // A coarse code never lowers the count of a map that is drawn under it.
    for (const far of [0, 0.3, 0.7, 1]) expect(drawnCount(1.5, 0.3, far, 0, 0, true)).toBeCloseTo(1.5, 12)
  })

  it('counts each layer by its share of the pixel', () => {
    expect(drawnCount(0.4, 1.2, 0, 2.0, 0.5, true)).toBeCloseTo(1.6, 12)
    expect(drawnCount(0.4, 1.2, 0, 2.0, 1, true)).toBeCloseTo(2.0, 12)
    expect(drawnCount(0.4, 1.2, 0, 2.0, 0, true)).toBeCloseTo(1.2, 12)
    // With no deck behind it the cirrus is all that is drawn.
    expect(drawnCount(0.4, 1.2, 0, 0.7, 0.6, false)).toBeCloseTo(0.7, 12)
    // The count is between the layers' counts and grows with each of them.
    for (const share of [0, 0.2, 0.5, 0.9, 1]) {
      const c = drawnCount(0.9, 0.6, 0.4, 1.7, share, true)
      expect(c).toBeGreaterThanOrEqual(0.9 - 1e-12)
      expect(c).toBeLessThanOrEqual(1.7 + 1e-12)
      expect(drawnCount(1.0, 0.6, 0.4, 1.7, share, true)).toBeGreaterThanOrEqual(c)
      expect(drawnCount(0.9, 0.6, 0.4, 1.8, share, true)).toBeGreaterThanOrEqual(c)
    }
  })

  it("leaves the count under it standing where the scene draws nothing", () => {
    expect(laidCount(0.2, 0, 1.8)).toBeCloseTo(1.8, 12)
    expect(laidCount(1.3, 1, 1.8)).toBeCloseTo(1.3, 12)
    expect(laidCount(1.0, 0.25, 2.0)).toBeCloseTo(1.75, 12)
  })

  it('is the law the shader runs', () => {
    expect(deep).toContain('${COUNT_GLSL}')
    expect(COUNT_GLSL).toContain('float deck = mix(max(mapCount, codeCount), mapCount, clamp(farShare, 0.0, 1.0));')
    expect(COUNT_GLSL).toContain('return deckSeen ? mix(deck, cloudCount, clamp(cloudShare, 0.0, 1.0)) : cloudCount;')
    expect(deep).toContain('float texels = drawnCount(farTexels, 4.0 * tDeck * uPix / max(deckFinest, 1e-6), farW, 4.0 * tMean * uPix / max(cloudFinest, 1e-6), 1.0 - cloudClear, deckHit);')
    // The scene's count is written by the scene's share, as its picture is.
    expect(deep).toContain('if (uDiag == 2) outColor *= whole * inside;')
    expect(deep).toContain('farTexels = tx;')
  })
})
