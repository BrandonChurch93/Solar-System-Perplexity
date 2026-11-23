import * as THREE from 'three'
import data from './life.json'

/**
 * The life of the close ground: convection in every cell, the same on the close side and on the
 * globe side, which both include this text and share these uniforms. Time is the only input.
 * The maps come from assets-src/sun/life/cells.py; the numbers from life.json.
 */
export interface LifeMaps { cellsPlate: THREE.Texture; swellPlate: THREE.Texture; cellsApron: THREE.Texture; swellApron: THREE.Texture }

export const LIFE_NAMES = ['uCellsPlate', 'uSwellPlate', 'uCellsApron', 'uSwellApron', 'uLifeFlow', 'uLifeWave', 'uLifeSwell', 'uLifeFade', 'uLifeGrain', 'uLifeGrainMore', 'uLifeGrainTint', 'uLifeDots', 'uLifeDotsTint', 'uLifeStream', 'uLifeStreamMore', 'uLifeDome', 'uLifeClose', 'uLifeKnown', 'uLifePlace', 'uLifeBoil', 'uLifeMade', 'uLifeMadeMore', 'uLifeShine', 'uLifeRun', 'uLifeStill', 'uLifeSplit', 'uLifeSplitAt', 'uLifeSplitMore', 'uLifeSplitTint', 'uLifeLift', 'uLifeCalm']

export function lifeUniforms(maps: LifeMaps): Record<string, THREE.IUniform> {
  const d = data
  return {
    uCellsPlate: { value: maps.cellsPlate }, uSwellPlate: { value: maps.swellPlate }, uCellsApron: { value: maps.cellsApron }, uSwellApron: { value: maps.swellApron },
    uLifeFlow: { value: new THREE.Vector4(d.shine.cut[1]!, d.wave.late, d.stream.dim / d.stream.amount, d.flow.slow) },
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
    uLifePlace: { value: new THREE.Vector4(d.apart, d.edge, d.made.sharp, d.flow.period) },
    uLifeRun: { value: new THREE.Vector4(d.flow.travel, d.flow.keep, d.flow.age, d.flow.offset) },
    uLifeBoil: { value: new THREE.Vector4(d.wave.front, d.wave.tail, d.wave.wake, d.wave.vary) },
    uLifeMade: { value: new THREE.Vector4(d.made.amount, d.made.rate, d.made.grid, d.made.slide) },
    uLifeMadeMore: { value: new THREE.Vector4(d.made.warp, d.made.second, d.close.lift, d.made.px) },
    uLifeShine: { value: new THREE.Vector4(d.flow.reach, d.flow.blur, d.shine.amount, d.shine.cut[0]!) },
    uLifeStill: { value: new THREE.Vector4(d.flow.still[0]!, d.flow.still[1]!, d.flow.still[2]!, d.flow.ease) },
    uLifeSplit: { value: d.split.sites.map((v) => new THREE.Vector4(v[0]!, v[1]!, v[2]!, v[3]!)) },
    uLifeSplitAt: { value: new THREE.Vector4(d.split.at[0]!, d.split.at[1]!, d.split.at[2]!, d.split.takes) },
    uLifeSplitMore: { value: new THREE.Vector4(d.split.width, d.split.range, d.split.pull, d.split.wander) },
    uLifeSplitTint: { value: new THREE.Vector4(d.split.tint[0]!, d.split.tint[1]!, d.split.tint[2]!, d.split.shade) },
    uLifeLift: { value: d.flow.lift },
    uLifeCalm: { value: 1 },
  }
}

/** The share of the life's own light at this time (0 at the moment named in life.json, 1 away from it); it is set on the given uniforms and returned. */
export function lifeCalm(uniforms: Record<string, THREE.IUniform>, time: number): number {
  const x = Math.min(Math.abs(time - data.calm.at) / data.calm.ease, 1)
  const calm = x * x * (3 - 2 * x)
  uniforms.uLifeCalm!.value = calm
  return calm
}

/** The frame's height, so that the life fades at the same size in the picture at any format. */
export function lifeFormat(uniforms: Record<string, THREE.IUniform>, height: number): void {
  ;(uniforms.uLifeFade!.value as THREE.Vector3).z = height / 1080
}

/** Needs inverseFilmic, grade, vhash, vnoise and uGrad before it. */
export const LIFE_GLSL = /* glsl */ `
uniform sampler2D uCellsPlate;
uniform sampler2D uSwellPlate;
uniform sampler2D uCellsApron;
uniform sampler2D uSwellApron;
uniform vec4 uLifeFlow;
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
uniform vec4 uLifePlace;
uniform vec4 uLifeRun;
uniform vec4 uLifeBoil;
uniform vec4 uLifeMade;
uniform vec4 uLifeMadeMore;
uniform vec4 uLifeShine;
uniform vec4 uLifeStill;
uniform vec4 uLifeSplit[3];
uniform vec4 uLifeSplitAt;
uniform vec4 uLifeSplitMore;
uniform vec4 uLifeSplitTint;
uniform float uLifeLift;
// the share of the life's own light: 1 everywhere but round the moment named in life.json (calm), where it falls
// to nil, so that the frame there is the picture itself
uniform float uLifeCalm;
// How much of the life a lookup with this footprint shows: all of it while a texel of the picture is
// large in the frame, none where the cells have become too small to carry it without shimmer.
float lifeSeen(vec2 dx, vec2 dy, vec2 size) {
  float foot = max(length(dx * size), length(dy * size)) / uGrad / uLifeFade.z;
  return 1.0 - smoothstep(uLifeFade.x, uLifeFade.y, foot);
}
// One picture of the ground, alive.
//   the stream: the picture itself runs from the middle of every cell to its lanes, along the way the map
//   gives (nil in the middle and in the lane, so the lanes stay where the picture has them). It is looked up
//   twice, half a period apart; each look starts half its travel upstream and ends half its travel
//   downstream, and counts for nothing at both ends, so nothing drifts and nothing jumps. When a look
//   stands at its own place it counts alone: at whole periods the picture is the plate, untouched. Each place
//   has its own shift of that clock, except at the moments named in life.json. The fine texture runs the
//   whole way, the broad shapes a part of it. What has just come up is brighter, what nears the lane darker.
//   fronts: light wells up where the ground lies deepest inside its lanes and runs to the lanes, one front
//   after another, each of its own strength, with a darker wake.
//   knots: noise on the ground whose third axis is the depth and the time, so every knot of it comes up
//   toward the middle, crosses toward the lane and is gone (two sizes, each resting where it would be too
//   small in the frame to hold still).
//   Some cells close from the rim inward and open again; the cells push on each other by their own slow
//   cycle, so the lanes widen and narrow.
// g: the place on the ground in cell sizes. cell: the size of one cell in uv. reach: the length the stream
// is measured in, against that cell (the two pictures call different sizes a cell, and must run alike where
// they meet). spot: 1 inside the sunspot.
// inner: how far the place is inside its cell (0 in a lane). moved: the shift of the lookup in cells.
vec3 alive(sampler2D map, sampler2D cellMap, sampler2D swellMap, vec2 g, vec2 uv, vec2 dx, vec2 dy, vec2 cell, float reach, float time, float seen, float spot, out float inner, out vec2 moved) {
  vec2 at = uv;
  vec2 rise = vec2(0.0);
  float phase = 0.0;
  float grow = 0.0;
  float known = 0.0;
  float rate = 0.5;
  float deep = 0.0;
  vec2 way = vec2(0.0);
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
    // cell is known. What belongs to one cell of the map (its slow cycle, its closing) falls with it, so no
    // edge of the map can show.
    known = smoothstep(uLifeKnown.x, uLifeKnown.y, length(own2));
    phase = atan(own2.y, own2.x + 1.0e-5) / 6.283185307179586 + 0.5;
    rate = abs(fract(phase + 0.37) * 2.0 - 1.0);
    way = (c.rg * 255.0 - 128.0) / 127.0 * vec2(1.0, -1.0);
    deep = c.b;
    inner = s.b;
    grow = dot(own2, turn) * inner;
  }
  // A big cell splits (life.json, split): a dark point opens in its middle and grows into a lane across it.
  // The matter on both sides then runs to the new lane as to any other, the fronts reach it last and the
  // knots keep out of it. Before a site's own start it shows nothing.
  float cut = 0.0;
  float flank = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 site = uLifeSplit[i];
    vec2 rel = g - site.xy;
    float grown = clamp((time - uLifeSplitAt[i]) / uLifeSplitAt.w, 0.0, 1.0) * seen * (1.0 - spot);
    for (int k = 0; k < ((grown > 0.0 && dot(rel, rel) < 6.0 * site.w * site.w) ? 1 : 0); k++) {
      // the view flattens the ground: across the lane the distance is taken as the picture shows it, in
      // widths of a cell, so a lane is as wide in the frame whichever way it runs
      vec2 size = vec2(textureSize(map, 0));
      vec2 squash = vec2(1.0, cell.y * size.y / (cell.x * size.x));
      vec2 dir = vec2(cos(site.z), sin(site.z));
      vec2 shownDir = normalize(dir * squash);
      float along = dot(rel, dir) / site.w;
      // no ruled line: it wanders by its own width
      float bend = uLifeSplitMore.w * uLifeSplitMore.x * (vnoise(vec3(along * 2.0 + 13.1 * float(i), 0.5, 3.3)) + 0.5 * vnoise(vec3(along * 5.0 + 3.7 * float(i), 4.5, 1.3)) - 0.75);
      float across = rel.x * squash.x * shownDir.y - rel.y * squash.y * shownDir.x + bend;
      // it opens as a point and runs to both ends, widest where it began
      float ease = grown * grown * (3.0 - 2.0 * grown);
      float far = abs(along) / max(ease, 1.0e-3);
      float len = 1.0 - smoothstep(0.8, 1.15, far);
      float width = uLifeSplitMore.x * (0.55 + 0.45 * ease) * (1.0 - 0.6 * min(far, 1.0));
      float line = len * smoothstep(0.0, 0.2, grown) * (1.0 - smoothstep(0.2, 1.0, abs(across) / width));
      cut = max(cut, line);
      flank = max(flank, len * ease * exp(-across * across / (6.0 * width * width)));
      // the pull: toward the lane from both sides, strongest uLifeSplitMore.y cell widths away from it;
      // the cell's own stream gives way there
      float x = across / uLifeSplitMore.y;
      float hold = len * ease * exp(-0.25 * x * x);
      way = way * (1.0 - uLifeSplitMore.z * hold) + vec2(-dir.y, dir.x) * (uLifeSplitMore.z * len * ease * x * exp(0.5 - 0.5 * x * x));
      deep *= 1.0 - 0.6 * hold;
      inner *= 1.0 - line;
    }
  }
  // the half width of a cell in the frame, in pixels of a 1080 line frame
  float unit = 0.5 / max(max(length(dx / cell), length(dy / cell)), 1.0e-6) / uLifeFade.z;
  // two slow numbers of the place, so that neighbours are not in step
  float late = vnoise(vec3(g * uLifePlace.x, 3.7));
  float lot = vnoise(vec3(g * uLifePlace.x * 1.7 + 11.3, 8.1));
  float run = seen * (1.0 - spot);
  // the stream also runs in the penumbra of the spot, outward along its fibrils
  float fast = length(way) * seen;
  // the picture as it is shown, before it is brought back to light
  vec3 shown = vec3(0.0);
  for (int k = 0; k < (fast > 0.0 ? 0 : 1); k++) {
    shown = textureGrad(map, at, dx, dy).rgb;
  }
  for (int k = 0; k < (fast > 0.0 ? 1 : 0); k++) {
    // every place has its own shift of the clock, so that the ground does not beat as one. Near the moments
    // named in life.json the shifts close to nil: there every look stands at its own place, and the frame is
    // the picture itself. The clock of a place never runs back while the shift is under
    // 2 * ease / (1.5 * period).
    float even = smoothstep(0.0, uLifeStill.w, abs(time - uLifeStill.x)) * smoothstep(0.0, uLifeStill.w, abs(time - uLifeStill.y)) * smoothstep(0.0, uLifeStill.w, abs(time - uLifeStill.z));
    float clock = time / uLifePlace.w + uLifeRun.w * (late - 0.5) * even;
    float p1 = fract(clock + 0.5);
    float p2 = fract(clock);
    float w1 = 1.0 - abs(2.0 * p1 - 1.0);
    float w2 = 1.0 - w1;
    // the travel of one look over its whole life, in uv
    vec2 gone = way * cell * (uLifeRun.x * reach * seen);
    vec2 o1 = gone * (p1 - 0.5);
    vec2 o2 = gone * (p2 - 0.5);
    // what has just come up is brighter, what nears the lane darker
    float b1 = exp2(uLifeRun.z * fast * (1.0 - 2.0 * p1));
    float b2 = exp2(uLifeRun.z * fast * (1.0 - 2.0 * p2));
    // The picture is taken apart into its broad shapes (the picture seen through a wide footprint) and the
    // fine texture on them (the picture against that). The fine texture runs the whole way. The broad shapes
    // run a part of it only, so a cell keeps its outline and its lanes, and two looks never show as a
    // double picture of the cell. All of it is done on the picture as shown, so the result is a picture
    // of the same kind, and at a whole period it is the picture itself.
    float wide = uLifeShine.y;
    vec3 f1 = textureGrad(map, at - o1, dx, dy).rgb / max(textureGrad(map, at - o1, dx * wide, dy * wide).rgb, vec3(0.002));
    vec3 f2 = textureGrad(map, at - o2, dx, dy).rgb / max(textureGrad(map, at - o2, dx * wide, dy * wide).rgb, vec3(0.002));
    vec3 g1 = textureGrad(map, at - o1 * uLifeFlow.w, dx * wide, dy * wide).rgb;
    vec3 g2 = textureGrad(map, at - o2 * uLifeFlow.w, dx * wide, dy * wide).rgb;
    // two looks half a travel apart do not agree in the fine texture, and their mean is flatter than either.
    // It is brought back toward its strength, as far as the two are apart by more than a few pixels.
    float apart = smoothstep(uLifeShine.x, 4.0 * uLifeShine.x, fast * uLifeRun.x * reach * unit);
    float keep = mix(1.0, inversesqrt(w1 * w1 + w2 * w2), uLifeRun.y * apart);
    // fine texture laid on broad shapes it did not grow on is a little darker in the mean than the picture;
    // that is given back by how far the looks stand from their own places, so the ground keeps its level
    float off = 2.0 * (w1 * abs(p1 - 0.5) + w2 * abs(p2 - 0.5));
    shown = (g1 * (w1 * b1) + g2 * (w2 * b2)) * max(vec3(1.0) + ((f1 - 1.0) * w1 + (f2 - 1.0) * w2) * keep, vec3(0.0)) * (1.0 + uLifeLift * off * apart);
  }
  vec3 lin = inverseFilmic(grade(shown, 0.0));
  float body = run * smoothstep(0.0, uLifePlace.y, inner) * uLifeCalm;
  for (int k = 0; k < (body > 0.0 ? 1 : 0); k++) {
    float slide = deep * uLifeMade.w + time * uLifeMade.y;
    float f1 = smoothstep(uLifeMadeMore.w, 2.0 * uLifeMadeMore.w, 2.0 * unit / uLifeMade.z);
    float f2 = smoothstep(uLifeMadeMore.w, 2.0 * uLifeMadeMore.w, 2.0 * unit / (uLifeMade.z * 2.3));
    float n1 = vnoise(vec3(g * uLifeMade.z, slide));
    float n2 = vnoise(vec3(g * (uLifeMade.z * 2.3) + 7.3, slide * 1.6 + 3.1));
    // knots of light with gaps between them, not a haze and not dents: only the upper half of the noise counts,
    // and the mean of it is taken off so that the ground keeps its level
    float cut = 1.0 / uLifePlace.z;
    float made = f1 * (smoothstep(0.5, 0.5 + cut, n1) - 0.25) + uLifeMadeMore.y * f2 * (smoothstep(0.5, 0.5 + cut, n2) - 0.25);
    float shine = f1 * smoothstep(uLifeShine.w, uLifeFlow.x, n1 * (0.55 + 0.9 * mix(0.5, n2, f2)));
    // the fronts. u counts them: a whole number passes when a front does. Each front has its own strength
    // (the number changes half way between two fronts, where the front's light is nil).
    float u = time * uLifeWave.y * (1.0 + uLifeKnown.z * (lot - 0.5)) + late * uLifeFlow.y + (deep + uLifeMadeMore.x * made) * uLifeWave.z;
    float n = floor(u + 0.5);
    float x = fract(u);
    float strong = 1.0 - uLifeBoil.w * (0.5 + 0.5 * sin(6.283185307179586 * (lot * 3.0 + n * 0.618034)));
    float peak = x < 0.5 ? exp(-x / uLifeBoil.y) * (1.0 - smoothstep(0.3, 0.5, x)) : smoothstep(1.0 - uLifeBoil.x, 1.0, x);
    float wake = smoothstep(0.5 * uLifeBoil.y, 2.5 * uLifeBoil.y, x) * (1.0 - smoothstep(1.0 - 2.5 * uLifeBoil.x, 1.0 - uLifeBoil.x, x));
    lin *= exp2(body * (uLifeWave.x * (strong * peak - uLifeBoil.z * wake) + 2.0 * uLifeMade.x * made + uLifeShine.z * shine));
  }
  float live = seen * (1.0 - spot) * known * uLifeCalm;
  for (int k = 0; k < (live > 0.0 ? 1 : 0); k++) {
    // the cell's own slow cycle of height: it domes and sinks, lit from one side like the picture, and its rim
    // cools as it domes
    float dome = sin(6.283185307179586 * (time * uLifeWave.y + phase * 3.0));
    float rim = (1.0 - smoothstep(0.05, 0.55, inner)) * smoothstep(0.0, 0.08, inner);
    float lit = live * uLifeWave.w * grow
      - live * uLifeDome.x * dome * clamp(dot(rise, uLifeDome.zw), -1.0, 1.0) * smoothstep(0.04, 0.3, inner)
      - live * uLifeDome.y * rim * max(dome, 0.0);
    lin *= max(1.0 + lit, 0.2);
    // some cells close and open again: the dark of the lanes takes the cell from its rim inward, and gives it back
    float shut = (1.0 - smoothstep(uLifeClose.x, uLifeClose.x * 1.6, rate)) * live;
    for (int j = 0; j < (shut > 0.0 ? 1 : 0); j++) {
      float y = fract(time / uLifeClose.y + phase + 0.27);
      float open = 1.0 - smoothstep(0.12, 0.45, y) + smoothstep(0.55, 0.88, y);
      float edge = mix(1.0 + uLifeClose.w, -uLifeClose.w, open);
      lin *= mix(1.0, mix(uLifeClose.z, 1.0 + uLifeMadeMore.z * (1.0 - open), smoothstep(edge - uLifeClose.w, edge + uLifeClose.w, inner)), shut * smoothstep(0.0, 0.03, inner));
    }
  }
  // the new lane of a cell that splits: dark and red like the lanes of the picture, shaded on its flanks
  lin *= mix(vec3(1.0), uLifeSplitTint.rgb, cut) * (1.0 - uLifeSplitTint.w * flank * (1.0 - cut));
  moved = (uv - at) / cell;
  return lin;
}
// The penumbra: bright clumps that stream along fixed fibres, each fibre at its own speed, outward where the
// rate is negative and inward where it is positive; a clump is a bright head with a tail behind it. q: the place from the spot's middle in radii of the dark
// core. px: the size of one such radius in the frame, in pixels of a 1080 line frame.
float lifeStream(vec2 q, float px, float time) {
  float r = length(q);
  float band = smoothstep(1.0, 1.3, r) * (1.0 - smoothstep(2.2, 2.9, r));
  float sum = 0.0;
  for (int k = 0; k < (band > 0.0 ? 1 : 0); k++) {
    float x = atan(q.y, q.x) / 6.283185307179586 * uLifeStream.y;
    float lane = floor(x);
    float fx = x - lane;
    float win = (0.5 - 0.5 * cos(6.283185307179586 * fx)) * smoothstep(1.5, 3.5, px * r * 6.283185307179586 / uLifeStream.y);
    float h1 = vhash(vec3(lane, 3.1, 0.7));
    float h2 = vhash(vec3(lane, 9.4, 2.2));
    float ph = (r + time * uLifeStream.z * (0.6 + 0.8 * h1)) * uLifeStreamMore.x + h2 * 19.0;
    float n = floor(ph);
    float f = ph - n;
    float way = uLifeStream.z < 0.0 ? -1.0 : 1.0;
    for (int i = -1; i < 2; i++) {
      float c = n - way * float(i);
      float len = uLifeStreamMore.y * (0.6 + 0.8 * vhash(vec3(lane, c, 1.9)));
      float d = way * (f - 0.2 - 0.5 * vhash(vec3(lane, c, 8.3))) + float(i);
      // a soft grain: round at both ends, its head shorter than its tail
      float e = d / (len * (d < 0.0 ? uLifeStreamMore.w : 1.0));
      sum += step(vhash(vec3(lane, c, 5.5)), uLifeStreamMore.z) * (0.5 + 0.5 * vhash(vec3(lane, c, 6.7))) * exp(-e * e);
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
