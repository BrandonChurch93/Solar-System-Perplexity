// The texel view's law for the place's scene (cut/HANDOVER.md: the texels view must count the place picture where it is drawn).
// The view reports at each pixel the count of what is drawn there, each layer by its share of the pixel's light:
// - the deck's colour is the globe's map at every place, with the code's own detail on it by the place's share. Where the map
//   alone is drawn (far share 1) the count is the map's own, as the globe's lines count it; where the code has its share the
//   finer of the two is what the eye gets, by that share;
// - the cirrus is counted by its cover of the pixel, the deck under it by the rest; with no deck behind it the cirrus alone;
// - the scene's count is written by the scene's share of the pixel (laidCount), so where the scene draws nothing the count
//   of what lies under it (the globe's map) stands.
// The shader's lines and these functions are one law: assets-src/neptune/count.test.ts reads both.

export const COUNT_GLSL = /* glsl */ `
float drawnCount(float mapCount, float codeCount, float farShare, float cloudCount, float cloudShare, bool deckSeen) {
  float deck = mix(max(mapCount, codeCount), mapCount, clamp(farShare, 0.0, 1.0));
  return deckSeen ? mix(deck, cloudCount, clamp(cloudShare, 0.0, 1.0)) : cloudCount;
}
`

const clamp01 = (x: number): number => Math.min(Math.max(x, 0), 1)
const mix = (a: number, b: number, t: number): number => a + (b - a) * t

export function drawnCount(mapCount: number, codeCount: number, farShare: number, cloudCount: number, cloudShare: number, deckSeen: boolean): number {
  const deck = mix(Math.max(mapCount, codeCount), mapCount, clamp01(farShare))
  return deckSeen ? mix(deck, cloudCount, clamp01(cloudShare)) : cloudCount
}

// What the frame holds after the scene's count is laid over the count under it: the blend the scene's material is drawn with
// (source one, destination one minus the source's alpha), the source written times the scene's share of the pixel.
export function laidCount(sceneCount: number, sceneShare: number, underCount: number): number {
  const share = clamp01(sceneShare)
  return sceneCount * share + underCount * (1 - share)
}
