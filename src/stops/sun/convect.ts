import * as THREE from 'three'
import { DIAG_GLSL, diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { NOISE_GLSL } from '../../terrain/relief'
import { GRADE_GLSL } from './grade'
import { STAGE_GLSL, stage } from './stage'
import data from './convect.json'
import { formatUniform } from './format'

/**
 * The close ground of the Sun as a convecting surface made by functions of a ground point and of time. No picture
 * is read for it and nothing is carried from frame to frame.
 *
 * Cells are the cells of a weighted diagram of seeds. Every lattice square holds two seeds whose lives run half a
 * life apart. A seed is born at nil weight (its cell is empty then), grows, may part into two halves with a lane
 * that grows in from the rim, sinks back to nil weight and is swallowed by its neighbours; the next life starts at
 * another place.
 *
 * The ground is a slab of glowing gas and no surface. The mesh is only a smooth lid over the slab. Once a sample
 * the cell diagram is drawn into a buffer in the picture's own projection: the heat of the gas at every place,
 * the height of its top over the ball (domes over sunken lanes, the funnel of the sunspot) and two fields of
 * threads. For every pixel the eye's ray is then marched through the slab and gathers light and loses sight by
 * what the buffer holds: dense hot gas inside a cell, hotter the deeper, threads of denser brighter gas at two
 * depths, cooler gas in the lanes, thin glowing air over the tops. A place is bright because it is hot and for no
 * other reason: there is no direction of light in it, no gleam and no shadow. Near cells hide far ones because
 * the look is used up in them, and a long look through the air melts the far cells into a bright band.
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
uniform vec4 uCvGloss;
uniform vec4 uCvWarp;
uniform vec4 uCvSpot;
uniform vec4 uCvPit;
uniform vec4 uCvFibre;
uniform vec4 uCvPetal;
uniform vec4 uCvPetalMore;
uniform vec4 uCvThread;
uniform vec4 uCvWarpMore;
uniform vec4 uCvGap;
uniform vec4 uCvBend;
uniform vec4 uCvAboveMore;
uniform vec4 uCvSwallow;
uniform float uFormat;
uniform vec4 uCvLine;
uniform vec4 uCvPatch;
uniform vec4 uCvTight;
uniform vec4 uCvCurl;
uniform vec4 uCvSpotMore;
uniform vec4 uCvStream;
uniform float uCvTime;
vec3 cvH3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
// What the last look at the diagram leaves for the threads of the lanes: the distances to the three nearest lanes
// of the cell (lattice units, cvNear.x the least) and the ways up from the two nearest (unit length).
// cvFan: the way up from the lane net by a softer measure than e (uCvLine.w to a lattice unit), not of unit
// length: it turns from one lane's way up to the next over a span, not at a line.
vec3 cvNear;
vec2 cvUp1;
vec2 cvUp2;
vec2 cvFan;
// The diagram of the cells at q (lattice units) and time t (seconds). wrap: the lattice repeats after so many
// squares along x (0: it does not repeat).
// e: distance to the nearest lane and ge: its gradient (lattice units), rel: q minus the cell's own middle,
// own: x the age of the cell's life from 0 to 1, y a number of its own, z its weight.
void cvDiagram(vec2 q, float t, float wrap, out float e, out vec2 ge, out vec2 rel, out vec3 own) {
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
      vec2 hid = vec2(wrap > 0.0 ? mod(id.x, wrap) : id.x, id.y);
      vec3 hc = cvH3(vec3(hid, 3.1));
      float period = mix(uCvLife.x, uCvLife.y, hc.y);
      for (int s = 0; s < 2; s++) {
        float life = t / period + hc.x + 0.5 * float(s);
        float nth = floor(life);
        float x = life - nth;
        vec3 h1 = cvH3(vec3(hid, nth * 2.0 + float(s) + 11.7));
        vec3 h2 = cvH3(vec3(hid.yx + 37.2, nth * 2.0 + float(s) + 5.3));
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
        // cells are of many sizes: each has a share of its own in the diagram for the whole of its life
        // (a cell is emptied and filled over a span of seconds, not over a share of its life: a short life must
        // not close in a frame or two. The share falls to nil with no slope where the cell is whole)
        float o = uCvWarpMore.w * (fract(h1.x * 13.7 + h1.y * 5.3) - 0.5) + uCvCell.z * (pow(1.0 - grown, uCvGrow.z) + pow(1.0 - left, uCvGrow.z)) + uCvGrow.w * (pow(1.0 - clamp(x * period / uCvSwallow.x, 0.0, 1.0), uCvSwallow.y) + pow(1.0 - clamp((1.0 - x) * period / uCvSwallow.x, 0.0, 1.0), uCvSwallow.y));
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
  vec3 m = vec3(1e9);
  vec2 u1 = vec2(1.0, 0.0);
  vec2 u2 = vec2(0.0, 1.0);
  vec2 facc = vec2(0.0);
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
    // (a cell that has not parted yet has its two halves in one place: that is one lane, not two)
    if (i - (i / 2) * 2 == 1 && all(equal(sp[i], sp[i - 1]))) continue;
    facc += exp(-uCvLine.w * min(ej, 4.0)) * gj;
    if (ej < m.x) {
      m = vec3(ej, m.x, m.y);
      u2 = u1;
      u1 = gj;
    } else if (ej < m.y) {
      m = vec3(m.x, ej, m.y);
      u2 = gj;
    } else if (ej < m.z) {
      m.z = ej;
    }
  }
  cvNear = m;
  cvUp1 = u1;
  cvUp2 = u2;
  cvFan = facc;
  e = max(-log(max(acc, 1e-30)) / sharp, 0.0);
  ge = gacc / max(acc, 1e-30);
  own = si[bi];
  rel = q - s1 - uCvLane.y * vec2(cos(own.y * 40.0), sin(own.y * 40.0)) * own.z;
}
// The chart of the ground's cells: lattice units, and it wanders a little so no lane is straight.
float cvTight(vec2 p) {
  // 1 near the place, the distance over uCvTight.x to the power uCvTight.y far from it, with no edge between
  return pow(1.0 + pow(length(p) / uCvTight.x, uCvTight.z), uCvTight.y / uCvTight.z);
}
vec2 cvChart(vec2 p, float t) {
  // away from the place the cells are smaller: the chart is drawn tighter with the distance on the ground
  vec2 q = p * cvTight(p) / uCvCell.x;
  q += uCvWarp.x * (vec2(vnoise(vec3(q * uCvWarp.y, t * uCvWarp.z)), vnoise(vec3(q.yx * uCvWarp.y + 31.7, t * uCvWarp.z + 7.3))) - 0.5);
  q += uCvWarpMore.x * (vec2(vnoise(vec3(q * uCvWarpMore.y + 13.1, t * uCvWarpMore.z)), vnoise(vec3(q.yx * uCvWarpMore.y + 57.9, t * uCvWarpMore.z + 3.1))) - 0.5);
  return q;
}
// The cells at ground point p (stage units) and time t (seconds): the diagram in a chart that wanders a little.
// e: distance to the nearest lane (stage units), ge: its gradient, rel: p minus the cell's own middle in lattice
// units, own: as in the diagram.
void cvCells(vec2 p, float t, out float e, out vec2 ge, out vec2 rel, out vec3 own) {
  float L = uCvCell.x;
  cvDiagram(cvChart(p, t), t, 0.0, e, ge, rel, own);
  float gap = uCvGap.x * (1.0 - uCvGap.z + 2.0 * uCvGap.z * vnoise(vec3(p * uCvGap.y, 1.7 + t * 0.05)));
  e = max(e * L - gap, 0.0);
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
float cvLumps(vec2 rel, float key, float t) {
  float r = length(rel);
  vec2 u = r > 1e-5 ? rel / r : vec2(1.0, 0.0);
  float a1 = 2.0 * cvCarried(rel, r, u, key, t, uCvPetal.y, uCvPetal.z, uCvPetal.w) - 1.0;
  float a2 = 2.0 * cvCarried(rel, r, u, key + 0.37, t, uCvPetalMore.x, uCvPetalMore.y, uCvPetalMore.z) - 1.0;
  float l1 = min(sqrt(a1 * a1 + uCvGap.w), 1.0);
  float l2 = min(sqrt(a2 * a2 + uCvGap.w), 1.0);
  return 0.65 * l1 * (2.0 - l1) + 0.35 * l2 * (2.0 - l2);
}
// Broad areas of hotter and cooler gas inside a cell, carried outward by its flow (0 to 1, 0.5 in the mean).
float cvPatch(vec2 rel, float key, float t) {
  float r = length(rel);
  vec2 u = r > 1e-5 ? rel / r : vec2(1.0, 0.0);
  return cvCarried(rel, r, u, key + 0.71, t, uCvPatch.w, uCvPetal.z, uCvPetal.w);
}
vec2 cvPetal(vec2 rel, float key, float t) {
  // the flow lines are no spokes: the chart they are drawn in is bent by a slow field of the cell's own, so they
  // curl and branch on their way out and meet in no point
  vec2 bent = rel + uCvCurl.x * (vec2(vnoise(vec3(rel * uCvCurl.y, key * 13.0 + t * uCvCurl.z)), vnoise(vec3(rel.yx * uCvCurl.y + 7.7, key * 5.0 - t * uCvCurl.z))) - 0.5);
  float r = length(bent);
  vec2 u = r > 1e-5 ? bent / r : vec2(1.0, 0.0);
  float n3 = vnoise(vec3(u * uCvThread.x, r * uCvThread.y - t * uCvThread.z) + vec3(key * 41.0, 9.0, 0.0));
  // the threads stand in locks: a few broad strands of many fine ones, with dark gaps between the locks
  float n4 = vnoise(vec3(u * uCvThread.x * 0.4 + 5.7, r * uCvThread.y * 0.5 - t * uCvThread.z * 0.7) + vec3(key * 23.0, 3.0, 0.0));
  // (uCvCurl.w: how dark the gaps between the locks are; uCvTight.w: how thin a thread is against the dark
  // beside it)
  float thread = pow(1.0 - abs(2.0 * n3 - 1.0), uCvTight.w) * mix(1.0 - uCvCurl.w, 1.0, smoothstep(0.2, 0.7, n4)) * 1.35;
  float open = smoothstep(0.02, 0.14, r);
  return vec2(cvLumps(rel, key, t), mix(0.35, thread * thread, open));
}
// The share of the way from the cell's middle (0) to its lane (1) at a place r lattice units from the middle and e
// stage units from the lane. It is the same for a small cell and a wide one, so every cell is a whole bulb.
float cvWay(float r, float e) {
  return r / (r + e / uCvCell.x + 1e-5);
}
// Height of the cells over the ball at p (stage units), with the parts the colour needs.
float cvDome(vec2 p, float t, out float e, out vec2 ge, out vec2 rel, out vec3 own, out vec2 petal) {
  cvCells(p, t, e, ge, rel, own);
  float r2 = dot(rel, rel);
  float r = sqrt(r2);
  float way = cvWay(r, e);
  // a bulb of gas: round over the middle, falling fast where it meets the lane (the edge power below 1 does
  // that); a wide cell stands taller than a small one
  float cap = pow(max(1.0 - pow(way, uCvDome.w), 0.0), uCvGloss.w);
  float size = clamp((r + e / uCvCell.x) / uCvDome.y, 0.35, 1.5);
  float tall = uCvDome.z * size * (0.7 + 0.6 * own.y) * mix(0.5, 1.0, own.z) + uCvDome.x;
  petal = cvPetal(rel, own.y, t);
  float old = smoothstep(0.5, 1.0, own.x);
  // a smaller cell stands lower by the same share
  return ((tall + uCvPetal.x * (petal.x - 0.4)) * cap - uCvPetalMore.w * old * exp(-r2 / 0.02) * cap - uCvDome.z * uCvLane.x) / cvTight(p);
}
// The sunspot at ground point p. Returned: x how much of the place is the spot (1 inside the penumbra), y the
// height of its funnel with the fibres on it (stage units), z the distance from its middle over the umbra's radius,
// w the height of the fibre's body there from 0 (the dark between fibres) to 1 (its crest).
// fibre: x the share of the way from the fibre's middle to its edge, y how far the place is past the fibre's own
// end over the umbra (0 at the end, 1 well outside), z a number of the fibre's own, w its age from 0 to 1.
// The fibres are cells of the same kind as the ground's, in a chart of angle and distance round the spot: each is
// long toward the spot's middle, is born and swallowed like a cell, and the whole chart streams toward the umbra.
vec4 cvSpot(vec2 p, float t, out vec4 fibre) {
  vec2 d = p - uCvSpot.xy;
  float r = length(d);
  vec2 u = r > 1e-5 ? d / r : vec2(1.0, 0.0);
  float rs = r / uCvSpot.z;
  float lobes = vnoise(vec3(u * 1.3 + 4.7, 0.5)) + 0.5 * vnoise(vec3(u * 3.1 + 1.9, 2.5)) - 0.75;
  float outer = uCvSpot.w * (1.0 + uCvFibre.w * lobes);
  float inside = 1.0 - smoothstep(outer * 0.8, outer * 1.04, r);
  fibre = vec4(1.0, 0.0, 0.5, 0.5);
  if (inside <= 0.0) return vec4(0.0, 0.0, rs, 0.0);
  float away = log(max(rs, 0.05));
  vec2 q = vec2(atan(d.y, d.x) * uCvBend.w / 6.2831853, away * uCvFibre.z + t * uCvStream.x);
  // no fibre is straight: the chart sways a little along the fibres' length
  q.x += uCvBend.x * (vnoise(vec3(u * uCvBend.z + 1.1, away * uCvBend.y - t * uCvAboveMore.w)) - 0.5);
  q.x += uCvSpotMore.z * away;
  float e;
  vec2 ge;
  vec2 rel;
  vec3 own;
  cvDiagram(q, t, uCvBend.w, e, ge, rel, own);
  // every fibre is as long as it likes: its outer end lies at a place of its own, so the spot has no rim
  float way = cvWay(length(rel), e * uCvCell.x);
  // within the shortest reach all is spot; beyond it each fibre goes on alone as a tongue that narrows to its end
  float reach = outer * (1.0 - uCvSpotMore.x * fract(own.y * 7.31 + 0.37));
  float least = outer * (1.0 - uCvSpotMore.x);
  float narrow = 1.0 - smoothstep(reach * 0.7, reach * 1.02, r);
  float tongue = narrow * (1.0 - smoothstep(0.9 * narrow, 0.9 * narrow + 0.1, way));
  inside = max(1.0 - smoothstep(least * 0.8, least, r), tongue);
  if (inside <= 0.0) return vec4(0.0, 0.0, rs, 0.0);
  float umbra = 1.0 + 0.4 * uCvFibre.w * lobes;
  // every fibre ends over the umbra at a place of its own, with a round head
  float past = clamp((rs - umbra * (1.0 + uCvStream.y * (own.y - 0.5))) / uCvStream.z, 0.0, 1.0);
  float body = (1.0 - pow(way, uCvStream.w)) * sqrt(past) * mix(0.5, 1.0, own.z);
  fibre = vec4(way, past, own.y, own.x);
  float fall = 1.0 - smoothstep(umbra * uCvSpot.z, outer, r);
  float pit = 1.0 - smoothstep(umbra * uCvSpot.z * uCvPit.z, umbra * uCvSpot.z * uCvPit.w, r);
  // (the funnel alone: the fibres' own height comes on top of it, see cvFibreTop)
  float h = -uCvPit.x * fall - uCvPit.y * pit;
  return vec4(inside, h, rs, body);
}
// The height of a fibre's body over the spot's funnel (stage units), from what cvSpot gave.
float cvFibreTop(vec4 spot, vec4 fibre) {
  return uCvFibre.y * (0.6 + 0.8 * fibre.z) * spot.w;
}
// Height of the ground over the ball at p (stage units).
float cvHeight(vec2 p, float t) {
  float e;
  vec2 ge;
  vec2 rel;
  vec3 own;
  vec2 petal;
  float dome = cvDome(p, t, e, ge, rel, own, petal);
  vec4 fibre;
  vec4 spot = cvSpot(p, t, fibre);
  // the mesh carries the spot's funnel and pit. A fibre is narrower than the mesh's rings are apart, so its own
  // height is carried only by the share uCvSpotMore.w (a mesh that cannot hold it draws seams along its rings); the
  // rest of the fibres' relief is in the light alone
  return mix(dome, spot.y + uCvSpotMore.w * cvFibreTop(spot, fibre), spot.x);
}`

const VERT = /* glsl */ `
precision highp float;
uniform vec4 uCvMesh;
uniform vec4 uCvSlab;
out vec2 vG;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
${STAGE_GLSL}
void main() {
  // the mesh lies still over the ground: rings round the point under the stage's camera. It is the smooth lid of
  // the slab of gas, uCvSlab.x over the ball as far as the gas is marched; beyond, it is the ball itself
  float arc = position.x;
  vec2 g = arc * vec2(cos(position.y), sin(position.y));
  float alpha = arc / ST_RADIUS;
  vec3 dir = -ST_DOWN * cos(alpha) + sin(alpha) * (ST_RIGHT * cos(position.y) + ST_FWD * sin(position.y));
  float real = 1.0 - smoothstep(uCvMesh.x, uCvMesh.y, arc);
  vec3 p = ST_CENTRE + dir * (ST_RADIUS + uCvSlab.x * real);
  vG = g;
  vPos = p;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

/** The picture of one sample: the eye's ray is marched through the slab of gas that the bake describes. */
const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uCvEye;
uniform sampler2D uRamp;
uniform sampler2D uGlow;
uniform sampler2D uCvBaked;
uniform vec4 uBox, uLand, uKick, uFlash;
uniform float uGlowBeat, uGlowPlain, uLandOn, uKickOn;
uniform vec2 uFlashOn;
uniform vec3 uLandVeil;
uniform float uGroundMost;
uniform vec2 uGlowReach;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec4 uCvFall;
uniform vec4 uCvKnee;
uniform vec4 uCvLimbTint;
uniform vec4 uCvVeil;
uniform vec3 uCvVeilTint;
uniform vec4 uCvMesh;
uniform float uCvKeep;
uniform mat4 uCvBake;
uniform mat4 uCvClip;
uniform vec4 uCvSlab;
uniform vec4 uCvSlabMore;
uniform vec4 uCvCool;
uniform vec4 uCvCoolMore;
uniform vec4 uCvAir;
uniform vec4 uCvStrand;
in vec2 vG;
in vec3 vPos;
in vec3 vView;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${STAGE_GLSL}
${GRADE_GLSL}
vec3 thrown(vec3 base, vec3 lit) {
  float b = dot(base, vec3(0.3, 0.5, 0.2));
  float d = dot(lit, vec3(0.3, 0.5, 0.2)) - b;
  if (uGroundMost <= 0.0 || d <= 0.0) return lit;
  float room = max(uGroundMost - b, 0.0);
  return mix(base, lit, room / (d + room));
}
// What the bake holds for the ground straight under a point p: x the heat of the gas there, y the height of its
// top over the ball, z and w two fields of threads.
vec4 cvRead(vec3 p) {
  vec4 c = uCvBake * vec4(ST_CENTRE + normalize(p - ST_CENTRE) * ST_RADIUS, 1.0);
  return textureLod(uCvBaked, c.xy / c.w * 0.5 + 0.5, 0.0);
}
// The gas at the height h over a place the bake holds as b. take: the share of the light it takes per unit of the
// way through it. give: the light it gives. Inside a cell the gas is dense and hot, the hotter the deeper under
// its top (the top fades out over uCvSlab.z each way, it has no hard face). Over the tops lies thin air that glows by
// the heat under it and thins out with the height. Between the cells, up to uCvCool.x over the ball, lies cooler
// gas that takes light and gives little. The threads are denser, brighter gas: of the two fields the one and the
// other at two depths under the top, so a look through the gas sees threads of several depths
// (the sunspot's funnel holds none of the cooler gas: it lies between cells alone, where the ground is not far
// under the lanes' own level, uCvCoolMore.w)
void cvGas(vec4 b, float h, out float take, out float give) {
  float d = b.y - h;
  float inside = smoothstep(-uCvSlab.z, uCvSlab.z, d);
  // (a thread is no curtain from the top of the gas to its floor: the one field lies in a thin layer just under
  // the top, the other in a layer uCvStrand.z deeper)
  float lay1 = (d / uCvStrand.z - 0.3) / 0.35;
  float lay2 = (d / uCvStrand.z - 1.3) / 0.35;
  float strand = (b.z - uCvStrand.w) * exp(-lay1 * lay1) + (b.w - uCvStrand.w) * exp(-lay2 * lay2);
  float dense = inside * max(1.0 + uCvStrand.y * strand, 0.15) / uCvSlab.w;
  float air = (1.0 - inside) * exp(min(d, 0.0) / uCvAir.y) / uCvAir.x;
  float cool = (1.0 - inside) * (1.0 - smoothstep(uCvCool.x - uCvCool.y, uCvCool.x + uCvCool.y, h)) * (1.0 - smoothstep(0.0, uCvCoolMore.x, -d)) * smoothstep(uCvCoolMore.w - 0.015, uCvCoolMore.w, b.y) / uCvCool.z;
  float deep = 1.0 - exp(-max(d, 0.0) / uCvSlabMore.z);
  float hot = b.x * mix(uCvSlabMore.y, 1.0, deep) * max(1.0 + uCvStrand.x * strand, 0.0);
  take = dense + air + cool;
  give = (dense * hot + air * b.x * uCvAir.z + cool * uCvCool.w) / max(take, 1e-6);
}
void main() {
  vec3 dir = normalize(vPos - ST_CENTRE);
  vec3 rd = normalize(vPos - uCvEye);
  // the far side of the lid is not drawn: a ray that only grazes the slab is marched from its near side
  if (dot(dir, rd) > 0.0) discard;
  vec3 o = vPos - ST_CENTRE;
  float ro = length(o);
  float bq = dot(o, rd);
  float hTop = ro - ST_RADIUS;
  float real = 1.0 - smoothstep(uCvMesh.x, uCvMesh.y, length(vG));
  float hBot = -uCvSlab.y * real;
  // the lowest the ray comes over the ball: a ray that does not reach the floor of the slab goes on through the
  // air over the limb, as long again as it came
  float hMin = sqrt(max(ro * ro - bq * bq, 0.0)) - ST_RADIUS;
  bool grazes = hMin > hBot;
  float low = grazes ? hMin : hBot;
  // the ray is cut at level heights over the ball (not at equal steps of its own length), so the cuts lie still on
  // the gas whatever the eye does
  int n = int(uCvSlabMore.x);
  float dh = (hTop - low) / float(n);
  float light = 0.0;
  float left = 1.0;
  float sPrev = 0.0;
  float sSeen = -1.0;
  vec4 b = vec4(0.0);
  for (int k = 0; k < n; k++) {
    float hk = hTop - dh * float(k + 1);
    float s = -bq - sqrt(max(bq * bq - (hTop - hk) * (2.0 * ST_RADIUS + hTop + hk), 0.0));
    vec3 p = vPos + rd * (0.5 * (s + sPrev));
    b = cvRead(p);
    float take;
    float give;
    cvGas(b, length(p - ST_CENTRE) - ST_RADIUS, take, give);
    float a = 1.0 - exp(-take * (s - sPrev) * (grazes ? 2.0 : 1.0));
    light += left * a * give;
    left *= 1.0 - a;
    if (sSeen < 0.0 && left < 0.5) sSeen = max(s, 0.0);
    sPrev = s;
  }
  // the sunspot's funnel goes deeper than the slab of the cells: there the march goes on to the funnel's depth
  float pit = 0.0;
  if (!grazes) {
    b = cvRead(vPos + rd * sPrev);
    int m = b.y < hBot - 0.002 ? int(uCvCoolMore.y) : 0;
    float dp = (uCvCoolMore.z + hBot) * real / max(float(m), 1.0);
    for (int k = 0; k < m; k++) {
      float hk = hBot - dp * float(k + 1);
      float s = -bq - sqrt(max(bq * bq - (hTop - hk) * (2.0 * ST_RADIUS + hTop + hk), 0.0));
      vec3 p = vPos + rd * (0.5 * (s + sPrev));
      b = cvRead(p);
      float take;
      float give;
      cvGas(b, length(p - ST_CENTRE) - ST_RADIUS, take, give);
      float a = 1.0 - exp(-take * (s - sPrev));
      light += left * a * give;
      left *= 1.0 - a;
      if (sSeen < 0.0 && left < 0.5) sSeen = max(s, 0.0);
      sPrev = s;
    }
    pit = float(m > 0 ? 1 : 0);
    // under the slab the gas is deep and takes all light: what is left of the look ends in the heat of the place
    b = cvRead(vPos + rd * sPrev);
    light += left * b.x;
    left = 0.0;
    // (far from the place the slab has no thickness and the way through it is nil give or take the last bit of a
    // number: it must not read as a look that was never used up)
    if (sSeen < 0.0) sSeen = max(sPrev, 0.0);
  }
  float seen = 1.0 - left;
  float lum = light / max(seen, 1e-4);
  vec3 toEye = -rd;
  float muFlat = clamp(dot(dir, toEye), 0.0, 1.0);
  // the light falls toward the limb: the flatter the ball itself is seen, the less of the deep hot gas shows
  lum *= 1.0 - uCvFall.x * pow(1.0 - muFlat, uCvFall.y);
  // the brightest light is held under white by a knee (no part of the ground burns out)
  lum = lum > uCvKnee.x ? uCvKnee.x + (lum - uCvKnee.x) / (1.0 + (lum - uCvKnee.x) / uCvKnee.y) : lum;
  vec3 shown = texture(uRamp, vec2(clamp(lum, 0.0, 1.0), 0.5)).rgb;
  // seen flat, toward the limb, the same light is more gold than amber
  shown *= mix(vec3(1.0), uCvLimbTint.rgb, pow(1.0 - muFlat, uCvLimbTint.w));
  // below the ramp's darkest class the lanes and the pit go on toward black
  shown *= 1.0 - uCvFall.z * (1.0 - smoothstep(0.0, uCvFall.w, lum));
  vec3 col = inverseFilmic(grade(shown, 0.0));
  // a thin glowing layer over the ground: the longer the way through it, the more of it
  float through = 1.0 / max(muFlat, 0.02);
  float veil = 1.0 - exp(-uCvVeil.x * max(through - uCvVeil.w, 0.0));
  // (it glows: its light is added to the ground's, so the far cells keep their own dark and bright under it; the
  // spot's pit holds little of it)
  col += inverseFilmic(grade(uCvVeilTint, 0.0)) * (uCvVeil.y * clamp(veil, 0.0, uCvVeil.z) * (1.0 - 0.85 * pit));

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
  // seen from the globe's side the ground gives way to the globe's own face by the eye's height alone
  if (uCvKeep <= 0.0 || (uDiag >= 2 && uCvKeep < 0.5)) discard;
  // what stands behind the gas is hidden where the look has lost half its way through it; a look that leaves the
  // slab over the limb hides nothing
  vec4 at = uCvClip * vec4(vPos + rd * max(sSeen, 0.0), 1.0);
  gl_FragDepth = sSeen < 0.0 ? 1.0 : clamp(0.5 * at.z / at.w + 0.5, 0.0, 1.0);
  // (the light is given already weighed by how much of the look the gas holds: the picture behind keeps the rest)
  float held = seen * uCvKeep;
  outColor = diagOut(vec4(col * held, held), 1.0, 1.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(vView));
}`

const BAKE_VERT = /* glsl */ `
out vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

/** The cell diagram of one sample, drawn once into a buffer in the picture's own projection (a little wider than
 * the picture): for the ground under every pixel the heat of the gas, the height of its top over the ball and two
 * fields of threads. The march of the picture reads it. */
const BAKE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uCvEye;
uniform vec3 uCvRay0;
uniform vec3 uCvRayX;
uniform vec3 uCvRayY;
uniform vec4 uCvHeat;
uniform vec4 uCvTone;
uniform vec4 uCvGrain;
uniform vec4 uCvWell;
uniform vec4 uCvFarMore;
uniform vec4 uCvPoints;
uniform vec4 uCvUmbra;
uniform vec4 uCvFibreLook;
uniform vec4 uCvFar;
uniform vec4 uCvFlat;
uniform vec4 uCvMesh;
uniform vec4 uCvStrand;
uniform vec4 uCvThreadFar;
uniform sampler2D uCvMap;
uniform mat3 uCvToMap;
uniform vec4 uCvWide;
uniform vec4 uCvWideMore;
uniform vec4 uCvWideFar;
uniform vec4 uCvWideBand;
uniform vec4 uCvWideCell;
in vec2 vNdc;
out vec4 outColor;
${STAGE_GLSL}
${NOISE_GLSL}
${CONVECT_GLSL}
void main() {
  // the ground under this place of the picture: where the eye's ray meets the ball
  vec3 rd = normalize(uCvRay0 + vNdc.x * uCvRayX + vNdc.y * uCvRayY);
  vec3 oc = uCvEye - ST_CENTRE;
  float bq = dot(oc, rd);
  float disc = bq * bq - (dot(oc, oc) - ST_RADIUS * ST_RADIUS);
  float met = disc > 0.0 && bq < 0.0 ? 1.0 : 0.0;
  vec3 dir = normalize(oc + rd * (-bq - sqrt(max(disc, 0.0))));
  vec2 lie = vec2(dot(dir, ST_RIGHT), dot(dir, ST_FWD));
  float ring = length(lie);
  vec2 g = ring > 1e-7 ? lie / ring * (atan(ring, -dot(dir, ST_DOWN)) * ST_RADIUS) : vec2(0.0);
  float t = uCvTime;
  float e;
  vec2 ge;
  vec2 rel;
  vec3 own;
  vec2 petal;
  float dome = cvDome(g, t, e, ge, rel, own, petal);
  vec4 fibre;
  vec4 spot = cvSpot(g, t, fibre);
  float L = uCvCell.x;
  // (uCvThreadFar.z: texels of this buffer to a pixel of the picture, each way)
  float footX = length(dFdx(g)) * uCvThreadFar.z;
  float footY = length(dFdy(g)) * uCvThreadFar.z;
  float foot = max(footX, footY);
  // what a pixel covers, in the measure of the cells where it lies (they are smaller far from the place): a cell
  // that a pixel cannot hold is not drawn, the gas there is its mean with a mottle of wider waves, each wave
  // drawn only where a pixel is narrower than it
  // (the root of what a pixel covers both ways: a far cell seen flat is many pixels wide and few deep, and it is
  // drawn while their product holds it)
  // (what fades reads the size in 1080ths of the frame height, not in pixels of the format: uFormat is the
  // format's height over 1080; a texel of this buffer is a pixel of the picture)
  float footM = sqrt(footX * footY) * uFormat;
  float footC = footM * cvTight(g);
  // (the long side of what a pixel covers: toward the limb a cell is many pixels wide and under a pixel deep, one
  // sample a pixel then draws grain, so the cell gives way by that side too, between uCvFlat.x and uCvFlat.y cells
  // a pixel)
  float footL = foot * uFormat * cvTight(g);
  float fine = (1.0 - smoothstep(uCvFar.x * L, uCvFar.y * L, footC)) * (1.0 - smoothstep(uCvFlat.x * L, uCvFlat.y * L, footL)) * met;
  float mottle = 0.0;
  for (int k = 0; k < 5; k++) {
    float lam = L * uCvFarMore.y * exp2(float(k));
    mottle += (1.0 - smoothstep(uCvFarMore.z * lam, uCvFarMore.w * lam, footM)) / (1.0 + float(k)) * (vnoise(vec3(g / lam + 17.3 * float(k), t * 0.05 + 3.1 * float(k))) - 0.5);
  }
  float r2 = dot(rel, rel);
  float r = sqrt(r2);
  float old = smoothstep(0.5, 1.0, own.x);
  float young = 1.0 - smoothstep(0.0, 0.45, own.x);
  float way = cvWay(r, e);
  // the heat of the gas. A place is bright because it is hot and for no other reason: the gas is hottest where it
  // wells up in the middle of a cell, cools on its way out and is coolest in the lane. A young cell is hotter, an
  // old one cooler and its middle the first part to cool. The line where the gas has cooled is no ring: the flow
  // carries tongues of the hot gas outward (uCvWell: the power of the way out, the power of the fall, how far a
  // tongue reaches)
  float top = uCvTone.y * (1.0 - uCvTone.z + 2.0 * uCvTone.z * own.y) * (1.0 + uCvHeat.z * young - uCvHeat.w * old);
  top *= 1.0 + uCvTone.w * exp(-r2 / (uCvHeat.y * uCvHeat.y)) * (1.0 - 2.2 * old);
  float out1 = clamp(way + uCvWell.z * (2.0 * cvPatch(rel, own.y, t) - 1.0) * 4.0 * way * (1.0 - way), 0.0, 1.0);
  float well = pow(max(1.0 - pow(out1, uCvWell.x), 0.0), uCvWell.y);
  // (it boils: the heat of a place wavers with a fine field that the time carries)
  top *= 1.0 + uCvGrain.w * (vnoise(vec3(g / L * uCvGrain.y, t * uCvGrain.z + own.y * 5.0)) + 0.6 * vnoise(vec3(g / L * uCvGrain.y * 3.7 + 9.1, t * uCvGrain.z * 1.6 + own.y * 3.0)) - 0.8) * fine;
  float lum = uCvTone.x + (top - uCvTone.x) * well;
  // a few bright points stand in the lanes
  lum += uCvPoints.x * (1.0 - smoothstep(0.0, uCvPoints.y, e)) * smoothstep(uCvPoints.z, 1.0, vnoise(vec3(g / L * uCvPoints.w, t * 0.3))) * fine;
  lum = mix(uCvFar.z * (1.0 + uCvFarMore.x * mottle), lum, mix(uCvFar.w, 1.0, fine));
  // the ground is the globe's own ground: the light and dark of the globe's map lies under the cells at the place on
  // the ball where the globe itself shows it. Each cell takes the map's light at its own middle, so the map's
  // pattern is carried by cells that differ from their neighbours and its borders are the cells' own borders on
  // the ground; that part is read by one law at every height, distance and angle. Where a pixel can no longer hold
  // the cells they leave the globe's own pattern behind and not another, and the globe's face that the ground
  // gives way to on the rise is the same picture
  // (the map's light is taken in two parts. The cell's own: the map at the cell's middle over the map's mean
  // round it, uCvWideBand.z texels wide; uCvWideCell is how far the place of the sample is drawn from the point
  // to the middle of its cell (1 the middle; in the sunspot, which has no cells, the point itself), the least and
  // the most it may be, and the power it is read by. The region's: that mean, by uCvWide where a pixel is small
  // on the ground and by uCvWideFar where it holds the map as the globe shows it (the share of the map's light the
  // ground takes, the level that leaves the ground as it is, the power, the most it may add); between uCvWideBand.x
  // and uCvWideBand.y texels of the map to a pixel, in 1080ths of the frame height, the one gives way to the
  // other. Only the region's part, which is wider than any detail of the picture while it changes, is weaker from
  // close by; with both whole the ground reads the map by the far law alone. uCvWideMore.x: the least width of a
  // sample in texels of the map, so the enlarged map is a soft tone and no texel of it shows)
  {
    vec2 gc = g - rel * (L / cvTight(g)) * uCvWideCell.x * (1.0 - spot.x);
    float arcC = max(length(gc), 1e-6);
    float alphaC = arcC / ST_RADIUS;
    vec3 mdC = uCvToMap * (-ST_DOWN * cos(alphaC) + sin(alphaC) * (ST_RIGHT * gc.x + ST_FWD * gc.y) / arcC);
    vec2 muvC = vec2(atan(mdC.x, mdC.z) / 6.283185307179586 + 0.5, asin(clamp(mdC.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
    vec3 md = uCvToMap * dir;
    vec2 muv = vec2(atan(md.x, md.z) / 6.283185307179586 + 0.5, asin(clamp(md.y, -1.0, 1.0)) / 3.141592653589793 + 0.5);
    float mAlt = fract(muv.x + 0.5) - 0.5;
    vec2 mdx = vec2(abs(dFdx(muv.x)) < abs(dFdx(mAlt)) ? dFdx(muv.x) : dFdx(mAlt), dFdx(muv.y)) * uCvThreadFar.z;
    vec2 mdy = vec2(abs(dFdy(muv.x)) < abs(dFdy(mAlt)) ? dFdy(muv.x) : dFdy(mAlt), dFdy(muv.y)) * uCvThreadFar.z;
    float lenX = max(length(mdx * uCvWideMore.yz), 1e-6);
    float lenY = max(length(mdy * uCvWideMore.yz), 1e-6);
    float wideFoot = sqrt(lenX * lenY) * uFormat;
    float cellLum = dot(textureGrad(uCvMap, muvC, mdx * max(1.0, uCvWideMore.x / lenX), mdy * max(1.0, uCvWideMore.x / lenY)).rgb, vec3(0.3, 0.5, 0.2));
    float regionLum = dot(textureGrad(uCvMap, muv, mdx * max(1.0, uCvWideBand.z / lenX), mdy * max(1.0, uCvWideBand.z / lenY)).rgb, vec3(0.3, 0.5, 0.2));
    float cellTone = clamp(pow(cellLum / max(regionLum, 1e-3), uCvWideCell.w), uCvWideCell.y, uCvWideCell.z);
    float nearTone = 1.0 + uCvWide.x * clamp(pow(regionLum / uCvWide.y, uCvWide.z) - 1.0, -1.0, uCvWide.w);
    float farTone = 1.0 + uCvWideFar.x * clamp(pow(regionLum / uCvWideFar.y, uCvWideFar.z) - 1.0, -1.0, uCvWideFar.w);
    lum *= cellTone * mix(nearTone, farTone, smoothstep(uCvWideBand.x, uCvWideBand.y, wideFoot));
  }

  // the sunspot: fibres with bodies, grains that run toward the umbra along them, a bright head where each ends
  // over the dark floor
  float rs = spot.z;
  vec2 su = normalize(g - uCvSpot.xy + vec2(1e-6, 0.0));
  float run = vnoise(vec3(su * uCvFibre.x * 1.7 + 1.7, rs * uCvFibreLook.y + t * uCvFibreLook.z));
  float fine2 = vnoise(vec3(su * uCvFibre.x * 4.3 + 5.1, rs * uCvFibreLook.y * 0.4 + t * uCvFibreLook.z * 0.5));
  float head = exp(-pow((fibre.y - 0.45) / uCvUmbra.y, 2.0));
  float pen = uCvUmbra.z * (uCvFibreLook.x + (1.0 - uCvFibreLook.x) * pow(spot.w, uCvFibreLook.w)) * (0.5 + 0.6 * run + 0.5 * fine2 * fibre.x) * (0.7 + 0.6 * fibre.z) * (1.0 + uCvUmbra.w * head) * mix(1.0, 0.8, smoothstep(1.0, 2.2, rs));
  float floorL = uCvUmbra.x * (0.6 + 0.8 * vnoise(vec3(g * 22.0, t * 0.15)));
  lum = mix(lum, mix(floorL, pen, smoothstep(uCvSpotMore.y, uCvSpotMore.y + 0.25, fibre.y)), spot.x);

  // the height of the gas's top over the ball: the cells' domes, the spot's funnel with its fibres as bodies on it
  float real = 1.0 - smoothstep(uCvMesh.x, uCvMesh.y, length(g));
  float high = mix(dome * fine, spot.y + cvFibreTop(spot, fibre), spot.x) * uCvMesh.z * real;
  // threads: two fields of the cell's own flow lines, each carried outward; a thread is drawn only where a pixel
  // is narrower than it, farther off the threads merge into their mean
  float threads = (1.0 - smoothstep(uCvThreadFar.x, uCvThreadFar.y, footC)) * fine * (1.0 - spot.x);
  float one = mix(uCvStrand.w, petal.y, threads);
  float two = mix(uCvStrand.w, cvPetal(rel, own.y + 0.43, t + 11.0).y, threads);
  outColor = mix(vec4(uCvFar.z, 0.0, uCvStrand.w, uCvStrand.w), vec4(lum, high, one, two), met);
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
  readonly mesh: THREE.Group
  readonly material: THREE.ShaderMaterial
  /** The same ground seen from the globe's side: it is laid over the globe's own face and may be thin. */
  private readonly laid: THREE.ShaderMaterial
  private readonly ramp: THREE.DataTexture
  private readonly pieces: { mesh: THREE.Mesh; mid: THREE.Vector3; wide: number; seen: boolean }[] = []
  private readonly towards = new THREE.Vector3()
  private readonly over: number
  /** The materials every piece has been drawn with once, so that its buffer and its vertex arrays are on the card. */
  private readonly bound = new Set<THREE.Material>()
  private binding = false
  private readonly frustum = new THREE.Frustum()
  private readonly screen = new THREE.Matrix4()
  private readonly ball = new THREE.Sphere()
  /** The buffer the cell diagram of a sample is drawn into, in the picture's own projection, and what draws it. */
  private readonly baked: THREE.WebGLRenderTarget
  private readonly baker: THREE.ShaderMaterial
  private readonly bakeScene = new THREE.Scene()
  private readonly bakeEye = new THREE.Camera()
  private readonly bakeParts: (THREE.BufferGeometry | THREE.Material)[] = []
  private readonly toClip = new THREE.Matrix4()
  private readonly toBake = new THREE.Matrix4()
  private readonly back = new THREE.Matrix4()
  private readonly wider = new THREE.Matrix4()
  private readonly size = new THREE.Vector2()
  private readonly at0 = new THREE.Vector3()
  private readonly atX = new THREE.Vector3()
  private readonly atY = new THREE.Vector3()

  /** shared: the uniforms of the lights that the opening throws on the ground, kept by the old ground. map: the
   * globe's own map, toStage: the turn from the map's axes to the stage's (the globe lays the stage by it). */
  constructor(shared: Shared, map: THREE.Texture, toStage: THREE.Matrix3) {
    const c = data.cells
    const s = data.spot
    const m = data.mesh
    const l = data.light
    const g = data.gas
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
        uDiag: diagUniform, uFormat: formatUniform,
        uRamp: { value: this.ramp },
        uCvTime: { value: 0 },
        uCvCell: { value: new THREE.Vector4(c.lattice, c.jitter, c.yield, c.apart) },
        uCvLife: { value: new THREE.Vector4(c.life[0]!, c.life[1]!, c.parts, c.ripe) },
        uCvGrow: { value: new THREE.Vector4(c.grow[0]!, c.grow[1]!, c.grow[2]!, c.empty) },
        uCvLane: { value: new THREE.Vector4(c.dome.sink, c.thread.off, c.laneIn, c.round) },
        uCvDome: { value: new THREE.Vector4(c.dome.height, c.dome.full, c.dome.bulge, c.dome.power) },
        uCvWarp: { value: new THREE.Vector4(c.warp.amount, c.warp.scale, c.warp.rate, c.wander) },
        uCvSpot: { value: new THREE.Vector4(at[0], at[1], umbra, umbra * s.penumbra) },
        uCvPit: { value: new THREE.Vector4(s.drop[0]!, s.drop[1]!, s.wall[0]!, s.wall[1]!) },
        uCvFibre: { value: new THREE.Vector4(s.fibres.count, s.fibres.height, s.fibres.along, s.ragged) },
        uCvBend: { value: new THREE.Vector4(s.fibres.bend[0]!, s.fibres.bend[1]!, s.fibres.bend[2]!, s.fibres.round) },
        uCvSpotMore: { value: new THREE.Vector4(s.uneven, s.fibres.headFrom, s.fibres.twist, s.fibres.real) },
        uCvStream: { value: new THREE.Vector4(s.fibres.stream, s.fibres.ends, s.fibres.headLong, s.fibres.power) },
        uCvMesh: { value: new THREE.Vector4(m.real[0]!, m.real[1]!, 1, 0) },
        uCvKeep: { value: 1 },
        uCvLine: { value: new THREE.Vector4(0, 0, 0, c.fan) },
        uCvGloss: { value: new THREE.Vector4(0, 0, 0, c.dome.edge) },
        uCvGrain: { value: new THREE.Vector4(0, l.boil.scale, l.boil.rate, l.boil.amount) },
        uCvThread: { value: new THREE.Vector4(c.thread.round, c.thread.out, c.thread.speed, 0) },
        uCvPatch: { value: new THREE.Vector4(0, 0, 0, l.well.scale) },
        uCvAboveMore: { value: new THREE.Vector4(0, 0, 0, s.fibres.sway) },
        uCvThreadFar: { value: new THREE.Vector4(g.strand.far[0]!, g.strand.far[1]!, g.fine, 0) },
        uCvKnee: { value: new THREE.Vector4(l.knee[0]!, l.knee[1]!, 0, 0) },
        uCvSlab: { value: new THREE.Vector4(g.lid, g.floor, g.soft, g.free) },
        uCvSlabMore: { value: new THREE.Vector4(g.steps, g.top, g.deep, 0) },
        uCvCool: { value: new THREE.Vector4(g.cool.fill, g.cool.soft, g.cool.free, g.cool.heat) },
        uCvCoolMore: { value: new THREE.Vector4(g.cool.reach, g.pit.steps, g.pit.depth, -g.floor) },
        uCvAir: { value: new THREE.Vector4(g.air.free, g.air.scale, g.air.glow, 0) },
        uCvStrand: { value: new THREE.Vector4(g.strand.light, g.strand.dense, g.strand.layer, g.strand.mean) },
        uCvBaked: { value: null as THREE.Texture | null },
        uCvBake: { value: new THREE.Matrix4() },
        uCvClip: { value: new THREE.Matrix4() },
        uCvEye: { value: new THREE.Vector3() },
        uCvRay0: { value: new THREE.Vector3() },
        uCvRayX: { value: new THREE.Vector3() },
        uCvRayY: { value: new THREE.Vector3() },
        uCvMap: { value: map },
        uCvToMap: { value: toStage.clone().transpose() },
        uCvWide: { value: new THREE.Vector4(l.wide.amount, l.wide.level, l.wide.power, l.wide.most) },
        uCvWideFar: { value: new THREE.Vector4(l.wide.far.amount, l.wide.far.level, l.wide.far.power, l.wide.far.most) },
        uCvWideBand: { value: new THREE.Vector4(l.wide.band[0]!, l.wide.band[1]!, l.wide.region, 0) },
        uCvWideCell: { value: new THREE.Vector4(l.wide.cell.share, l.wide.cell.least, l.wide.cell.most, l.wide.cell.power) },
        uCvWideMore: { value: new THREE.Vector4(l.wide.texels, (map.image as unknown as { width: number }).width, (map.image as unknown as { height: number }).height, 0) },
        uCvHeat: { value: new THREE.Vector4(0, l.middleWide, l.young, l.old) },
        uCvWell: { value: new THREE.Vector4(l.well.out, l.well.fall, l.well.tongue, 0) },
        uCvTone: { value: new THREE.Vector4(l.dark, l.top, l.spread, l.middle) },
        uCvPetal: { value: new THREE.Vector4(c.lumps.height, c.lumps.scale[0]!, c.lumps.turn[0]!, c.lumps.speed[0]!) },
        uCvWarpMore: { value: new THREE.Vector4(c.warp.fine[0]!, c.warp.fine[1]!, c.warp.fine[2]!, c.sizes) },
        uCvGap: { value: new THREE.Vector4(c.gap.width, c.gap.scale, c.gap.vary, c.lumps.crease) },
        uCvPetalMore: { value: new THREE.Vector4(c.lumps.scale[1]!, c.lumps.turn[1]!, c.lumps.speed[1]!, c.dome.dimple) },
        uCvCurl: { value: new THREE.Vector4(c.thread.curl[0]!, c.thread.curl[1]!, c.thread.curl[2]!, c.thread.locks) },
        uCvPoints: { value: new THREE.Vector4(l.points.amount, l.points.within, l.points.few, l.points.scale) },
        uCvTight: { value: new THREE.Vector4(c.tight.from, c.tight.power, c.tight.knee, c.thread.thin) },
        uCvFarMore: { value: new THREE.Vector4(l.far.mottle, l.far.wave, l.far.band[0]!, l.far.band[1]!) },
        uCvSwallow: { value: new THREE.Vector4(c.swallow[0]!, c.swallow[1]!, 0, 0) },
        uCvLimbTint: { value: new THREE.Vector4(l.limbTint[0]!, l.limbTint[1]!, l.limbTint[2]!, l.limbTint[3]!) },
        uCvFall: { value: new THREE.Vector4(l.fall.amount, l.fall.power, l.deep.amount, l.deep.below) },
        uCvUmbra: { value: new THREE.Vector4(s.floor, s.fibres.head, s.fibres.level, s.fibres.edge) },
        uCvFibreLook: { value: new THREE.Vector4(s.fibres.gap, s.fibres.grains, s.fibres.speed, s.fibres.cut) },
        uCvVeil: { value: new THREE.Vector4(l.veil.amount, l.veil.level, l.veil.most, l.veil.from) },
        uCvVeilTint: { value: new THREE.Vector3().fromArray((l.veil.tint as number[]).map(srgbToLinear)) },
        uCvFar: { value: new THREE.Vector4(l.far.from, l.far.to, l.far.level, l.far.keep) },
        uCvFlat: { value: new THREE.Vector4(l.far.flat[0]!, l.far.flat[1]!, l.far.lane, 0) },
      },
    })
    // Rings round the point under the stage's camera. Their spacing follows what a pixel covers on the ground from the
    // stage's own eye, 1 unit up: the finest step out to m.fineTo, then wider as 1 plus the arc squared up to m.coarse
    // (a few rings to a cell), kept as far as the relief is real; beyond that m.tail rings, each a fixed share wider
    // than the last, out to the cap.
    const arcs = [0]
    while (arcs[arcs.length - 1]! < m.real[1]!) {
      const a = arcs[arcs.length - 1]!
      arcs.push(a + Math.min(m.coarse, m.step * Math.max(1, (1 + a * a) / (1 + m.fineTo * m.fineTo))))
    }
    const reach = THREE.MathUtils.degToRad(m.capDeg) * stage.radius - arcs[arcs.length - 1]!
    let low = 1
    let high = 1.2
    const sum = (g: number): number => (m.coarse * g * (Math.pow(g, m.tail) - 1)) / (g - 1)
    for (let k = 0; k < 60; k++) {
      const mid = (low + high) / 2
      if (sum(mid) < reach) low = mid
      else high = mid
    }
    for (let i = 1; i <= m.tail; i++) arcs.push(arcs[arcs.length - 1]! + m.coarse * Math.pow(low, i))
    // The mesh is cut in pieces (bands of rings by wedges of sectors) that share their edges exactly; a piece that
    // lies outside the picture or behind the horizon is not drawn. Which pieces are drawn follows from the eye alone.
    const per = m.sectors / m.wedges
    const index = new Uint16Array(m.band * per * 6)
    let n = 0
    for (let i = 0; i < m.band; i++) {
      for (let j = 0; j < per; j++) {
        const a = i * (per + 1) + j
        const b = a + 1
        const cc = a + per + 1
        const d = cc + 1
        index[n++] = a
        index[n++] = cc
        index[n++] = b
        index[n++] = b
        index[n++] = cc
        index[n++] = d
      }
    }
    const faces = new THREE.BufferAttribute(index, 1)
    const up = stage.down.clone().negate()
    const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(stage.down, stage.down.z).normalize()
    const right = fwd.clone().cross(up).normalize()
    const onBall = (arc: number, turn: number): THREE.Vector3 => {
      const alpha = arc / stage.radius
      return up.clone().multiplyScalar(Math.cos(alpha)).addScaledVector(right, Math.sin(alpha) * Math.cos(turn)).addScaledVector(fwd, Math.sin(alpha) * Math.sin(turn))
    }
    this.material.side = THREE.DoubleSide
    // the gas gives its light already weighed by how much of the look it holds, and leaves the rest to what was
    // drawn behind it (the sky over the limb, the globe's own face on the globe's side)
    const weighed = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor } as const
    this.material.setValues(weighed)
    this.laid = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms: this.material.uniforms, transparent: true, side: THREE.DoubleSide, ...weighed })
    this.mesh = new THREE.Group()
    this.mesh.renderOrder = -6
    // The bake. One triangle over the whole buffer; the buffer is as large as the picture and g.margin wider each
    // way, so the ground a little outside the picture is there for the rays that end under it. It is sized at the
    // first picture and made then, with its program; after that no frame makes anything for it.
    this.baked = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false })
    this.material.uniforms.uCvBaked!.value = this.baked.texture
    this.baker = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: BAKE_VERT, fragmentShader: BAKE_FRAG, uniforms: this.material.uniforms, depthTest: false, depthWrite: false })
    const whole = new THREE.BufferGeometry()
    whole.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    const over = new THREE.Mesh(whole, this.baker)
    over.frustumCulled = false
    this.bakeScene.add(over)
    // (what starts the bake: a thing of the ground's own group that the renderer reaches before any piece and
    // that draws no pixel itself)
    const none = new THREE.BufferGeometry()
    none.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3))
    none.setDrawRange(0, 0)
    const quiet = new THREE.MeshBasicMaterial({ colorWrite: false, depthTest: false, depthWrite: false })
    const first = new THREE.Mesh(none, quiet)
    first.frustumCulled = false
    first.renderOrder = -7
    first.onBeforeRender = (renderer, _scene, camera) => this.bakeNow(renderer, camera, g.margin, g.fine)
    this.mesh.add(first)
    this.bakeParts.push(whole, none, quiet)
    for (let i0 = 0; i0 < arcs.length - 1; i0 += m.band) {
      for (let w = 0; w < m.wedges; w++) {
        const positions = new Float32Array((m.band + 1) * (per + 1) * 3)
        for (let i = 0; i <= m.band; i++) {
          for (let j = 0; j <= per; j++) {
            const k = (i * (per + 1) + j) * 3
            positions[k] = arcs[Math.min(i0 + i, arcs.length - 1)]!
            positions[k + 1] = (((w * per + j) % m.sectors) / m.sectors) * Math.PI * 2
            positions[k + 2] = 0
          }
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setIndex(faces)
        const a0 = arcs[i0]!
        const a1 = arcs[Math.min(i0 + m.band, arcs.length - 1)]!
        const mid = onBall((a0 + a1) / 2, ((w + 0.5) * per / m.sectors) * Math.PI * 2)
        let wide = 0
        for (const a of [a0, a1]) for (const t of [w, w + 0.5, w + 1]) wide = Math.max(wide, mid.angleTo(onBall(a, ((t * per) / m.sectors) * Math.PI * 2)))
        geometry.boundingSphere = new THREE.Sphere(stage.centre.clone().addScaledVector(mid, stage.radius), 2 * stage.radius * Math.sin(wide / 2) + m.relief)
        const piece = new THREE.Mesh(geometry, this.material)
        piece.renderOrder = -6
        this.mesh.add(piece)
        const entry = { mesh: piece, mid, wide, seen: false }
        this.pieces.push(entry)
        // The renderer puts a geometry on the card (its buffer, and a vertex array for each program) at its first
        // draw, and a piece is first drawn when the eye's horizon reaches it: in the rise that was a little work in
        // nearly every frame. So the first picture a material draws binds every piece: the pieces that picture does
        // not show (behind the horizon, or outside the picture by the renderer's own test) are drawn with no
        // elements, which makes what the card needs and no pixel. After that no frame makes anything for the ground.
        piece.onBeforeRender = (_renderer, _scene, camera) => {
          if (!this.binding) return
          this.screen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
          this.frustum.setFromProjectionMatrix(this.screen, THREE.WebGLCoordinateSystem, (camera as THREE.Camera & { reversedDepth?: boolean }).reversedDepth === true)
          this.ball.copy(geometry.boundingSphere!).applyMatrix4(piece.matrixWorld)
          geometry.setDrawRange(0, entry.seen && this.frustum.intersectsSphere(this.ball) ? Infinity : 0)
        }
        piece.onAfterRender = (_renderer, _scene, _camera, _geometry, material) => {
          if (!this.binding) return
          geometry.setDrawRange(0, Infinity)
          this.bound.add(material)
        }
      }
    }
    this.over = Math.acos(stage.radius / (stage.radius + m.relief))
  }

  /** eye: the eye in the stage's own frame. keep: how much of the ground is drawn over what lies under it (1 in the
   * close view; on the globe's side it falls with the eye's height). onGlobe: the ground lies on the globe. */
  update(time: number, eye: THREE.Vector3, keep = 1, onGlobe = false): void {
    this.material.uniforms.uCvTime!.value = time
    this.material.uniforms.uCvKeep!.value = keep
    this.mesh.visible = keep > 0
    const material = onGlobe ? this.laid : this.material
    const from = this.towards.copy(eye).sub(stage.centre)
    const horizon = Math.acos(Math.min(stage.radius / from.length(), 1)) + this.over
    from.normalize()
    // a material that has not drawn yet binds every piece in its first picture (see the constructor)
    this.binding = !this.bound.has(material)
    for (const piece of this.pieces) {
      piece.seen = piece.mid.angleTo(from) - piece.wide < horizon
      piece.mesh.material = material
      piece.mesh.visible = piece.seen || this.binding
      piece.mesh.frustumCulled = !this.binding
    }
  }

  /** Draws the cell diagram of this sample into the buffer, as the camera of the picture sees the ground. */
  private bakeNow(renderer: THREE.WebGLRenderer, camera: THREE.Camera, margin: number, fine: number): void {
    const u = this.material.uniforms
    const target = renderer.getRenderTarget()
    if (target) this.size.set(target.width, target.height)
    else renderer.getDrawingBufferSize(this.size)
    const w = Math.ceil(this.size.x * margin * fine)
    const h = Math.ceil(this.size.y * margin * fine)
    if (this.baked.width !== w || this.baked.height !== h) this.baked.setSize(w, h)
    // from the stage's own frame to the picture, and to the buffer (the same look, margin wider each way)
    this.toClip.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.mesh.matrixWorld)
    ;(u.uCvClip!.value as THREE.Matrix4).copy(this.toClip)
    this.wider.makeScale(this.size.x * fine / w, this.size.y * fine / h, 1)
    this.toBake.multiplyMatrices(this.wider, this.toClip)
    ;(u.uCvBake!.value as THREE.Matrix4).copy(this.toBake)
    // the eye in the stage's frame, and the ray of every place of the buffer
    this.back.copy(this.mesh.matrixWorld).invert()
    const eye = (u.uCvEye!.value as THREE.Vector3).setFromMatrixPosition(camera.matrixWorld).applyMatrix4(this.back)
    this.back.copy(this.toBake).invert()
    this.at0.set(0, 0, 0.5).applyMatrix4(this.back)
    this.atX.set(1, 0, 0.5).applyMatrix4(this.back).sub(this.at0)
    this.atY.set(0, 1, 0.5).applyMatrix4(this.back).sub(this.at0)
    ;(u.uCvRay0!.value as THREE.Vector3).copy(this.at0).sub(eye)
    ;(u.uCvRayX!.value as THREE.Vector3).copy(this.atX)
    ;(u.uCvRayY!.value as THREE.Vector3).copy(this.atY)
    const xr = renderer.xr.enabled
    renderer.xr.enabled = false
    renderer.setRenderTarget(this.baked)
    renderer.render(this.bakeScene, this.bakeEye)
    renderer.setRenderTarget(target)
    renderer.xr.enabled = xr
  }

  dispose(): void {
    for (const piece of this.pieces) piece.mesh.geometry.dispose()
    for (const part of this.bakeParts) part.dispose()
    this.baked.dispose()
    this.baker.dispose()
    this.material.dispose()
    this.laid.dispose()
    this.ramp.dispose()
  }
}
