import * as THREE from 'three'
import cells from './cells.json'
import data from './life.json'

/**
 * The life of the close ground: convection in every cell, the same on the close side and on the
 * globe side, which both include this text and share these uniforms. Time is the only input.
 * The maps come from assets-src/sun/life/cells.py; the numbers from life.json.
 */
export interface LifeMaps { cellsPlate: THREE.Texture; swellPlate: THREE.Texture; cellsApron: THREE.Texture; swellApron: THREE.Texture }

export const LIFE_NAMES = ['uCellsPlate', 'uSwellPlate', 'uCellsApron', 'uSwellApron', 'uLifeReach', 'uLifeFlow', 'uLifeWave', 'uLifeSwell', 'uLifeFade', 'uLifeGrain', 'uLifeGrainMore', 'uLifeGrainTint', 'uLifeDots', 'uLifeDotsTint', 'uLifeStream', 'uLifeStreamMore', 'uLifeDome', 'uLifeClose', 'uLifeKnown', 'uLifeSplit']

export function lifeUniforms(maps: LifeMaps): Record<string, THREE.IUniform> {
  const d = data
  return {
    uCellsPlate: { value: maps.cellsPlate }, uSwellPlate: { value: maps.swellPlate }, uCellsApron: { value: maps.cellsApron }, uSwellApron: { value: maps.swellApron },
    uLifeReach: { value: new THREE.Vector4(cells.plate.flow[0]!, cells.plate.flow[1]!, cells.apron.flow[0]!, cells.apron.flow[1]!) },
    uLifeFlow: { value: new THREE.Vector3(d.flow.rate, d.flow.amount, d.stream.dim / d.stream.amount) },
    uLifeWave: { value: new THREE.Vector4(d.wave.amount, d.wave.rate, d.wave.rings, d.wave.breath) },
    uLifeSwell: { value: new THREE.Vector3(d.swell.amount, (2 * Math.PI) / d.swell.period, d.swell.step) },
    uLifeFade: { value: new THREE.Vector3(d.fade[0]!, d.fade[1]!, 1) },
    uLifeGrain: { value: new THREE.Vector4(d.grain.amount, d.grain.grid, d.grain.size, d.grain.rate) },
    uLifeGrainMore: { value: new THREE.Vector4(d.grain.lane[0]!, d.grain.lane[1]!, d.grain.drift, d.grain.share) },
    uLifeGrainTint: { value: new THREE.Vector4(d.grain.tint[0]!, d.grain.tint[1]!, d.grain.tint[2]!, d.grain.px[0]!) },
    uLifeDots: { value: new THREE.Vector4(d.dots.amount, d.dots.grid, d.dots.size, d.dots.rate) },
    uLifeDotsTint: { value: new THREE.Vector4(d.dots.tint[0]!, d.dots.tint[1]!, d.dots.tint[2]!, d.dots.share) },
    uLifeStream: { value: new THREE.Vector4(d.stream.amount, d.stream.fibres, d.stream.rate, d.grain.px[1]!) },
    uLifeStreamMore: { value: new THREE.Vector4(d.stream.clumps, d.stream.length, d.stream.share, d.stream.head) },
    uLifeDome: { value: new THREE.Vector4(d.dome.amount, d.dome.rim, d.dome.light[0]! / Math.hypot(d.dome.light[0]!, d.dome.light[1]!), d.dome.light[1]! / Math.hypot(d.dome.light[0]!, d.dome.light[1]!)) },
    uLifeClose: { value: new THREE.Vector4(d.close.share, d.close.period, d.close.dark, d.close.soft) },
    uLifeKnown: { value: new THREE.Vector3(d.known[0]!, d.known[1]!, d.wave.spread) },
    uLifeSplit: { value: new THREE.Vector4(d.split.share, d.split.period, d.split.dark, d.split.reach) },
  }
}

/** The frame's height, so that the life fades at the same size in the picture at any format. */
export function lifeFormat(uniforms: Record<string, THREE.IUniform>, height: number): void {
  ;(uniforms.uLifeFade!.value as THREE.Vector3).z = height / 1080
}

/** Needs inverseFilmic, grade, vhash and uGrad before it. */
export const LIFE_GLSL = /* glsl */ `
uniform sampler2D uCellsPlate;
uniform sampler2D uSwellPlate;
uniform sampler2D uCellsApron;
uniform sampler2D uSwellApron;
uniform vec4 uLifeReach;
uniform vec3 uLifeFlow;
uniform vec4 uLifeWave;
uniform vec3 uLifeSwell;
uniform vec3 uLifeFade;
uniform vec4 uLifeGrain;
uniform vec4 uLifeGrainMore;
uniform vec4 uLifeGrainTint;
uniform vec4 uLifeDots;
uniform vec4 uLifeDotsTint;
uniform vec4 uLifeStream;
uniform vec4 uLifeStreamMore;
uniform vec4 uLifeDome;
uniform vec4 uLifeClose;
uniform vec3 uLifeKnown;
uniform vec4 uLifeSplit;
// How much of the life a lookup with this footprint shows: all of it while a texel of the picture is
// large in the frame, none where the cells have become too small to carry it without shimmer.
float lifeSeen(vec2 dx, vec2 dy, vec2 size) {
  float foot = max(length(dx * size), length(dy * size)) / uGrad / uLifeFade.z;
  return 1.0 - smoothstep(uLifeFade.x, uLifeFade.y, foot);
}
vec3 lifeTex(sampler2D map, vec2 uv, vec2 dx, vec2 dy) {
  return inverseFilmic(grade(textureGrad(map, uv, dx, dy).rgb, 0.0));
}
// One picture of the ground, alive. Every cell is a small fountain:
//   the cells push on each other by their own slow cycle, so the lanes widen and narrow;
//   inside a cell the matter runs from the middle to the lanes and its detail is made again as it runs;
//   both shifts stay small against a cell and never add up: the life is carried by light, not by dragging the picture.
// cell: the size of one cell in uv. reach: the length of the stored flow in uv. spot: 1 inside the sunspot.
// inner: how far the place is inside its cell (0 in a lane). moved: the shift of the lookup in cells.
vec3 alive(sampler2D map, sampler2D cellMap, sampler2D swellMap, vec2 reach, vec2 uv, vec2 dx, vec2 dy, vec2 cell, float time, float seen, float spot, out float inner, out vec2 moved) {
  vec2 at = uv;
  vec2 f = vec2(0.0);
  vec2 rise = vec2(0.0);
  float phase = 0.0;
  float grow = 0.0;
  float known = 0.0;
  float rate = 0.5;
  inner = 0.0;
  for (int k = 0; k < (seen > 0.0 ? 1 : 0); k++) {
    vec2 e = cell * uLifeSwell.z;
    vec3 xa = textureGrad(swellMap, uv + vec2(e.x, 0.0), dx, dy).rgb;
    vec3 xb = textureGrad(swellMap, uv - vec2(e.x, 0.0), dx, dy).rgb;
    vec3 ya = textureGrad(swellMap, uv + vec2(0.0, e.y), dx, dy).rgb;
    vec3 yb = textureGrad(swellMap, uv - vec2(0.0, e.y), dx, dy).rgb;
    vec2 turn = vec2(cos(time * uLifeSwell.y), sin(time * uLifeSwell.y));
    // the push of a cell on its neighbours: the slope of the cell's own point on the circle, times how far inside
    vec4 held = vec4(dot(xa.rg * 255.0 - 128.0, turn) * xa.b, dot(xb.rg * 255.0 - 128.0, turn) * xb.b, dot(ya.rg * 255.0 - 128.0, turn) * ya.b, dot(yb.rg * 255.0 - 128.0, turn) * yb.b) / 127.0;
    vec2 slope = vec2(held.x - held.y, held.z - held.w) / (2.0 * uLifeSwell.z);
    rise = vec2(xa.b - xb.b, ya.b - yb.b) / (4.0 * uLifeSwell.z);
    at = uv + uLifeSwell.x * seen * slope * cell;
    vec3 c = textureGrad(cellMap, at, dx, dy).rgb;
    vec3 s = textureGrad(swellMap, at, dx, dy).rgb;
    vec2 own2 = (s.rg * 255.0 - 128.0) / 127.0;
    // 1 inside a cell that the map knows; it falls to 0 where neighbours disagree, in the spot and where no
    // cell is known, and the life falls with it, so no edge of the map can show
    known = smoothstep(uLifeKnown.x, uLifeKnown.y, length(own2));
    f = (c.rg * 255.0 - 128.0) / 127.0 * reach * vec2(1.0, -1.0) * seen * uLifeFlow.y * (1.0 - spot) * known;
    phase = atan(own2.y, own2.x + 1.0e-5) / 6.283185307179586 + 0.5;
    rate = c.b;
    inner = s.b;
    grow = dot(own2, turn) * inner;
  }
  float t = time * uLifeFlow.x + phase;
  float pa = fract(t);
  vec3 lin = lifeTex(map, at - f * (pa - 0.5), dx, dy);
  for (int k = 0; k < (dot(f, f) > 0.0 ? 1 : 0); k++) {
    lin = mix(lin, lifeTex(map, at - f * (fract(t + 0.5) - 0.5), dx, dy), abs(1.0 - 2.0 * pa));
  }
  // the cell's own cycle of light and height: the middle wells up bright and domes, the light runs out to the
  // rim, the rim cools and darkens; the dome is lit from one side like the picture
  // whole turns of the phase only, so that the place where the angle wraps does not show
  float turns = time * uLifeWave.y * (1.0 + uLifeKnown.z * (rate - 0.5)) + phase * 3.0;
  float well = sin(6.283185307179586 * (turns - (1.0 - inner) * uLifeWave.z));
  float dome = sin(6.283185307179586 * turns);
  float live = seen * (1.0 - spot) * known;
  float amp = smoothstep(0.0, 0.5, inner) * live;
  float rim = (1.0 - smoothstep(0.05, 0.55, inner)) * smoothstep(0.0, 0.08, inner);
  float lit = amp * uLifeWave.x * well + live * uLifeWave.w * grow
    - live * uLifeDome.x * dome * clamp(dot(rise, uLifeDome.zw), -1.0, 1.0) * smoothstep(0.04, 0.3, inner)
    - live * uLifeDome.y * rim * max(dome, 0.0);
  lin *= max(1.0 + lit, 0.2);
  // some cells close and open again: the dark of the lanes takes the cell from its rim inward, and gives it back
  float shut = (1.0 - smoothstep(uLifeClose.x, uLifeClose.x * 1.6, rate)) * live;
  for (int k = 0; k < (shut > 0.0 ? 1 : 0); k++) {
    float x = fract(time / uLifeClose.y + phase + 0.27);
    float open = 1.0 - smoothstep(0.12, 0.45, x) + smoothstep(0.55, 0.88, x);
    float edge = mix(1.0 + uLifeClose.w, -uLifeClose.w, open);
    lin *= mix(1.0, mix(uLifeClose.z, 1.0, smoothstep(edge - uLifeClose.w, edge + uLifeClose.w, inner)), shut * smoothstep(0.0, 0.03, inner));
  }
  // some cells split: the dark opens in the middle of the cell and grows toward its lanes, the parts that are
  // left brighten, then the middle fills again
  float parts = smoothstep(1.0 - uLifeSplit.x * 1.6, 1.0 - uLifeSplit.x, rate) * live;
  for (int k = 0; k < (parts > 0.0 ? 1 : 0); k++) {
    float x = fract(time / uLifeSplit.y + phase + 0.61);
    float open = smoothstep(0.08, 0.3, x) * (1.0 - smoothstep(0.55, 0.9, x));
    float edge = mix(1.0 + uLifeClose.w, 1.0 - uLifeSplit.w, open);
    float gone = smoothstep(edge - uLifeClose.w, edge + uLifeClose.w, inner);
    lin *= mix(1.0, mix(1.0 + 0.3 * open, uLifeSplit.z, gone), parts);
  }
  moved = (uv - at) / cell - f * (pa - 0.5) / cell;
  return lin;
}
// The penumbra: bright clumps that stream inward along fixed fibres, each fibre at its own speed; a clump is a
// bright head toward the spot with a tail behind it. q: the place from the spot's middle in radii of the dark
// core. px: the size of one such radius in the frame, in pixels of a 1080 line frame.
float lifeStream(vec2 q, float px, float time) {
  float r = length(q);
  float band = smoothstep(1.0, 1.3, r) * (1.0 - smoothstep(2.2, 2.9, r));
  float sum = 0.0;
  for (int k = 0; k < (band > 0.0 ? 1 : 0); k++) {
    float x = atan(q.y, q.x) / 6.283185307179586 * uLifeStream.y;
    float lane = floor(x);
    float fx = x - lane;
    float win = smoothstep(0.0, 0.3, fx) * (1.0 - smoothstep(0.7, 1.0, fx)) * smoothstep(1.5, 3.5, px * r * 6.283185307179586 / uLifeStream.y);
    float h1 = vhash(vec3(lane, 3.1, 0.7));
    float h2 = vhash(vec3(lane, 9.4, 2.2));
    float ph = (r + time * uLifeStream.z * (0.6 + 0.8 * h1)) * uLifeStreamMore.x + h2 * 19.0;
    float n = floor(ph);
    float f = ph - n;
    for (int i = 0; i < 2; i++) {
      float c = n - float(i);
      float len = uLifeStreamMore.y * (0.6 + 0.8 * vhash(vec3(lane, c, 1.9)));
      float d = f + float(i) - 0.2 - 0.5 * vhash(vec3(lane, c, 8.3));
      sum += step(vhash(vec3(lane, c, 5.5)), uLifeStreamMore.z) * (0.5 + 0.5 * vhash(vec3(lane, c, 6.7))) * smoothstep(-uLifeStreamMore.w * len, 0.0, d) * exp(-max(d, 0.0) / len);
    }
    // between the clumps the fibre is a little darker, so that what runs carries more of its light
    sum = band * (win * sum - uLifeFlow.z);
  }
  return sum;
}
// Bright grains in the lanes: a grid on the ground (g in stage units), one grain to a square, each with a
// life of its own: it comes up, drifts a little and winks out, and the next one comes up at another place.
// lane: 1 in a lane. px: the size of one grid square in the frame, in pixels of a 1080 line frame.
float lifeGrains(vec2 g, float lane, float px, float time) {
  float shown = lane * smoothstep(uLifeGrainTint.w, uLifeStream.w, px);
  float sum = 0.0;
  for (int k = 0; k < (shown > 0.0 ? 1 : 0); k++) {
    vec2 q = g / uLifeGrain.y;
    vec2 id = floor(q);
    float life = time * uLifeGrain.w * (0.6 + 0.8 * vhash(vec3(id, 1.3))) + vhash(vec3(id, 7.9)) * 17.0 + 40.0;
    float n = floor(life);
    float x = life - n;
    vec2 home = 0.3 + 0.4 * vec2(vhash(vec3(id, n * 1.37 + 2.1)), vhash(vec3(id.yx, n * 2.11 + 5.7)));
    vec2 way = vec2(vhash(vec3(id, n + 11.5)), vhash(vec3(id.yx, n + 13.5))) - 0.5;
    vec2 d = (fract(q) - home - way * uLifeGrainMore.z * (x - 0.5)) / uLifeGrain.z;
    float on = smoothstep(0.0, 0.3, x) * (1.0 - smoothstep(0.6, 1.0, x)) * step(vhash(vec3(id.yx + 3.0, n + 0.5)), uLifeGrainMore.w);
    sum = shown * on * exp(-dot(d, d));
  }
  return sum;
}
// Dots in the dark core of the spot that come and go. q: the place from the spot's middle, in radii of the core.
float lifeDots(vec2 q, float px, float time) {
  float r = length(q);
  float shown = (1.0 - smoothstep(0.75, 1.0, r)) * smoothstep(uLifeGrainTint.w, uLifeStream.w, px);
  float sum = 0.0;
  for (int k = 0; k < (shown > 0.0 ? 1 : 0); k++) {
    vec2 p = q / uLifeDots.y;
    vec2 id = floor(p);
    float life = time * uLifeDots.w * (0.6 + 0.8 * vhash(vec3(id, 2.7))) + vhash(vec3(id, 5.1)) * 13.0 + 40.0;
    float n = floor(life);
    float x = life - n;
    vec2 home = 0.3 + 0.4 * vec2(vhash(vec3(id, n * 1.91 + 0.7)), vhash(vec3(id.yx, n * 1.13 + 8.3)));
    vec2 d = (fract(p) - home) / uLifeDots.z;
    float on = smoothstep(0.0, 0.35, x) * (1.0 - smoothstep(0.55, 1.0, x)) * step(vhash(vec3(id.yx + 9.0, n + 0.5)), uLifeDotsTint.w);
    sum = shown * (0.35 + 0.65 * smoothstep(0.2, 0.8, r)) * on * exp(-dot(d, d));
  }
  return sum;
}`
