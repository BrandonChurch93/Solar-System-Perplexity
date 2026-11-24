import * as THREE from 'three'
import { bufferFrame } from '../../core/frame'
import grains from './grains.json'
import ice from './ice.json'

const SPOKES = ice.spokes.at.length
const SAND = ice.sand.layers.length
export const GRAIN_LEVELS = grains.levels.name.length

// The limits of the look that are written in pixels are angles: shares of the height of the frame, written as
// pixels of the 16 by 9 master. The factor that makes them pixels of the frame that is drawn is the film's own
// (src/core/frame.ts, bufferFrame), so a frame of any size shows the same grains at the same places.

// The 32 bit mix that the shaders use (ringPcg in field.ts), for the numbers a grain has of its own.
export function pcg(v: number): number {
  const s = (Math.imul(v, 747796405) + 2891336453) >>> 0
  const w = Math.imul(((s >>> ((s >>> 28) + 4)) ^ s) >>> 0, 277803737) >>> 0
  return ((w >>> 22) ^ w) >>> 0
}

// The lobes of a grain: a grain is three balls that overlap, inside a ball of radius 1: one near the middle
// and two further out. Lobe k has three numbers of its own from 0 to 1 (how far its centre is out, at what
// angle, how large it is); returns how far its centre is from the middle and its radius. The shader of
// grains.ts has the same law (grainLobe).
export function grainLobe(k: number, out: number, large: number): [number, number] {
  const l = grains.lobes
  const off = l.spread * (k === 0 ? l.first * out : 0.5 + 0.5 * out)
  return [off, Math.min(l.radius[0]! + (l.radius[1]! - l.radius[0]!) * large, 1 - off)]
}

// What a level of grains amounts to: depth, the optical depth the level carries where every cell that may
// hold a grain holds one; ref, the size of the level's middle grain (the root of the mean square of the
// sizes); fill, the share of a grain's round outline that its three lobes fill, on average.
export interface GrainLevel { depth: number; ref: number; fill: number }

function lobeFill(): number {
  let state = pcg(grains.seed)
  const unit = (): number => {
    state = pcg(state + 1)
    return (state >>> 8) / 16777216
  }
  const shapes = 600
  const grid = 24
  let inside = 0
  let all = 0
  const lobes = new Float64Array(9)
  for (let s = 0; s < shapes; s++) {
    for (let k = 0; k < 3; k++) {
      const [off, rad] = grainLobe(k, unit(), unit())
      const ang = 2 * Math.PI * unit()
      lobes[k * 3] = off * Math.cos(ang)
      lobes[k * 3 + 1] = off * Math.sin(ang)
      lobes[k * 3 + 2] = rad * rad
    }
    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const x = ((i + 0.5) / grid) * 2 - 1
        const y = ((j + 0.5) / grid) * 2 - 1
        if (x * x + y * y > 1) continue
        all++
        for (let k = 0; k < 3; k++) {
          const dx = x - lobes[k * 3]!
          const dy = y - lobes[k * 3 + 1]!
          if (dx * dx + dy * dy <= lobes[k * 3 + 2]!) {
            inside++
            break
          }
        }
      }
    }
  }
  return inside / all
}

export function grainLevels(): GrainLevel[] {
  const l = grains.levels
  const fill = lobeFill()
  return l.name.map((_, k) => {
    const [lo, hi] = l.size[k] as [number, number]
    const p = l.power[k]!
    // the size is lo + (hi - lo) u^p for u even on 0 to 1: the mean of its square
    const square = lo * lo + (2 * lo * (hi - lo)) / (p + 1) + ((hi - lo) * (hi - lo)) / (2 * p + 1)
    const cell = l.cell[k]!
    return { depth: (l.layers[k]! * l.presence[k]! * (Math.PI / 4) * square * fill) / (cell * cell), ref: Math.sqrt(square), fill }
  })
}

// The ice of the sheet that is part of the sheet itself. Needs RING_FIELD_GLSL. Everything turns at the orbital
// rate of its radius. The sand is the grain of the sheet at the size of the pixel as it is seen from afar (in
// the hold); spokes are soft radial smudges on the dense ring that turn with the globe. Near the lens the ice
// is seen grain by grain: those grains are bodies of their own (grains.ts), and the depth they carry is taken
// out of the sheet here, by the same law in both places.
export const ICE_GLSL = /* glsl */ `
uniform vec4 uIceOrbit;
uniform vec4 uIceMove;
uniform vec4 uIceFit;
uniform vec4 uSpokeFit;
uniform vec4 uSpoke[${SPOKES}];
uniform vec4 uSandFit;
uniform vec4 uSandSpark;
uniform vec4 uSand[${SAND}];
uniform vec4 uGrainLevel[${GRAIN_LEVELS}];
uniform vec4 uGrainReach[${GRAIN_LEVELS}];
uniform vec4 uGrainFit;
// How far the orbit of radius rc has turned, in full circles: Kepler's third law, counted from the orbit that
// keeps pace with the globe.
float iceTurn(float rc) {
  float s = uIceOrbit.y / rc;
  return uIceOrbit.x * s * sqrt(s);
}
// One row of the sand: a smooth random value along the orbit of the row. cr and ct are the sizes of a cell
// across and along the orbit.
float iceSandRow(float row, float cr, float ct, float turn, uint seed) {
  float rc = (row + 0.5) * cr;
  uint hr = ringPcg(uint(int(row)) + seed);
  float n = max(floor(6.2831853 * rc / ct), 1.0);
  float x = fract(turn + iceTurn(rc) + ringUnit(hr)) * n;
  float col = floor(x);
  float f = smoothstep(uSandFit.z, 1.0 - uSandFit.z, x - col);
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
// during one take, across and along the orbit (radii): the sand is drawn out by that and is fainter by the
// number of grains the pixel passes over. The sand is the look of the sheet from afar: it has no strength
// near the lens, where the ice is seen grain by grain. Returns how far the sand moves the logarithm of the
// brightness (x) and the white sparks of its brightest grains (y).
vec2 iceSand(float r, float turn, float pxR, float pxT, float thin, vec2 sweep) {
  vec2 sum = vec2(0.0);
  for (int g = 0; g < ${SAND}; g++) {
    vec2 still = uSand[g].x / vec2(pxR, pxT);
    vec2 wide = still + sweep * uIceFit.x;
    float keep = sqrt(still.x * still.y / (wide.x * wide.y));
    vec2 want = log2(wide / uSandFit.x);
    vec2 at = clamp(want, 0.0, uSandFit.y);
    vec2 lo = floor(at);
    vec2 f = at - lo;
    float seen = (1.0 - smoothstep(0.0, 1.0, max(want.x, want.y) - uSandFit.y)) * keep;
    float level = 0.0;
    float norm = 0.0;
    float spark = 0.0;
    for (int k = 0; k < (seen > 0.0 && uSandFit.w > 0.0 ? 4 : 0); k++) {
      vec2 pick = vec2(float(k & 1), float(k >> 1));
      vec2 share = mix(1.0 - f, f, pick);
      float w = share.x * share.y;
      vec2 size = uSandFit.x * exp2(lo + pick);
      uint seed = ringPcg(uint(int(lo.x + pick.x) * 16 + int(lo.y + pick.y)) + uint(g) * 977u + 7001u);
      float u = r / size.x - 0.5;
      float row = floor(u);
      float v = mix(iceSandRow(row, size.x, size.y, turn, seed), iceSandRow(row + 1.0, size.x, size.y, turn, seed), smoothstep(uSandFit.z, 1.0 - uSandFit.z, u - row));
      level += w * (v * 2.0 - 1.0);
      norm += w * w;
      spark += w * smoothstep(uSandSpark.z, uSandSpark.w, v);
    }
    sum += seen * vec2(mix(uSand[g].y, uSand[g].z, thin) * level / sqrt(max(norm, 1e-6)), uSand[g].w * mix(uSandSpark.x, uSandSpark.y, thin) * spark);
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
// How much of the grains of level l shows at the distance d from the lens: by the width in pixels of the
// level's middle grain, and no further than the reach of the level.
float grainShown(int l, float d) {
  vec4 g = uGrainLevel[l];
  return smoothstep(g.z, g.w, g.y / max(d, 1e-6)) * (1.0 - smoothstep(uGrainReach[l].x, uGrainReach[l].y, d));
}
// The share of the cells that hold a grain where the sheet has the optical depth tau.
float grainCells(float tau) {
  return min(uGrainFit.x * tau / uGrainFit.y, 1.0);
}
// The optical depth that is seen grain by grain at the distance d from the lens where the share cells of the
// cells hold a grain: the sheet is thinner by that much there. None far from the sheet (in the hold).
float grainTaken(float cells, float d) {
  float sum = 0.0;
  for (int l = 0; l < ${GRAIN_LEVELS}; l++) sum += uGrainLevel[l].x * grainShown(l, d);
  return cells * sum * uGrainFit.z;
}`

export interface Ice { uniforms: Record<string, THREE.IUniform>; move: THREE.Vector4; levels: GrainLevel[]; set(spinRadians: number, near: number, focal: number): void }

export function iceField(): Ice {
  const k = ice.spokes
  const g = ice.sand
  const l = grains.levels
  const levels = grainLevels()
  const total = levels.reduce((sum, level, i) => sum + (l.counted[i]! > 0.5 ? level.depth : 0), 0)
  const orbit = new THREE.Vector4(0, ice.orbit.syncRadius, 0, ice.glintWhite)
  const sandFit = new THREE.Vector4(g.finest, g.doublings, g.hard, 1)
  const sandSpark = new THREE.Vector4()
  const move = new THREE.Vector4()
  const sand = g.layers.map(() => new THREE.Vector4())
  const grainLevel = levels.map((level, i) => new THREE.Vector4(l.counted[i]! > 0.5 ? level.depth : 0, level.ref, l.pixels[i]![0], l.pixels[i]![1]))
  const grainFit = new THREE.Vector4(grains.share, total, 0, 0)
  const set = (spinRadians: number, near: number, focal: number): void => {
    const scale = bufferFrame()
    orbit.x = spinRadians / (2 * Math.PI)
    orbit.z = near
    // the sand has its strength in the hold and none near the sheet
    const far = 1 - near
    sandFit.w = far
    sandSpark.set(g.spark.dense * far, g.spark.thin * far, g.spark.from, g.spark.to)
    g.layers.forEach((layer, i) => sand[i]!.set(layer.pixels * scale, layer.dense * g.far * far, layer.thin * g.far * far, layer.sparks))
    levels.forEach((level, i) => grainLevel[i]!.set(grainLevel[i]!.x, level.ref * focal, l.pixels[i]![0]! * scale, l.pixels[i]![1]! * scale))
    grainFit.z = near
  }
  set(0, 0, 1000)
  return {
    uniforms: {
      uIceOrbit: { value: orbit },
      uIceFit: { value: new THREE.Vector4(ice.sweep, g.spark.gain, g.tau, 0) },
      uIceMove: { value: move },
      uSpokeFit: { value: new THREE.Vector4(k.span[0], k.span[1], k.edge, k.strength) },
      uSpoke: { value: k.at.map((at, j) => new THREE.Vector4(at / 360, k.widthDeg[j]! / 360, k.leanDegPerRadius[j]! / 360, k.tone[j])) },
      uSandFit: { value: sandFit },
      uSandSpark: { value: sandSpark },
      uSand: { value: sand },
      uGrainLevel: { value: grainLevel },
      uGrainReach: { value: levels.map((_, i) => new THREE.Vector4(l.reach[i]![0], l.reach[i]![1], l.counted[i], 0)) },
      uGrainFit: { value: grainFit },
    },
    // how far the lens moves during one take in the frame of the rings (xyz, radii) and how far the orbit
    // that keeps pace with the globe turns in that time (w, full circles)
    move,
    levels,
    // the turn of the orbit that keeps pace with the globe, in full circles since the middle of the hold; how
    // near the lens is to the sheet (0 in the hold, 1 in the skim): the sand shows far from it, the spokes
    // and the grains near it; the focal length of the view in pixels
    set,
  }
}
