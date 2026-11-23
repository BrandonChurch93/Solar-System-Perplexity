import * as THREE from 'three'
import type { SetContext } from '../../core/types'
import fine from './ringfine.json'
import model from './ringfield.json'

export const RING_HASH_GLSL = /* glsl */ `
uint ringPcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float ringUnit(uint h) {
  return float(h >> 8) * (1.0 / 16777216.0);
}
float ringRand(int i, uint seed) {
  return ringUnit(ringPcg(uint(i) + ringPcg(seed)));
}
uint ringCell(int i, int j, uint seed) {
  return ringPcg(uint(i) + ringPcg(uint(j) + ringPcg(seed)));
}`

export const RING_FIELD_GLSL = /* glsl */ `
uniform highp sampler2D uRfMap;
uniform vec4 uRfSpan;
uniform vec4 uRfLight;
uniform vec4 uRfFine;
uniform vec4 uRfAmp;
uniform vec4 uRfGroove;
uniform vec4 uRfGrooveFit;
uniform vec4 uRfBunch;
uniform vec4 uRfLine;
uniform vec4 uRfRough[2];
uniform vec4 uRfFollow;
uniform vec4 uRfLanes;
uniform vec4 uRfHue;
uniform vec3 uRfWarm;
uniform vec3 uRfPink;
uniform vec4 uRfOct[${fine.octaves}];
uniform vec4 uRfTint[${fine.octaves}];
uniform vec4 uRfMore[${fine.octaves}];
uniform vec4 uRfWaves[${fine.waves.trains.length}];
uniform vec4 uRfWaveFit;
uniform vec4 uRfWaveEnds;
${RING_HASH_GLSL}
float ringRows() {
  return 2.0 * uRfSpan.w + 4.0;
}
float ringLevel(float fp) {
  return clamp(log2(max(fp * uRfSpan.y * uRfSpan.z, 1.0)), 0.0, uRfSpan.w - 1.0);
}
vec2 ringKnots(float r, float fp) {
  float x = (r - uRfSpan.x) * uRfSpan.y;
  float level = ringLevel(fp);
  float rows = ringRows();
  return vec2(textureLod(uRfMap, vec2(x, (level + 0.5) / rows), 0.0).r, textureLod(uRfMap, vec2(x, (uRfSpan.w + level + 0.5) / rows), 0.0).r);
}
float ringDepth(float r, float fp) {
  float x = (r - uRfSpan.x) * uRfSpan.y;
  return textureLod(uRfMap, vec2(x, (ringLevel(fp) + 0.5) / ringRows()), 0.0).r;
}
// the colour of the ice (red, green, blue over luma) and the strength of the finer structure at r
vec4 ringInk(float r) {
  float x = (r - uRfSpan.x) * uRfSpan.y;
  float rows = ringRows();
  float red = textureLod(uRfMap, vec2(x, (2.0 * uRfSpan.w + 0.5) / rows), 0.0).r;
  float blue = textureLod(uRfMap, vec2(x, (2.0 * uRfSpan.w + 1.5) / rows), 0.0).r;
  return vec4(red, (1.0 - 0.2126 * red - 0.0722 * blue) / 0.7152, blue, textureLod(uRfMap, vec2(x, (2.0 * uRfSpan.w + 2.5) / rows), 0.0).r);
}
// how far the sheet at r is a thin sheet (1) or a dense one (0) in the way it returns light
float ringThin(float r) {
  return textureLod(uRfMap, vec2((r - uRfSpan.x) * uRfSpan.y, (2.0 * uRfSpan.w + 3.5) / ringRows()), 0.0).r;
}
vec3 ringBits(uint h) {
  return vec3(float(h & 1023u), float((h >> 10) & 1023u), float((h >> 20) & 1023u)) * (1.0 / 1023.0);
}
// One octave of ringlets at x, in cells: plateaus whose edges are jittered inside each cell; at each edge a thin
// line, bright or dark, of its own width and strength, and the slope of the step as a second thin line. f is
// the half width of the pixel in cells. Returns the level (-1 to 1), the slope line (signed) and the share of
// the pixel that lies in a line times the line's strength (signed), two hue offsets (-1 to 1) and one more
// value of the plateau (0 to 1) that the octave two steps finer takes as the strength of its bunches. lanes
// is how far the ringlets take turns, one bright and the next dark, rather than each a level of its own.
float ringLane(float v, int at, float lanes) {
  float m = 0.15 + 0.35 * v;
  return mix(v, (at & 1) == 0 ? 0.5 + m : 0.5 - m, lanes);
}
vec3 ringOctave(float x, uint seed, float f, float lanes, out vec2 hue, out float spare) {
  float cell = floor(x);
  float t = x - cell;
  int at = int(cell);
  uint base = uint(at) + ringPcg(seed);
  uint h0 = ringPcg(base - 2u);
  vec3 prev = ringBits(h0);
  prev.x = ringLane(prev.x, at, lanes);
  float prevB = ringUnit(ringPcg(h0 + 77u));
  float accB = prevB;
  vec3 acc = prev;
  float line = 0.0;
  float slope = 0.0;
  float wl = max(uRfGroove.w, f);
  for (int k = -1; k <= 1; k++) {
    uint h = ringPcg(base + uint(k));
    vec3 v = ringBits(h);
    v.x = ringLane(v.x, at + k, lanes);
    vec3 e = ringBits(ringPcg(h));
    float d = t - float(k) - (0.2 + 0.6 * e.x);
    float step = smoothstep(-f, f, d);
    float vb = ringUnit(ringPcg(h + 77u));
    acc += (v - prev) * step;
    accB += (vb - prevB) * step;
    prevB = vb;
    float wide = uRfGroove.x + uRfGroove.y * e.y * e.y;
    float s = e.z * 2.0 - 1.0;
    line += sign(s) * smoothstep(uRfGroove.z, 1.0, abs(s)) * clamp(min(d + f, wide) - max(d - f, -wide), 0.0, 2.0 * f) / (2.0 * f);
    slope += (v.x - prev.x) * (uRfGroove.w / wl) * max(1.0 - abs(d) / wl, 0.0);
    prev = v;
  }
  hue = acc.yz * 2.0 - 1.0;
  spare = accB;
  return vec3(acc.x * 2.0 - 1.0, slope, clamp(line, -1.0, 1.0));
}
// The finer structure: a ladder of octaves, each seen only where it is wider than the pixel. side is the
// cosine between the radius and the Sun's direction on the plane: slopes that face the Sun are brighter.
// thin is ringThin(r): the dense and the thin rings have their own strengths per octave. tint is the factor on
// the colour of the ice that the ringlets at this radius carry.
void ringFine(float r, float fp, float amp, float thin, float side, inout float tau, inout float lum, out vec3 tint) {
  float wave = uRfFine.x;
  float kl = 1.0;
  float kt = 1.0;
  vec2 hue = vec2(0.0);
  // ringlets come in bunches: the strength of an octave follows a field that changes two octaves more slowly
  float bunch = 0.0;
  float next = 0.0;
  for (int o = 0; o < ${fine.octaves}; o++) {
    float seen = clamp(wave / (fp * uRfFine.w) - 1.0, 0.0, 1.0);
    for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
      vec4 a = uRfOct[o];
      vec2 h;
      float b;
      float lanes = float(o) < uRfLanes.x ? 0.0 : uRfLanes.y;
      vec3 q = ringOctave(r / wave + float(o) * uRfAmp.w, uint(o) + 1u, max(uRfMore[o].x, uRfGrooveFit.w * fp / wave), lanes, h, b);
      float held = smoothstep(uRfBunch.x, uRfBunch.y, bunch);
      vec4 span = float(o) < uRfLine.w ? uRfRough[0] : uRfRough[1];
      float rough = o < 2 ? 1.0 : mix(mix(span.x, span.y, held), mix(span.z, span.w, held), thin);
      float g = amp * seen * rough;
      // the level moves the brightness by a factor (even in the logarithm), divided by its mean so that the
      // sheet keeps its brightness where the octave is too fine to see; so do the lines, dark ones deeper
      // than bright ones are bright, and a dark line is a thinner sheet
      float e = g * mix(a.x, a.w, thin);
      float et = e * uRfAmp.y;
      float l = g * mix(a.z * uRfBunch.z, uRfMore[o].y * uRfBunch.w, thin);
      float mean = mix(1.0 / 6.0, uRfAmp.x, lanes);
      kl *= exp(e * q.x + g * a.y * side * q.y + l * q.z * (q.z > 0.0 ? uRfGrooveFit.y : uRfGrooveFit.x)) / ((1.0 + e * e * (mean + e * e / 120.0)) * (1.0 + l * uRfGrooveFit.z));
      kt *= exp(et * q.x + l * q.z * uRfLine.x) / (1.0 + et * et * (mean + et * et / 120.0));
      // a ringlet has a hue of its own, and a brighter one is warmer
      hue += amp * seen * mix(uRfTint[o].xy, uRfTint[o].zw, thin) * h + mix(uRfFollow.xy, uRfFollow.zw, thin) * (e * q.x);
      bunch = next;
      next = b;
    }
    wave *= uRfFine.y;
  }
  for (int w = 0; w < ${fine.waves.trains.length}; w++) {
    float x = (r - uRfWaves[w].x) * uRfWaves[w].w;
    float away = abs(x) / uRfWaves[w].y;
    float local = uRfWaves[w].z / max(away, uRfWaveFit.z);
    float seen = (x > 0.0 && away < uRfWaveEnds.w) ? clamp(local / (fp * uRfFine.w) - 1.0, 0.0, 1.0) * smoothstep(uRfWaveEnds.x, uRfWaveEnds.y, away) * (1.0 - smoothstep(uRfWaveEnds.z, uRfWaveEnds.w, away)) : 0.0;
    for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
      float s = sin(3.14159265 * away * away * uRfWaves[w].y / uRfWaves[w].z);
      kl *= 1.0 + uRfWaveFit.x * seen * s;
      kt *= 1.0 + uRfWaveFit.y * seen * s;
    }
  }
  lum *= kl;
  tau *= kt;
  tint = exp(uRfWarm * (hue.x * uRfHue.x * (hue.x > 0.0 ? mix(1.0, uRfHue.w, thin) : 1.0)) + uRfPink * (hue.y * uRfHue.y * (hue.y < 0.0 ? uRfHue.z : 1.0)));
}
// the footprint the ladder is filtered with: the pixel's, however many samples a frame takes, down to a floor
float ringFootprint(float pixel, float grad) {
  return pixel * max(grad, uRfFine.z);
}
float ringSat(float x) {
  return x < 1e-3 ? x : 1.0 - exp(-x);
}`

function boxed(src: number[], width: number): Float32Array {
  const n = src.length
  const sum = new Float64Array(n + 1)
  for (let i = 0; i < n; i++) sum[i + 1] = sum[i]! + src[i]!
  const out = new Float32Array(n)
  const lo = Math.floor((width - 1) / 2)
  const hi = width - 1 - lo
  for (let i = 0; i < n; i++) {
    const a = Math.max(i - lo, 0)
    const b = Math.min(i + hi, n - 1)
    out[i] = (sum[b + 1]! - sum[a]!) / width
  }
  return out
}

function meanSmoothstep(from: number): number {
  let sum = 0
  const n = 4096
  for (let i = 0; i < n; i++) {
    const x = Math.min(Math.max(((i + 0.5) / n - from) / (1 - from), 0), 1)
    sum += x * x * (3 - 2 * x)
  }
  return sum / n
}

export interface RingField { uniforms: Record<string, THREE.IUniform>; texture: THREE.DataTexture; finest: number; set(near: number): void }

export function ringField(ctx: SetContext): RingField {
  const n = model.knots
  const levels = Math.round(Math.log2(n)) + 1
  const rows = 2 * levels + 4
  const data = new Float32Array(n * rows)
  for (let l = 0; l < levels; l++) {
    data.set(boxed(model.tau, 1 << l), l * n)
    data.set(boxed(model.lum, 1 << l), (levels + l) * n)
  }
  data.set(model.red, 2 * levels * n)
  data.set(model.blue, (2 * levels + 1) * n)
  data.set(model.fine, (2 * levels + 2) * n)
  data.set(model.thin, (2 * levels + 3) * n)
  const texture = ctx.floatTexture(data, n, rows)
  const span = model.span as [number, number]
  const ends = fine.waves
  const groove = fine.groove
  const near = fine.near
  // the mean of a line over a cell, to first order in its strength: one edge per cell, half width
  // w0 + (w1 - w0) u^2, strength smoothstep(rare, 1, v) with u and v even on 0 to 1, half of them dark
  const lineMean = (groove.width[0] + (groove.width[1] - groove.width[0]) / 3) * meanSmoothstep(groove.rare) * (groove.bright - groove.dark)
  const octaves = Array.from({ length: fine.octaves }, (_, o) => o)
  const oct = octaves.map(() => new THREE.Vector4())
  const tint = octaves.map(() => new THREE.Vector4())
  const more = octaves.map(() => new THREE.Vector4())
  const rough = [new THREE.Vector4(), new THREE.Vector4()]
  const follow = new THREE.Vector4()
  const hueFit = new THREE.Vector4(fine.hue.warm, fine.hue.pink, fine.hue.green, fine.hue.gold)
  const fineFit = new THREE.Vector4(fine.first, fine.ratio, fine.filterFloor, 1)
  const mix = THREE.MathUtils.lerp
  // the strengths of the ladder for a camera this near the sheet (0 in the hold, 1 in the skim)
  const set = (t: number): void => {
    for (const o of octaves) {
      oct[o]!.set(mix(fine.level.dense[o]!, near.level.dense[o]!, t), fine.slope[o]!, mix(groove.strength[o]!, near.groove.strength[o]!, t), mix(fine.level.thin[o]!, near.level.thin[o]!, t))
      tint[o]!.set(mix(fine.hue.dense.warm[o]!, near.hue.dense.warm[o]!, t), mix(fine.hue.dense.pink[o]!, near.hue.dense.pink[o]!, t), mix(fine.hue.thin.warm[o]!, near.hue.thin.warm[o]!, t), mix(fine.hue.thin.pink[o]!, near.hue.thin.pink[o]!, t))
      more[o]!.set(mix(fine.edge[o]!, near.edge[o]!, t), mix(groove.strengthThin[o]!, near.groove.strengthThin[o]!, t), 0, 0)
    }
    rough[0]!.set(mix(fine.rough[0]!, near.rough.dense[0]!, t), mix(fine.rough[1]!, near.rough.dense[1]!, t), mix(fine.rough[0]!, near.rough.thin[0]!, t), mix(fine.rough[1]!, near.rough.thin[1]!, t))
    rough[1]!.set(mix(fine.even.rough[0]!, near.even.dense[0]!, t), mix(fine.even.rough[1]!, near.even.dense[1]!, t), mix(fine.even.rough[0]!, near.even.thin[0]!, t), mix(fine.even.rough[1]!, near.even.thin[1]!, t))
    follow.set(near.hue.follow.dense[0]!, near.hue.follow.dense[1]!, near.hue.follow.thin[0]!, near.hue.follow.thin[1]!).multiplyScalar(t)
    fineFit.w = mix(1, near.footprints, t)
    hueFit.z = mix(fine.hue.green, near.hue.green, t)
    hueFit.w = mix(fine.hue.gold, near.hue.gold, t)
  }
  set(0)
  // the mean of the square of a ringlet's level where the ringlets take turns, over two: the level is
  // 0.3 to 1 either way, even in between
  const lanesMean = (0.3 * 0.3 + 0.3 + 1) / 6
  return {
    texture,
    finest: fine.first * Math.pow(fine.ratio, fine.octaves - 1),
    set,
    uniforms: {
      uRfMap: { value: texture },
      uRfSpan: { value: new THREE.Vector4(span[0], 1 / (span[1] - span[0]), n, levels) },
      uRfLight: { value: new THREE.Vector4(1 / model.muSun + 1 / model.muHero, model.muSun, model.muHero, 0) },
      uRfFine: { value: fineFit },
      uRfMore: { value: more },
      uRfAmp: { value: new THREE.Vector4(lanesMean, fine.tau, 0, fine.shift) },
      uRfGroove: { value: new THREE.Vector4(groove.width[0], groove.width[1] - groove.width[0], groove.rare, fine.slopeWidth) },
      uRfGrooveFit: { value: new THREE.Vector4(groove.dark, groove.bright, lineMean, fine.filter) },
      uRfBunch: { value: new THREE.Vector4(fine.bunch[0], fine.bunch[1], groove.dense, groove.thin) },
      uRfLine: { value: new THREE.Vector4(groove.open, 0, 0, fine.even.from) },
      uRfRough: { value: rough },
      uRfFollow: { value: follow },
      uRfLanes: { value: new THREE.Vector4(fine.lanes.from, fine.lanes.amount, 0, 0) },
      uRfHue: { value: hueFit },
      uRfWarm: { value: new THREE.Vector3().fromArray(fine.hue.warmAxis) },
      uRfPink: { value: new THREE.Vector3().fromArray(fine.hue.pinkAxis) },
      uRfOct: { value: oct },
      uRfTint: { value: tint },
      uRfWaves: { value: fine.waves.trains.map((t) => new THREE.Vector4(t[0], t[1], t[2], t[3])) },
      uRfWaveFit: { value: new THREE.Vector4(ends.lum, ends.tau, ends.tight, 0) },
      uRfWaveEnds: { value: new THREE.Vector4(ends.rise[0], ends.rise[1], ends.fall[0], ends.fall[1]) },
    },
  }
}
