import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { NOISE_GLSL } from '../../terrain/relief'
import { GRADE_GLSL } from './grade'
import { STAGE_GLSL, stage } from './stage'
import data from './convect.json'

/**
 * The close ground of the Sun as a convecting surface made by functions of a ground point and of time. No picture
 * is read for it and nothing is carried from frame to frame.
 *
 * Cells are the cells of a weighted diagram of seeds. Every lattice square holds two seeds whose lives run half a
 * life apart. A seed is born at nil weight (its cell is empty then), grows, may part into two halves with a lane
 * that grows in from the rim, sinks back to nil weight and is swallowed by its neighbours; the next life starts at
 * another place. The height (domes over sunken lanes, the funnel of the sunspot) displaces a dense mesh, so near
 * cells hide far ones and the horizon is the outline of the cells. The colour is emitted light: it follows the heat
 * of the same functions and the angle between the line of sight and the relief's own normal.
 */

type V2 = [number, number]

const chart = (p: THREE.Vector3): V2 => {
  const lay = p.clone().sub(stage.down)
  const up = stage.down.clone().negate()
  const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(stage.down, stage.down.z).normalize()
  const right = fwd.clone().cross(up).normalize()
  const gx = lay.dot(right)
  const gy = lay.dot(fwd)
  const ring = Math.hypot(gx, gy)
  const k = (stage.radius * Math.asin(Math.min(ring / stage.radius, 1))) / Math.max(ring, 1e-4)
  return [gx * k, gy * k]
}

export const CONVECT_GLSL = /* glsl */ `
uniform vec4 uCvCell;
uniform vec4 uCvLife;
uniform vec4 uCvGrow;
uniform vec4 uCvLane;
uniform vec4 uCvDome;
uniform vec4 uCvWarp;
uniform vec4 uCvSpot;
uniform vec4 uCvPit;
uniform vec4 uCvFibre;
uniform vec4 uCvPetal;
uniform vec4 uCvPetalMore;
uniform vec4 uCvThread;
uniform vec4 uCvWarpMore;
uniform vec4 uCvGap;
uniform float uCvTime;
vec3 cvH3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
// The cells at ground point p (stage units) and time t (seconds).
// e: distance to the nearest lane, ge: its gradient (both in stage units), rel: p minus the cell's own middle in
// lattice units, own: x the age of the cell's life from 0 to 1, y a number of its own, z its weight.
void cvCells(vec2 p, float t, out float e, out vec2 ge, out vec2 rel, out vec3 own) {
  float L = uCvCell.x;
  vec2 q = p / L;
  q += uCvWarp.x * (vec2(vnoise(vec3(q * uCvWarp.y, t * uCvWarp.z)), vnoise(vec3(q.yx * uCvWarp.y + 31.7, t * uCvWarp.z + 7.3))) - 0.5);
  q += uCvWarpMore.x * (vec2(vnoise(vec3(q * uCvWarpMore.y + 13.1, t * uCvWarpMore.z)), vnoise(vec3(q.yx * uCvWarpMore.y + 57.9, t * uCvWarpMore.z + 3.1))) - 0.5);
  vec2 base = floor(q);
  vec2 sp[36];
  float so[36];
  float sm[36];
  float sa[36];
  vec3 si[36];
  int n = 0;
  int bi = 0;
  float best = 1e9;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 id = base + vec2(float(i), float(j));
      vec3 hc = cvH3(vec3(id, 3.1));
      float period = mix(uCvLife.x, uCvLife.y, hc.y);
      for (int s = 0; s < 2; s++) {
        float life = t / period + hc.x + 0.5 * float(s);
        float nth = floor(life);
        float x = life - nth;
        vec3 h1 = cvH3(vec3(id, nth * 2.0 + float(s) + 11.7));
        vec3 h2 = cvH3(vec3(id.yx + 37.2, nth * 2.0 + float(s) + 5.3));
        vec2 c = id + 0.5 + uCvCell.y * (h1.xy - 0.5) + uCvWarp.w * (h2.yz - 0.5) * (x - 0.5);
        float ang = 6.2831853 * h1.z;
        vec2 u = vec2(cos(ang), sin(ang));
        float parts = step(h2.x, uCvLife.z);
        float apart = uCvCell.w * smoothstep(0.45, 0.85, x) * parts;
        // the cell's weight in the diagram: its rim moves at an even pace while it grows and while it is
        // swallowed, and at both ends of the life the cell is empty for certain
        float w = smoothstep(0.0, uCvLife.w, x) * (1.0 - smoothstep(1.0 - uCvLife.w, 1.0, x));
        float grown = clamp(x / uCvGrow.x, 0.0, 1.0);
        float left = clamp((1.0 - x) / uCvGrow.y, 0.0, 1.0);
        float o = uCvCell.z * (pow(1.0 - grown, uCvGrow.z) + pow(1.0 - left, uCvGrow.z)) + uCvGrow.w * (2.0 - smoothstep(0.0, 0.06, x) - smoothstep(0.0, 0.06, 1.0 - x));
        float m = smoothstep(0.3, 0.55, x) * parts;
        for (int k = 0; k < 2; k++) {
          vec2 at = c + u * (apart * (k == 0 ? 1.0 : -1.0));
          vec2 d = q - at;
          float D = dot(d, d) + o;
          sp[n] = at;
          so[n] = o;
          sm[n] = m;
          sa[n] = ang;
          si[n] = vec3(x, h2.y, w);
          if (D < best) {
            best = D;
            bi = n;
          }
          n++;
        }
      }
    }
  }
  vec2 s1 = sp[bi];
  float acc = 0.0;
  vec2 gacc = vec2(0.0);
  float sharp = uCvLane.w;
  for (int i = 0; i < 36; i++) {
    if (i == bi) continue;
    float ej;
    vec2 gj;
    if (i / 2 == bi / 2) {
      // the other half of the same cell: the lane between the halves runs through the cell's middle, and it is
      // there (still shallow) before the halves part
      vec2 u = vec2(cos(sa[i]), sin(sa[i]));
      float side = dot(q - 0.5 * (s1 + sp[i]), u);
      ej = abs(side) + (1.0 - sm[i]) * uCvLane.z;
      gj = u * sign(side);
    } else {
      vec2 ds = s1 - sp[i];
      float len = max(length(ds), 1e-4);
      vec2 dq = q - sp[i];
      ej = (dot(dq, dq) + so[i] - best) / (2.0 * len);
      gj = ds / len;
    }
    float wt = exp(-sharp * min(ej, 4.0));
    acc += wt;
    gacc += wt * gj;
  }
  float gap = uCvGap.x * (1.0 - uCvGap.z + 2.0 * uCvGap.z * vnoise(vec3(p * uCvGap.y, 1.7 + t * uCvGap.w)));
  e = max(max(-log(max(acc, 1e-30)) / sharp, 0.0) * L - gap, 0.0);
  ge = gacc / max(acc, 1e-30);
  own = si[bi];
  rel = q - s1 - uCvLane.y * vec2(cos(own.y * 40.0), sin(own.y * 40.0)) * own.z;
}
// A pattern carried outward from the cell's middle. Two takes of it, half a turn apart: each is carried for one
// turn and then begins again nearer the middle, and it has no weight at the moment it begins again.
float cvCarried(vec2 rel, float r, vec2 u, float key, float t, float scale, float turn, float speed) {
  float reach = smoothstep(0.0, 0.3, r);
  float acc = 0.0;
  float norm = 0.0;
  for (int k = 0; k < 2; k++) {
    float ph = t / turn + 0.5 * float(k) + key * 3.0;
    float nth = floor(ph);
    float x = ph - nth;
    float w = 1.0 - abs(2.0 * x - 1.0);
    vec2 q = rel - u * (speed * turn * (x - 0.5) * reach);
    acc += w * (vnoise(vec3(q * scale, nth * 7.3 + key * 31.0 + float(k) * 3.7)) - 0.5);
    norm += w * w;
  }
  return 0.5 + acc / sqrt(norm);
}
// Plasma that runs outward in a cell. x: the lumps of the cell's top (they are relief too): round tops with
// creases between them, carried outward. y: fine threads fixed in angle round the middle that travel out.
vec2 cvPetal(vec2 rel, float key, float t) {
  float r = length(rel);
  vec2 u = r > 1e-5 ? rel / r : vec2(1.0, 0.0);
  float l1 = min(abs(2.0 * cvCarried(rel, r, u, key, t, uCvPetal.y, uCvPetal.z, uCvPetal.w) - 1.0), 1.0);
  float l2 = min(abs(2.0 * cvCarried(rel, r, u, key + 0.37, t, uCvPetalMore.x, uCvPetalMore.y, uCvPetalMore.z) - 1.0), 1.0);
  float n3 = vnoise(vec3(u * uCvThread.x, r * uCvThread.y - t * uCvThread.z) + vec3(key * 41.0, 9.0, 0.0));
  float thread = 1.0 - abs(2.0 * n3 - 1.0);
  float open = smoothstep(0.02, 0.14, r);
  return vec2(0.65 * l1 * (2.0 - l1) + 0.35 * l2 * (2.0 - l2), mix(0.35, thread * thread, open));
}
float cvLane(float e) {
  return 1.0 - exp(-e / uCvDome.y);
}
// Height of the cells over the ball at p (stage units), with the parts the colour needs.
float cvDome(vec2 p, float t, out float e, out vec2 ge, out vec2 rel, out vec3 own, out vec2 petal) {
  cvCells(p, t, e, ge, rel, own);
  float r2 = dot(rel, rel);
  float tall = uCvDome.x * (0.6 + 0.8 * own.y) * mix(0.55, 1.0, own.z);
  float lane = cvLane(e);
  petal = cvPetal(rel, own.y, t);
  float old = smoothstep(0.5, 1.0, own.x);
  return (tall + uCvPetal.x * (petal.x - 0.4)) * lane + uCvDome.z * own.z * exp(-r2 / (uCvDome.w * uCvDome.w)) - uCvPetalMore.w * old * exp(-r2 / 0.02) - uCvDome.x * uCvLane.x;
}
// The fibres of the penumbra: long in the direction of the spot's middle, many round it.
float cvFibre(vec2 u, float rs) {
  float n = vnoise(vec3(u * uCvFibre.x, rs * uCvFibre.z));
  float n2 = vnoise(vec3(u * uCvFibre.x * 2.3 + 3.1, rs * uCvFibre.z * 1.9 + 7.7));
  float ridge = 1.0 - abs(2.0 * n - 1.0);
  float ridge2 = 1.0 - abs(2.0 * n2 - 1.0);
  return 0.6 * ridge * ridge + 0.4 * ridge2 * ridge2;
}
// The sunspot at ground point p: x how much of the place is the spot (1 inside the penumbra), y the height of its
// funnel (stage units), z the distance from its middle over the umbra's radius, w the fibre there.
vec4 cvSpot(vec2 p) {
  vec2 d = p - uCvSpot.xy;
  float r = length(d);
  vec2 u = r > 1e-5 ? d / r : vec2(1.0, 0.0);
  float rs = r / uCvSpot.z;
  float fib = cvFibre(u, rs);
  float lobes = vnoise(vec3(u * 1.3 + 4.7, 0.5)) - 0.5;
  float outer = uCvSpot.w * (1.0 + uCvFibre.w * (lobes + 1.3 * (fib - 0.4)));
  float inside = 1.0 - smoothstep(outer * 0.8, outer * 1.04, r);
  float umbra = uCvSpot.z * (1.0 + 0.4 * uCvFibre.w * lobes);
  float fall = 1.0 - smoothstep(umbra, outer, r);
  float pit = 1.0 - smoothstep(umbra * uCvPit.z, umbra * uCvPit.w, r);
  float h = -uCvPit.x * fall - uCvPit.y * pit + uCvFibre.y * (fib - 0.4) * (1.0 - pit);
  return vec4(inside, h, rs, fib);
}
// Height of the ground over the ball at p (stage units).
float cvHeight(vec2 p, float t) {
  float e;
  vec2 ge;
  vec2 rel;
  vec3 own;
  vec2 petal;
  float dome = cvDome(p, t, e, ge, rel, own, petal);
  vec4 spot = cvSpot(p);
  return mix(dome, spot.y, spot.x);
}`

const VERT = /* glsl */ `
precision highp float;
uniform vec4 uCvMesh;
out vec2 vG;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
${STAGE_GLSL}
${NOISE_GLSL}
${CONVECT_GLSL}
void main() {
  // the mesh lies still on the ground: rings round the point under the stage's camera, close together near it
  float arc = uCvMesh.x * (exp(uCvMesh.y * position.x) - 1.0);
  vec2 g = arc * vec2(cos(position.y), sin(position.y));
  float alpha = arc / ST_RADIUS;
  vec3 dir = -ST_DOWN * cos(alpha) + sin(alpha) * (ST_RIGHT * cos(position.y) + ST_FWD * sin(position.y));
  float h = cvHeight(g, uCvTime);
  vec3 p = ST_CENTRE + dir * (ST_RADIUS + h * uCvMesh.z);
  vG = g;
  vPos = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uCam;
uniform sampler2D uRamp;
uniform sampler2D uGlow;
uniform vec4 uBox, uLand, uKick, uFlash;
uniform float uGlowBeat, uGlowPlain, uLandOn, uKickOn;
uniform vec2 uFlashOn;
uniform vec3 uLandVeil;
uniform float uGroundMost;
uniform vec2 uGlowReach;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uCvHeat;
uniform vec4 uCvTone;
uniform vec4 uCvShade;
uniform vec4 uCvGrain;
uniform vec4 uCvRim;
uniform vec4 uCvUmbra;
uniform vec4 uCvFibreLook;
uniform vec4 uCvVeil;
uniform vec3 uCvVeilTint;
uniform vec4 uCvFar;
uniform vec4 uCvMesh;
in vec2 vG;
in vec3 vPos;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${STAGE_GLSL}
${NOISE_GLSL}
${GRADE_GLSL}
${CONVECT_GLSL}
vec3 thrown(vec3 base, vec3 lit) {
  float b = dot(base, vec3(0.3, 0.5, 0.2));
  float d = dot(lit, vec3(0.3, 0.5, 0.2)) - b;
  if (uGroundMost <= 0.0 || d <= 0.0) return lit;
  float room = max(uGroundMost - b, 0.0);
  return mix(base, lit, room / (d + room));
}
void main() {
  vec3 dir = normalize(vPos - ST_CENTRE);
  vec2 g = vG;
  float t = uCvTime;
  float e;
  vec2 ge;
  vec2 rel;
  vec3 own;
  vec2 petal;
  float dome = cvDome(g, t, e, ge, rel, own, petal);
  vec4 spot = cvSpot(g);
  float L = uCvCell.x;
  float foot = max(length(dFdx(g)), length(dFdy(g)));
  float fine = 1.0 - smoothstep(uCvFar.x * L, uCvFar.y * L, foot);
  // slope of the relief in the chart, then as a normal on the ball
  float r2 = dot(rel, rel);
  float r = sqrt(r2);
  float old = smoothstep(0.5, 1.0, own.x);
  float tall = uCvDome.x * (0.6 + 0.8 * own.y) * mix(0.55, 1.0, own.z);
  float lane = cvLane(e);
  vec2 slope = ge * (step(1e-6, e) * (1.0 - lane) / uCvDome.y * (tall + uCvPetal.x * (petal.x - 0.4)));
  slope += (rel / L) * (2.0 * uCvPetalMore.w * old * exp(-r2 / 0.02) / 0.02 - 2.0 * uCvDome.z * own.z * exp(-r2 / (uCvDome.w * uCvDome.w)) / (uCvDome.w * uCvDome.w));
  float pe = 0.012;
  slope += vec2(cvPetal(rel + vec2(pe, 0.0), own.y, t).x - petal.x, cvPetal(rel + vec2(0.0, pe), own.y, t).x - petal.x) * (uCvPetal.x * lane / (pe * L));
  for (int k = 0; k < (spot.x > 0.0 ? 1 : 0); k++) {
    float eps = 0.003;
    vec4 sx = cvSpot(g + vec2(eps, 0.0));
    vec4 sy = cvSpot(g + vec2(0.0, eps));
    float f0 = spot.x * (spot.y - dome);
    slope = slope * (1.0 - spot.x) + vec2(sx.x * (sx.y - dome) - f0, sy.x * (sy.y - dome) - f0) / eps;
  }
  slope *= uCvMesh.z;
  float ringLen = length(g);
  vec2 rhat = ringLen > 1e-5 ? g / ringLen : vec2(1.0, 0.0);
  float alpha = ringLen / ST_RADIUS;
  vec3 flatR = ST_RIGHT * rhat.x + ST_FWD * rhat.y;
  vec3 eR = ST_DOWN * sin(alpha) + flatR * cos(alpha);
  vec3 eA = -ST_RIGHT * rhat.y + ST_FWD * rhat.x;
  vec3 normal = normalize(dir - eR * dot(slope, rhat) - eA * dot(slope, vec2(-rhat.y, rhat.x)));
  vec3 toEye = normalize(uCam - vPos);
  float mu = clamp(dot(normal, toEye), 0.0, 1.0);
  float muFlat = clamp(dot(dir, toEye), 0.0, 1.0);

  // heat of the cells: dark lanes, a bright middle while the cell is young, a dark dip when it is old
  float body = 1.0 - exp(-e / uCvHeat.x);
  float young = 1.0 - smoothstep(0.0, 0.45, own.x);
  float top = uCvTone.y * (1.0 - uCvTone.z + 2.0 * uCvTone.z * own.y) * (1.0 + uCvHeat.z * young - uCvHeat.w * old);
  top *= 1.0 + uCvTone.w * exp(-r2 / (uCvHeat.y * uCvHeat.y)) * (1.0 - 2.2 * old);
  top *= 1.0 + (uCvGrain.x * 2.0 * (petal.x - 0.4) + uCvThread.w * (petal.y - 0.35)) * fine;
  top *= 1.0 + uCvGrain.w * (vnoise(vec3(g / L * uCvGrain.y, t * uCvGrain.z + own.y * 5.0)) + 0.6 * vnoise(vec3(g / L * uCvGrain.y * 3.7 + 9.1, t * uCvGrain.z * 1.6 + own.y * 3.0)) - 0.8) * fine;
  float lum = uCvTone.x + (top - uCvTone.x) * body;
  lum = mix(uCvFar.z, lum, mix(uCvFar.w, 1.0, fine));

  // the sunspot: fibres with grains that run toward the umbra, the dark floor
  float rs = spot.z;
  vec2 su = normalize(g - uCvSpot.xy + vec2(1e-6, 0.0));
  float run = vnoise(vec3(su * uCvFibre.x * 1.7 + 1.7, rs * uCvFibreLook.y + t * uCvFibreLook.z));
  float lip = 1.0 + uCvUmbra.w * (spot.w - 0.4);
  float head = exp(-pow((rs - lip) / uCvUmbra.y, 2.0));
  float pen = uCvUmbra.z * (uCvFibreLook.x + (1.0 - uCvFibreLook.x) * smoothstep(0.15, uCvFibreLook.w, spot.w)) * (0.55 + 0.9 * run) * (1.0 + head) * mix(1.0, 0.8, smoothstep(1.0, 2.2, rs));
  float floorL = uCvUmbra.x * (0.6 + 0.8 * vnoise(vec3(g * 22.0, t * 0.15)));
  lum = mix(lum, mix(floorL, pen, smoothstep(lip * 0.94, lip * 1.08, rs)), spot.x);

  // light leaves the hot gas along its own normal: a face turned to the eye is brighter than one turned away
  float limb = (1.0 - uCvShade.x + uCvShade.x * mu) / (1.0 - uCvShade.x + uCvShade.x * muFlat);
  lum *= mix(1.0, clamp(limb, uCvShade.y, uCvShade.z), fine);
  float rim = exp(-pow((e - uCvRim.y) / uCvRim.z, 2.0)) * smoothstep(1.0, uCvRim.w, limb) * (1.0 - spot.x);
  lum += (uCvRim.x * rim + uCvShade.w * body * pow(mu, 6.0) * (1.0 - spot.x)) * fine;

  vec3 shown = texture(uRamp, vec2(clamp(lum, 0.0, 1.0), 0.5)).rgb;
  vec3 col = inverseFilmic(grade(shown, 0.0));
  // a thin glowing layer over the ground: the longer the way through it, the more of it
  float way = 1.0 / max(muFlat, 0.02);
  float veil = 1.0 - exp(-uCvVeil.x * (way - 1.0));
  col = mix(col, inverseFilmic(grade(uCvVeilTint, 0.0)) * uCvVeil.y, clamp(veil, 0.0, uCvVeil.z));

  vec3 here = vPos;
  vec2 gb = stImage(here);
  gb = vec2((gb.x - uBox.x) / (uBox.z - uBox.x), 1.0 - (gb.y - uBox.y) / (uBox.w - uBox.y));
  for (int k = 0; k < ((here.z < -0.5 && gb.x > 0.0 && gb.x < 1.0 && gb.y > 0.0 && gb.y < 1.0) ? 1 : 0); k++) {
    float landed = uLandOn * exp(-dot(here - uLand.xyz, here - uLand.xyz) * uLand.w) + uKickOn * exp(-dot(here - uKick.xyz, here - uKick.xyz) * uKick.w);
    vec3 glowMap = textureLod(uGlow, gb, 0.0).rgb;
    col = thrown(col * (1.0 + glowMap * uGlowPlain), col * (1.0 + glowMap * (uGlowBeat * (1.0 + landed))));
    col = thrown(col, col + uLandVeil * landed);
  }
  for (int k = 0; k < (uFlashOn.x + uFlashOn.y > 0.0 ? 1 : 0); k++) {
    float pool = exp(-dot(here - uFlash.xyz, here - uFlash.xyz) * uFlash.w);
    col = thrown(col, col * (1.0 + uFlashOn.x * pool) + uLandVeil * (uFlashOn.y * pool));
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  outColor = diagOut(vec4(col, 1.0), 1.0, 1.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(vView));
}`

const srgbToLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))

function rampTexture(): THREE.DataTexture {
  const stops = data.ramp.stops as number[][]
  const levels = data.ramp.levels as number[]
  const n = 256
  const px = new Float32Array(n * 4)
  const lo = stops[0]!
  const hi = data.tone.white as number[]
  for (let i = 0; i < n; i++) {
    const l = i / (n - 1)
    let c: number[]
    if (l <= levels[0]!) c = lo.map((v) => (v * l) / levels[0]!)
    else if (l >= levels[levels.length - 1]!) {
      const k = (l - levels[levels.length - 1]!) / (1 - levels[levels.length - 1]!)
      c = stops[stops.length - 1]!.map((v, j) => v + (hi[j]! - v) * k)
    } else {
      let j = 0
      while (levels[j + 1]! < l) j++
      const k = (l - levels[j]!) / (levels[j + 1]! - levels[j]!)
      c = stops[j]!.map((v, m) => v + (stops[j + 1]![m]! - v) * k)
    }
    px[i * 4] = srgbToLinear(c[0]!)
    px[i * 4 + 1] = srgbToLinear(c[1]!)
    px[i * 4 + 2] = srgbToLinear(c[2]!)
    px[i * 4 + 3] = 1
  }
  const t = new THREE.DataTexture(px, n, 1, THREE.RGBAFormat, THREE.FloatType)
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.needsUpdate = true
  return t
}

type Shared = Record<string, THREE.IUniform>

export class Surface {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly ramp: THREE.DataTexture

  /** shared: the uniforms of the lights that the opening throws on the ground, kept by the old ground. */
  constructor(shared: Shared) {
    const c = data.cells
    const s = data.spot
    const m = data.mesh
    const l = data.light
    const spot = stage.onGround(stage.spot[0], stage.spot[1])
    const at = chart(spot)
    const edge = stage.onGround(stage.spot[0] + stage.umbra[0], stage.spot[1])
    const umbra = edge.distanceTo(spot) * s.umbra
    this.ramp = rampTexture()
    const keep = ['uGrade', 'uGlow', 'uBox', 'uLand', 'uKick', 'uFlash', 'uGlowBeat', 'uGlowPlain', 'uLandOn', 'uKickOn', 'uFlashOn', 'uLandVeil', 'uGroundMost', 'uGlowReach', 'uCam', 'uGain', 'uVignette', 'uAspect']
    const uniforms: Shared = {}
    for (const name of keep) uniforms[name] = shared[name]!
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...uniforms,
        uDiag: diagUniform,
        uRamp: { value: this.ramp },
        uCvTime: { value: 0 },
        uCvCell: { value: new THREE.Vector4(c.lattice, c.jitter, c.yield, c.apart) },
        uCvLife: { value: new THREE.Vector4(c.life[0]!, c.life[1]!, c.parts, c.ripe) },
        uCvGrow: { value: new THREE.Vector4(c.grow[0]!, c.grow[1]!, c.grow[2]!, c.empty) },
        uCvLane: { value: new THREE.Vector4(c.dome.sink, c.thread.off, c.laneIn, c.round) },
        uCvDome: { value: new THREE.Vector4(c.dome.height, c.dome.shoulder, c.dome.bulge, c.dome.bulgeWide) },
        uCvWarp: { value: new THREE.Vector4(c.warp.amount, c.warp.scale, c.warp.rate, c.wander) },
        uCvSpot: { value: new THREE.Vector4(at[0], at[1], umbra, umbra * s.penumbra) },
        uCvPit: { value: new THREE.Vector4(s.drop[0]!, s.drop[1]!, s.wall[0]!, s.wall[1]!) },
        uCvFibre: { value: new THREE.Vector4(s.fibres.count, s.fibres.height, s.fibres.along, s.ragged) },
        uCvMesh: { value: new THREE.Vector4(m.near, Math.log(1 + (THREE.MathUtils.degToRad(m.capDeg) * stage.radius) / m.near), 1, 0) },
        uCvHeat: { value: new THREE.Vector4(l.lane, l.middleWide, l.young, l.old) },
        uCvTone: { value: new THREE.Vector4(l.dark, l.top, l.spread, l.middle) },
        uCvShade: { value: new THREE.Vector4(l.limb, l.shade[0]!, l.shade[1]!, l.glint) },
        uCvGrain: { value: new THREE.Vector4(l.petal, l.boil.scale, l.boil.rate, l.boil.amount) },
        uCvPetal: { value: new THREE.Vector4(c.lumps.height, c.lumps.scale[0]!, c.lumps.turn[0]!, c.lumps.speed[0]!) },
        uCvThread: { value: new THREE.Vector4(c.thread.round, c.thread.out, c.thread.speed, l.thread) },
        uCvWarpMore: { value: new THREE.Vector4(c.warp.fine[0]!, c.warp.fine[1]!, c.warp.fine[2]!, 0) },
        uCvGap: { value: new THREE.Vector4(c.gap.width, c.gap.scale, c.gap.vary, c.gap.rate) },
        uCvPetalMore: { value: new THREE.Vector4(c.lumps.scale[1]!, c.lumps.turn[1]!, c.lumps.speed[1]!, c.dome.dimple) },
        uCvRim: { value: new THREE.Vector4(l.rim.amount, l.rim.at, l.rim.wide, l.rim.facing) },
        uCvUmbra: { value: new THREE.Vector4(s.floor, s.fibres.head, s.fibres.level, s.fibres.edge) },
        uCvFibreLook: { value: new THREE.Vector4(s.fibres.gap, s.fibres.grains, s.fibres.speed, s.fibres.cut) },
        uCvVeil: { value: new THREE.Vector4(l.veil.amount, l.veil.level, l.veil.most, 0) },
        uCvVeilTint: { value: new THREE.Vector3().fromArray((l.veil.tint as number[]).map(srgbToLinear)) },
        uCvFar: { value: new THREE.Vector4(l.far.from, l.far.to, l.far.level, l.far.keep) },
      },
    })
    const rings = m.rings
    const sectors = m.sectors
    const positions = new Float32Array((rings + 1) * sectors * 3)
    for (let i = 0; i <= rings; i++) {
      for (let j = 0; j < sectors; j++) {
        const k = (i * sectors + j) * 3
        positions[k] = i / rings
        positions[k + 1] = (j / sectors) * Math.PI * 2
        positions[k + 2] = 0
      }
    }
    const index = new Uint32Array(rings * sectors * 6)
    let n = 0
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sectors; j++) {
        const a = i * sectors + j
        const b = i * sectors + ((j + 1) % sectors)
        const cc = a + sectors
        const d = b + sectors
        index[n++] = a
        index[n++] = cc
        index[n++] = b
        index[n++] = b
        index[n++] = cc
        index[n++] = d
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    this.material.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
  }

  update(time: number): void {
    this.material.uniforms.uCvTime!.value = time
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.ramp.dispose()
  }
}
