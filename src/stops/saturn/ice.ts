import * as THREE from 'three'
import ice from './ice.json'

const WAKES = ice.wakes.cell.length
const SPOKES = ice.spokes.at.length
const GRAINS = ice.grain.layers.length

// The ice of the sheet that is part of the sheet itself. Needs RING_FIELD_GLSL. Everything lies on rows in
// radius that each turn at the orbital rate of their radius. The sand is the grain of the sheet at the size of
// the pixel; wakes are long soft patches of the sheet, darker or brighter; spokes are soft radial smudges on the
// dense ring that turn with the globe. The blocks that can be seen one by one are bodies of their own
// (blocks.ts).
export const ICE_GLSL = /* glsl */ `
uniform vec4 uIceOrbit;
uniform vec4 uIceMove;
uniform vec4 uIceFit;
uniform vec4 uIceFit2;
uniform vec4 uIceCell[${WAKES}];
uniform vec4 uIceShape[${WAKES}];
uniform vec4 uIceTone[${WAKES}];
uniform vec4 uSpokeFit;
uniform vec4 uSpoke[${SPOKES}];
uniform vec4 uGrainFit;
uniform vec4 uGrainSpark;
uniform vec4 uGrain[${GRAINS}];
// How far the orbit of radius rc has turned, in full circles: Kepler's third law, counted from the orbit that
// keeps pace with the globe.
float iceTurn(float rc) {
  float s = uIceOrbit.y / rc;
  return uIceOrbit.x * s * sqrt(s);
}
// One row of the sand: a smooth random value along the orbit of the row. cr and ct are the sizes of a cell
// across and along the orbit.
float iceGrainRow(float row, float cr, float ct, float turn, uint seed) {
  float rc = (row + 0.5) * cr;
  uint hr = ringPcg(uint(int(row)) + seed);
  float n = max(floor(6.2831853 * rc / ct), 1.0);
  float x = fract(turn + iceTurn(rc) + ringUnit(hr)) * n;
  float col = floor(x);
  float f = smoothstep(uGrainFit.z, 1.0 - uGrainFit.z, x - col);
  float next = col + 1.0 < n ? col + 1.0 : 0.0;
  uint hc = ringPcg(hr + 17u);
  return mix(ringUnit(ringPcg(uint(int(col)) + hc)), ringUnit(ringPcg(uint(int(next)) + hc)), f);
}
// The sand of the sheet at radius r (turn its azimuth over a full circle). The sand has grains of many sizes,
// each size a field of smooth noise that lies in the sheet with every row on its own orbit; a size is a pair,
// across and along the orbit, of doublings of the finest. What shows at a point is the sand whose grains are
// the given number of pixels across and along there (pxR and pxT are the pixels of one radius in the two
// directions), blended between the sizes next to that; where the sheet is so far that the coarsest sand is
// finer than that, the sand merges into the sheet. sweep is how far the pixel's point slides over the ice
// during one take, across and along the orbit (radii): the grain is drawn out by that and is fainter by the
// number of grains the pixel passes over, so sand that streams past the lens is a streak that keeps its place
// from frame to frame and does not crawl. Returns how far the sand moves the logarithm of the brightness (x)
// and the white sparks of its brightest grains (y).
vec2 iceGrain(float r, float turn, float pxR, float pxT, float thin, vec2 sweep) {
  vec2 sum = vec2(0.0);
  for (int g = 0; g < ${GRAINS}; g++) {
    vec2 still = uGrain[g].x / vec2(pxR, pxT);
    vec2 wide = still + sweep * uIceFit2.z;
    float keep = sqrt(still.x * still.y / (wide.x * wide.y));
    vec2 want = log2(wide / uGrainFit.x);
    vec2 at = clamp(want, 0.0, uGrainFit.y);
    vec2 lo = floor(at);
    vec2 f = at - lo;
    float seen = (1.0 - smoothstep(0.0, 1.0, max(want.x, want.y) - uGrainFit.y)) * keep;
    float level = 0.0;
    float norm = 0.0;
    float spark = 0.0;
    for (int k = 0; k < (seen > 0.0 ? 4 : 0); k++) {
      vec2 pick = vec2(float(k & 1), float(k >> 1));
      vec2 share = mix(1.0 - f, f, pick);
      float w = share.x * share.y;
      vec2 size = uGrainFit.x * exp2(lo + pick);
      uint seed = ringPcg(uint(int(lo.x + pick.x) * 16 + int(lo.y + pick.y)) + uint(g) * 977u + 7001u);
      float u = r / size.x - 0.5;
      float row = floor(u);
      float v = mix(iceGrainRow(row, size.x, size.y, turn, seed), iceGrainRow(row + 1.0, size.x, size.y, turn, seed), smoothstep(uGrainFit.z, 1.0 - uGrainFit.z, u - row));
      level += w * (v * 2.0 - 1.0);
      norm += w * w;
      spark += w * smoothstep(uGrainSpark.z, uGrainSpark.w, v);
    }
    sum += seen * vec2(mix(uGrain[g].y, uGrain[g].z, thin) * level / sqrt(max(norm, 1e-6)), uGrain[g].w * mix(uGrainSpark.x, uGrainSpark.y, thin) * spark);
  }
  return sum;
}
// How far the point q of the sheet under a pixel slides over the ice during one take, across the orbit (x) and
// along it (y), in radii: the lens moves by uIceMove.xyz and the ice turns on its orbit. ray is the way from
// the lens to q.
vec2 iceSweep(vec2 q, float r, vec3 ray) {
  vec2 slide = uIceMove.xz - ray.xz * (uIceMove.y / (abs(ray.y) > 1e-6 ? ray.y : 1e-6));
  vec2 er = q / r;
  vec2 et = vec2(-er.y, er.x);
  float s = uIceOrbit.y / r;
  return abs(vec2(dot(slide, er), dot(slide, et) + 6.2831853 * r * uIceMove.w * s * sqrt(s)));
}
// One class of wakes at the point q of the plane (radius r, turn its azimuth over a full circle). toPixel turns
// an offset on the plane (radii) into pixels. Returns how much of the pixel a wake covers (x) and the wake's
// tone from -1 dark to 1 bright (y).
vec2 iceWake(int c, int sub, vec2 q, float r, float turn, mat2 toPixel, float soft) {
  vec4 cell = uIceCell[c];
  vec4 shape = uIceShape[c];
  // each class is two sets of rows, the second half a row out from the first
  float shift = 0.5 * float(sub);
  float row = floor(r / cell.x + shift);
  float rc = (row + 0.5 - shift) * cell.x;
  uint hr = ringPcg(uint(int(row)) + ringPcg(uint(c * 2 + sub) + 911u));
  float n = max(floor(6.2831853 * rc / (cell.x * cell.y)), 1.0);
  float x = fract(turn + iceTurn(rc) + ringUnit(hr)) * n;
  float col = floor(x);
  uint h = ringPcg(uint(int(col)) + ringPcg(hr + 17u));
  vec3 a = ringBits(h);
  vec3 b = ringBits(ringPcg(h + 3u));
  // the wake's half sizes in radii, across and along its long axis, and its centre inside the cell
  float across = mix(shape.x, shape.y, a.z) * cell.x;
  float along = across * cell.y;
  float reach = max(across * shape.w, along * abs(shape.z)) + across;
  float my = min(reach / cell.x, 0.5);
  float mx = min(along / (cell.x * cell.y), 0.5);
  float dt = (x - col - mix(mx, 1.0 - mx, a.x)) * (6.2831853 * rc / n);
  float dr = r - (row - shift + mix(my, 1.0 - my, a.y)) * cell.x;
  // the same offset along and across the wake's long axis, pitched to the orbit
  vec2 d = vec2(dt * shape.w + dr * shape.z, dr * shape.w - dt * shape.z) / vec2(along, across);
  float s = length(d);
  vec2 er = q / r;
  vec2 et = vec2(-er.y, er.x);
  // the wake's smaller half size in pixels: its edge is filtered by that, and a wake under a pixel fades out
  float px = min(across * length(toPixel * (er * shape.w - et * shape.z)), along * length(toPixel * (et * shape.w + er * shape.z)));
  float w = soft / max(px, 1e-4);
  float cover = clamp((1.0 + w - s) / (2.0 * w + uIceTone[c].w), 0.0, 1.0);
  cover = cover * cover * (3.0 - 2.0 * cover) * smoothstep(uIceFit.x, uIceFit.y, px);
  float tone = b.y * 2.0 - 1.0;
  return b.x < cell.z ? vec2(cover, sign(tone) * mix(uIceFit2.x, 1.0, abs(tone))) : vec2(0.0);
}
// The spokes at radius r, azimuth turn: how far they move the logarithm of the brightness.
float iceSpokes(float r, float turn) {
  float band = smoothstep(uSpokeFit.x, uSpokeFit.x + uSpokeFit.z, r) * (1.0 - smoothstep(uSpokeFit.y - uSpokeFit.z, uSpokeFit.y, r));
  float sum = 0.0;
  for (int k = 0; k < (band > 0.0 ? ${SPOKES} : 0); k++) {
    vec4 s = uSpoke[k];
    float d = fract(turn + uIceOrbit.x - s.x - s.z * (r - uSpokeFit.x) + 0.5) - 0.5;
    sum += s.w * exp(-d * d / (s.y * s.y));
  }
  return sum * band * uSpokeFit.w;
}
// Wakes and spokes at q (radius r, turn its azimuth over a full circle): the factor on the brightness (x) and
// the factor on the optical depth (y). pixelsPerRadius is the smaller scale of toPixel: a class of wakes whose
// cells are under a pixel is skipped. amount is the strength of the fine structure there. Both show only near
// the sheet (uIceOrbit.z).
vec2 iceMarks(vec2 q, float r, float turn, mat2 toPixel, float pixelsPerRadius, float soft, float amount) {
  float ln = 0.0;
  float spokes = 0.0;
  for (int j = 0; j < (uIceOrbit.z > 0.0 ? 1 : 0); j++) {
    for (int c = 0; c < ${WAKES}; c++) {
      bool seen = uIceCell[c].x * uIceShape[c].y * pixelsPerRadius > uIceFit.x;
      for (int k = 0; k < (seen ? 1 : 0); k++) {
        for (int sub = 0; sub < 2; sub++) {
          vec2 g = iceWake(c, sub, q, r, turn, toPixel, soft);
          ln += g.x * (g.y > 0.0 ? uIceTone[c].y : uIceTone[c].x) * g.y;
        }
      }
    }
    spokes = iceSpokes(r, turn);
  }
  ln *= uIceOrbit.z * amount;
  return vec2(exp(ln + spokes * uIceOrbit.z), exp(ln * uIceFit.z));
}`

export interface Ice { uniforms: Record<string, THREE.IUniform>; move: THREE.Vector4; set(spinRadians: number, near: number): void }

export function iceField(): Ice {
  const c = ice.wakes
  const k = ice.spokes
  const orbit = new THREE.Vector4(0, ice.orbit.syncRadius, 0, ice.glintWhite)
  const grainSpark = new THREE.Vector4()
  const move = new THREE.Vector4()
  const grain = ice.grain.layers.map(() => new THREE.Vector4())
  const set = (spinRadians: number, near: number): void => {
    orbit.x = spinRadians / (2 * Math.PI)
    orbit.z = near
    const mix = THREE.MathUtils.lerp
    const g = ice.grain
    grainSpark.set(mix(g.spark.dense[0]!, g.spark.dense[1]!, near), mix(g.spark.thin[0]!, g.spark.thin[1]!, near), g.spark.from, g.spark.to)
    g.layers.forEach((l, i) => grain[i]!.set(l.pixels, l.dense * mix(g.far, 1, near), l.thin * mix(g.far, 1, near), l.sparks))
  }
  set(0, 0)
  return {
    uniforms: {
      uIceOrbit: { value: orbit },
      uIceFit: { value: new THREE.Vector4(ice.fade[0], ice.fade[1], ice.tau, ice.filter) },
      uIceFit2: { value: new THREE.Vector4(ice.weakest, ice.grain.spark.gain, ice.grain.sweep, 0) },
      uIceMove: { value: move },
      uIceCell: { value: c.cell.map((size, k) => new THREE.Vector4(size, c.aspect[k], c.share[k], 0)) },
      uIceShape: { value: c.cell.map((_, k) => new THREE.Vector4(c.size[k]![0], c.size[k]![1], Math.sin(THREE.MathUtils.degToRad(c.pitchDeg[k]!)), Math.cos(THREE.MathUtils.degToRad(c.pitchDeg[k]!)))) },
      uIceTone: { value: c.cell.map((_, k) => new THREE.Vector4(c.dark[k], c.bright[k], 0, c.soft[k])) },
      uSpokeFit: { value: new THREE.Vector4(k.span[0], k.span[1], k.edge, k.strength) },
      uSpoke: { value: k.at.map((at, j) => new THREE.Vector4(at / 360, k.widthDeg[j]! / 360, k.leanDegPerRadius[j]! / 360, k.tone[j])) },
      uGrainFit: { value: new THREE.Vector4(ice.grain.finest, ice.grain.doublings, ice.grain.hard, ice.grain.tau) },
      uGrainSpark: { value: grainSpark },
      uGrain: { value: grain },
    },
    // how far the lens moves during one take in the frame of the rings (xyz, radii) and how far the orbit
    // that keeps pace with the globe turns in that time (w, full circles)
    move,
    // the turn of the orbit that keeps pace with the globe, in full circles since the middle of the hold, and
    // how near the lens is to the sheet (0 in the hold, 1 in the skim): wakes and spokes show only near it,
    // and the sand has its share far of its strength in the hold and its own sparks there
    set,
  }
}
