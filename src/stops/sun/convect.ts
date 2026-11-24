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
  // a bulb: round over the middle, steep where it meets the lane; a wide cell stands taller than a small one
  // a blown skin: round on top, and it meets the lane steeply (the edge power below 1 does that)
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
out vec2 vG;
out vec3 vPos;
out vec3 vView;
out vec3 vClip;
${STAGE_GLSL}
${NOISE_GLSL}
${CONVECT_GLSL}
void main() {
  // the mesh lies still on the ground: rings round the point under the stage's camera
  float arc = position.x;
  vec2 g = arc * vec2(cos(position.y), sin(position.y));
  float alpha = arc / ST_RADIUS;
  vec3 dir = -ST_DOWN * cos(alpha) + sin(alpha) * (ST_RIGHT * cos(position.y) + ST_FWD * sin(position.y));
  // the relief is real as far as the rings are close enough to carry it; beyond, the ground is the ball itself
  float real = 1.0 - smoothstep(uCvMesh.x, uCvMesh.y, arc);
  float h = real > 0.0 ? cvHeight(g, uCvTime) * real : 0.0;
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
uniform vec4 uCvSteep;
uniform vec4 uCvSheen;
uniform vec4 uCvGrain;
uniform vec4 uCvRim;
uniform vec4 uCvFall;
uniform vec4 uCvGlass;
uniform vec4 uCvSkin;
uniform vec4 uCvFlankFar;
uniform vec4 uCvLimbTint;
uniform vec4 uCvView;
uniform vec4 uCvAbove;
uniform vec4 uCvFarMore;
uniform vec4 uCvPoints;
uniform vec4 uCvThreadIn;
uniform vec4 uCvUmbra;
uniform vec4 uCvFibreLook;
uniform vec4 uCvVeil;
uniform vec3 uCvVeilTint;
uniform vec4 uCvFar;
uniform vec4 uCvFlat;
uniform vec4 uCvLineMore;
uniform vec4 uCvLineIn;
uniform vec4 uCvLineFlow;
uniform vec4 uCvHole;
uniform vec2 uCvLineClose;
uniform vec4 uCvMesh;
uniform float uCvKeep;
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
  vec3 near = max(cvNear, 0.0);
  vec2 up1 = cvUp1;
  vec2 up2 = cvUp2;
  vec2 fanRaw = cvFan;
  vec4 fibre;
  vec4 spot = cvSpot(g, t, fibre);
  float L = uCvCell.x;
  float footX = length(dFdx(g));
  float footY = length(dFdy(g));
  float foot = max(footX, footY);
  // what a pixel covers, in the measure of the cells where it lies (they are smaller far from the place): a cell
  // that a pixel cannot hold is not drawn, the ground there is its mean with a mottle of wider waves, each wave
  // drawn only where a pixel is narrower than it
  // (the root of what a pixel covers both ways: a far cell seen flat is many pixels wide and few deep, and it is
  // drawn while their product holds it)
  // (what fades reads the size in 1080ths of the frame height, not in pixels of the format: uFormat is the
  // format's height over 1080. The steps of the lookups below keep the pixel itself, foot)
  float footM = sqrt(footX * footY) * uFormat;
  float footC = footM * cvTight(g);
  // (the long side of what a pixel covers: toward the limb a cell is many pixels wide and under a pixel deep, one
  // sample a pixel then draws grain, so the cell gives way by that side too, between uCvFlat.x and uCvFlat.y cells
  // a pixel)
  float footL = foot * uFormat * cvTight(g);
  float fine = (1.0 - smoothstep(uCvFar.x * L, uCvFar.y * L, footC)) * (1.0 - smoothstep(uCvFlat.x * L, uCvFlat.y * L, footL));
  float mottle = 0.0;
  for (int k = 0; k < 5; k++) {
    float lam = L * uCvFarMore.y * exp2(float(k));
    mottle += (1.0 - smoothstep(uCvFarMore.z * lam, uCvFarMore.w * lam, footM)) / (1.0 + float(k)) * (vnoise(vec3(g / lam + 17.3 * float(k), t * 0.05 + 3.1 * float(k))) - 0.5);
  }
  // slope of the relief in the chart, then as a normal on the ball
  float r2 = dot(rel, rel);
  float r = sqrt(r2);
  float old = smoothstep(0.5, 1.0, own.x);
  float way = cvWay(r, e);
  // a blown skin: round on top, and it meets the lane steeply (the edge power below 1 does that)
  float cap = pow(max(1.0 - pow(way, uCvDome.w), 0.0), uCvGloss.w);
  vec2 slope;
  {
    // the height's own derivative in the diagram's frame, carried to the ground through the chart's wander (two
    // more looks at the chart and at the lumps, none at the cells)
    float eL = e / L;
    float sum = r + eL + 1e-5;
    float on = step(1e-7, e);
    vec2 gr = r > 1e-5 ? rel / r : vec2(0.0);
    vec2 gway = (eL * gr - r * ge * on) / (sum * sum);
    float dcap = -uCvGloss.w * uCvDome.w * pow(way, uCvDome.w - 1.0) * pow(max(1.0 - pow(way, uCvDome.w), 0.03), uCvGloss.w - 1.0);
    float sz = (r + eL) / uCvDome.y;
    float mine = (0.7 + 0.6 * own.y) * mix(0.5, 1.0, own.z);
    float tall = uCvDome.z * clamp(sz, 0.35, 1.5) * mine + uCvDome.x;
    float dtall = (sz > 0.35 && sz < 1.5) ? uCvDome.z * mine / uCvDome.y : 0.0;
    float lump = uCvPetal.x * (petal.x - 0.4);
    float dip = uCvPetalMore.w * old * exp(-r2 / 0.02);
    float pe = 0.012;
    vec2 glump = vec2(cvLumps(rel + vec2(pe, 0.0), own.y, t) - petal.x, cvLumps(rel + vec2(0.0, pe), own.y, t) - petal.x) / pe;
    vec2 gq = dtall * cap * (gr + ge * on) + (tall + lump - dip) * dcap * gway + uCvPetal.x * cap * glump + dip * cap * rel / 0.01;
    float je = max(0.5 * foot, 0.002);
    vec2 q0 = cvChart(g, t);
    vec2 qx = (cvChart(g + vec2(je, 0.0), t) - q0) / je;
    vec2 qy = (cvChart(g + vec2(0.0, je), t) - q0) / je;
    slope = vec2(dot(gq, qx), dot(gq, qy)) / cvTight(g);
  }
  for (int k = 0; k < (spot.x > 0.0 ? 1 : 0); k++) {
    float eps = max(foot, 0.003);
    vec4 ox;
    vec4 oy;
    vec4 sx = cvSpot(g + vec2(eps, 0.0), t, ox);
    vec4 sy = cvSpot(g + vec2(0.0, eps), t, oy);
    float f0 = spot.x * (spot.y + cvFibreTop(spot, fibre) - dome);
    slope = slope * (1.0 - spot.x) + vec2(sx.x * (sx.y + cvFibreTop(sx, ox) - dome) - f0, sy.x * (sy.y + cvFibreTop(sy, oy) - dome) - f0) / eps;
  }
  slope *= uCvMesh.z;
  float ringLen = length(g);
  vec2 rhat = ringLen > 1e-5 ? g / ringLen : vec2(1.0, 0.0);
  float alpha = ringLen / ST_RADIUS;
  vec3 flatR = ST_RIGHT * rhat.x + ST_FWD * rhat.y;
  vec3 eR = ST_DOWN * sin(alpha) + flatR * cos(alpha);
  vec3 eA = -ST_RIGHT * rhat.y + ST_FWD * rhat.x;
  vec3 normal = normalize(dir - eR * dot(slope, rhat) - eA * dot(slope, vec2(-rhat.y, rhat.x)));
  // what lies behind the ball's own horizon is not seen (where the relief is real a top may stand a little past it)
  if (dot(dir, uCam - (ST_CENTRE + dir * ST_RADIUS)) < -1.6 * (1.0 - smoothstep(uCvMesh.x, uCvMesh.y, length(g)))) discard;
  vec3 toEye = normalize(uCam - vPos);
  float mu = clamp(dot(normal, toEye), 0.0, 1.0);
  float muFlat = clamp(dot(dir, toEye), 0.0, 1.0);

  // heat of the cells: dark lanes, a bright middle while the cell is young, a dark dip when it is old
  // the side of a bulb is seen as a tall band: it goes from the dark of the lane at its foot to the full light at
  // its shoulder by its own height, so the band is a slope of light and not a wall of one colour
  // (seen flat, far off, a bulb shows its side alone: there the dark foot is the lowest part only, or the far ground
  // would be all foot)
  // seen from above a cell is a granule (a bright body that falls off softly into a dark lane); seen low and from
  // near it is a skin of dark glass with a bright rim. The one gives way to the other by the eye's height over the
  // ball and the angle the ball itself is seen at, never by time
  float eyeHigh = smoothstep(log(uCvAbove.x), log(uCvAbove.y), log(max(length(uCam - ST_CENTRE) / ST_RADIUS - 1.0, 1e-4)));
  float lowView = 1.0 - eyeHigh * smoothstep(uCvView.x, uCvView.y, muFlat);
  float lowFoot = uCvSteep.y * mix(uCvFlankFar.x, 1.0, smoothstep(uCvFlankFar.y, uCvFlankFar.z, muFlat));
  // (a lane narrower than a pixel is drawn as wide as the pixel and weaker by the same share, so it keeps the light
  // it takes and one sample a pixel draws no grain of it: uCvFlat.z pixels)
  float laneW = mix(uCvAbove.z, uCvHeat.x, lowView);
  float laneE = max(laneW, uCvFlat.z * footC);
  float body = (1.0 - laneW / laneE * exp(-e / laneE)) * mix(uCvSteep.x, 1.0, smoothstep(0.0, lowFoot, cap));
  float young = 1.0 - smoothstep(0.0, 0.45, own.x);
  float spreadNow = uCvTone.z * mix(uCvAboveMore.x, 1.0, lowView);
  float top = uCvTone.y * mix(uCvAboveMore.z, 1.0, lowView) * (1.0 - spreadNow + 2.0 * spreadNow * own.y) * mix(mix(uCvAbove.w, 1.0, cap), 1.0, lowView) * (1.0 + uCvHeat.z * young - uCvHeat.w * old);
  top *= 1.0 + uCvTone.w * exp(-r2 / (uCvHeat.y * uCvHeat.y)) * (1.0 - 2.2 * old);
  // a grown cell is a skin over the hot gas: its middle is seen through the most of it and is the darker part, the
  // shoulder where the skin turns down to the lane is the brightest; a young cell is still all bright
  top *= 1.0 - uCvGlass.x * mix(uCvView.z, 1.0, lowView) * smoothstep(0.1, uCvGlass.w, own.x) * (1.0 - smoothstep(uCvGlass.y, uCvGlass.z, way));
  top *= 1.0 + uCvGrain.x * 2.0 * (petal.x - 0.4) * fine;
  // the inside of a cell is no even light: broad areas of it are hotter, others cooler, and the flow carries them
  // (the heat of the upwelling: the gas is hottest where it rises, in the inside of the cell, and cools on its way
  // out; the line where it has cooled is no ring, the flow carries tongues of the hot gas outward, and the light
  // falls off into the lane beyond it)
  float heat = 1.0 - smoothstep(uCvPatch.y, uCvPatch.z, uCvFlankFar.w * way + uCvPatch.x * (2.0 * cvPatch(rel, own.y, t) - 1.0));
  // (a few hot glints in a dark inside: where the gas is hottest the light is uCvThreadIn.w times the cell's own)
  top *= mix(1.0, mix(uCvThreadIn.z, mix(uCvAboveMore.y, uCvThreadIn.w, lowView), heat), fine);
  // the threads are seen by the dark between them: little on the top, deep on the side where the plasma runs down
  // (a thread is drawn only where a pixel is narrower than it: farther off the locks merge into their mean)
  float threads = 1.0 - smoothstep(uCvGloss.y, uCvGloss.z, footC);
  top *= 1.0 + mix(-uCvThread.w * (0.1 + 0.9 * way * way) * 0.45, uCvMesh.w * max(petal.y - 1.0, 0.0) * smoothstep(uCvThreadIn.x, uCvThreadIn.y, way) - uCvThread.w * (0.1 + 0.9 * way * way) * (1.0 - min(petal.y, 1.0)), threads) * fine;
  top *= 1.0 + uCvGrain.w * (vnoise(vec3(g / L * uCvGrain.y, t * uCvGrain.z + own.y * 5.0)) + 0.6 * vnoise(vec3(g / L * uCvGrain.y * 3.7 + 9.1, t * uCvGrain.z * 1.6 + own.y * 3.0)) - 0.8) * fine;
  float lum = uCvTone.x + (top - uCvTone.x) * body;
  // a few bright points stand in the lanes
  lum += uCvPoints.x * (1.0 - smoothstep(0.0, uCvPoints.y, e)) * smoothstep(uCvPoints.z, 1.0, vnoise(vec3(g / L * uCvPoints.w, t * 0.3))) * fine;
  // threads of the lanes: thin bright lines on the flank of a cell. They leave the lane square to it and run up
  // the flank toward the cap; where two lanes meet in a pit the way up turns from one lane's to the other's, and
  // the threads of both turn with it and close in on the line between them, so round every pit they stand like
  // petals. The cap is free of them. A thread is a level line of one noise of the place where it leaves the
  // lane, so the threads stand in bunches, close where that noise is steep and none where it is level. A second,
  // wider noise cuts the bunches to unequal lengths, and that cut travels outward along the threads with the
  // cell's own flow
  // (leaves: the place on the lane straight below, by the softer way up, uCvLine.w. uCvLine.x: noise cells to a
  // lattice unit along the lane, uCvLineMore.x level lines to the noise's whole range. uCvLine.y: a thread is no
  // straight line, the noise changes slowly with the height on the flank. uCvLineFlow.z: noise cells of the cut
  // to a lattice unit. A thread is uCvLine.z 1080ths of the frame height to each side of its line, near or far;
  // round it a glow of uCvLineMore.y of its light falls off over uCvLineFlow.w more; where the level lines stand
  // closer than a thread is wide they are not drawn: uCvLineClose is the share of the lines' distance that a
  // thread's width may hold, full below the first and none over the second, so no grating of threads a pixel or two
  // apart is drawn that would crawl as the eye moves. Seen from above there are none)
  {
    vec2 leaves = rel - normalize(fanRaw + vec2(1e-6, 0.0)) * near.x;
    // (how far a pixel is from the line is read from the noise's own slope and the pixel's step in the place it
    // is looked up at, not from the noise's difference between neighbour pixels: that difference is one for a
    // block of four pixels and would break a thin line into dots)
    vec3 np = vec3(leaves * uCvLine.x, own.y * 31.0 + 2.0 + way * uCvLine.y);
    float tn = vnoise(np);
    vec2 gn = (vec2(vnoise(np + vec3(0.02, 0.0, 0.0)), vnoise(np + vec3(0.0, 0.02, 0.0))) - tn) / 0.02;
    float per = uCvLineMore.x * length(vec2(dot(gn, dFdx(np.xy)), dot(gn, dFdy(np.xy))));
    float thin = uCvLine.z * uFormat;
    float off = abs(fract(tn * uCvLineMore.x) - 0.5) / max(per, 1e-6);
    float line = ((1.0 - smoothstep(thin - 0.5 * uFormat, thin + 0.5 * uFormat, off)) + uCvLineMore.y * (1.0 - smoothstep(thin, thin + uCvLineFlow.w * uFormat, off))) * (1.0 - smoothstep(uCvLineClose.x, uCvLineClose.y, per * thin));
    float cut = smoothstep(uCvLineMore.z, uCvLineMore.w, vnoise(vec3(leaves * uCvLineFlow.z + 3.0, way * uCvLineFlow.x - t * uCvLineFlow.y + own.y * 7.0)));
    lum += uCvLineIn.w * line * cut * smoothstep(uCvLineIn.x, uCvLineIn.y, way) * mix(uCvLineIn.z, 1.0, 1.0 - laneW / laneE * exp(-e / laneE)) * lowView * fine * (1.0 - spot.x);
  }
  // the pits: where lanes meet the ground is black in a round place, nowhere else
  lum *= 1.0 - uCvHole.x * (1.0 - smoothstep(uCvHole.y, uCvHole.z, length(vec2(e / L, near.y)))) * (1.0 - spot.x);
  lum = mix(uCvFar.z * (1.0 + uCvFarMore.x * mottle), lum, mix(uCvFar.w, 1.0, fine));

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

  // light leaves the hot gas along its own normal: a level top is the brightest, a steep side is darker on every
  // side of the bulb, and a face turned to the eye is a little brighter than one turned away
  float limb = (1.0 - uCvShade.x + uCvShade.x * mu) / (1.0 - uCvShade.x + uCvShade.x * muFlat);
  float faced = clamp((limb - uCvShade.y) / (uCvShade.z - uCvShade.y), 0.0, 1.0);
  float level = smoothstep(uCvSteep.z, uCvSteep.w, dot(normal, dir));
  float shade = (uCvShade.y + (uCvShade.z - uCvShade.y) * faced * faced * (3.0 - 2.0 * faced)) * mix(uCvSheen.w, 1.0, level);
  lum *= mix(1.0, shade, fine * (1.0 - spot.x)) * mix(1.0, uCvShade.y + (uCvShade.z - uCvShade.y) * faced * faced * (3.0 - 2.0 * faced), fine * spot.x);
  // the light falls toward the limb: the flatter the ball itself is seen, the less of the deep hot gas shows
  lum *= 1.0 - uCvFall.x * pow(1.0 - muFlat, uCvFall.y);
  // the shoulder of a bulb, where its skin turns down into the lane, is a thin bright line, broken along its way
  // (it is a crescent: it stands on the far edge of a cell alone, where the skin rolls over into the crease and is
  // seen along itself: the line is where the skin is seen edge on, by the power uCvRim.z, beyond uCvRim.y of the
  // way to the lane; uCvHole.w is the span of the turn away from the eye over which it comes in. With no such
  // span it is a ring at uCvRim.y of the way, uCvRim.z wide, all round)
  float rim = (uCvHole.w > 0.0 ? pow(1.0 - mu, uCvRim.z) * smoothstep(uCvRim.y - 0.2, uCvRim.y, way) : exp(-pow((way - uCvRim.y) / uCvRim.z, 2.0))) * smoothstep(uCvRim.w, uCvRim.w + 0.3, vnoise(vec3(g / L * 5.0, t * 0.2 + own.y * 9.0))) * (1.0 - spot.x) * (uCvHole.w > 0.0 ? smoothstep(0.0, uCvHole.w, muFlat - mu) : 1.0);
  // the gloss of the bulbs: a sheen where the surface lies between the eye and the far light
  vec3 lightDir = normalize(ST_RIGHT * uCvSheen.x + ST_FWD * uCvSheen.y - ST_DOWN * uCvSheen.z);
  float sheen = pow(max(dot(normal, normalize(toEye + lightDir)), 0.0), uCvGloss.x);
  lum += (uCvRim.x * mix(uCvView.w, 1.0, lowView) * rim + uCvShade.w * body * sheen * (1.0 - spot.x)) * fine;

  // the skin of a bulb glows: where it is seen along itself (the far shoulder of every bulb, and all of the far
  // ground) the way through it is long and it is brighter; seen straight on it is the thinnest
  lum *= 1.0 + uCvSkin.x * pow(1.0 - mu, uCvSkin.y) * fine * (1.0 - spot.x);
  // the brightest light is held under white by a knee (no part of the ground burns out)
  lum = lum > uCvSkin.z ? uCvSkin.z + (lum - uCvSkin.z) / (1.0 + (lum - uCvSkin.z) / uCvSkin.w) : lum;
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
  col += inverseFilmic(grade(uCvVeilTint, 0.0)) * (uCvVeil.y * clamp(veil, 0.0, uCvVeil.z) * (1.0 - 0.85 * spot.x));

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
  outColor = diagOut(vec4(col, uCvKeep), 1.0, 1.0, vec3(0.9, 0.5, 0.1), vec2(0.0), length(vView));
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
  private readonly pieces: { mesh: THREE.Mesh; mid: THREE.Vector3; wide: number }[] = []
  private readonly towards = new THREE.Vector3()
  private readonly over: number

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
        uCvMesh: { value: new THREE.Vector4(m.real[0]!, m.real[1]!, 1, l.streak) },
        uCvKeep: { value: 1 },
        uCvHeat: { value: new THREE.Vector4(l.lane, l.middleWide, l.young, l.old) },
        uCvTone: { value: new THREE.Vector4(l.dark, l.top, l.spread, l.middle) },
        uCvShade: { value: new THREE.Vector4(l.limb, l.shade[0]!, l.shade[1]!, l.glint) },
        uCvSteep: { value: new THREE.Vector4(l.flank[0]!, l.flank[1]!, l.steep[1]!, l.steep[2]!) },
        uCvSheen: { value: new THREE.Vector4(l.sheen.from[0]!, l.sheen.from[1]!, l.sheen.from[2]!, l.steep[0]!) },
        uCvGloss: { value: new THREE.Vector4(l.sheen.power, l.threadFar[0]!, l.threadFar[1]!, c.dome.edge) },
        uCvGrain: { value: new THREE.Vector4(l.petal, l.boil.scale, l.boil.rate, l.boil.amount) },
        uCvPetal: { value: new THREE.Vector4(c.lumps.height, c.lumps.scale[0]!, c.lumps.turn[0]!, c.lumps.speed[0]!) },
        uCvThread: { value: new THREE.Vector4(c.thread.round, c.thread.out, c.thread.speed, l.thread) },
        uCvWarpMore: { value: new THREE.Vector4(c.warp.fine[0]!, c.warp.fine[1]!, c.warp.fine[2]!, c.sizes) },
        uCvGap: { value: new THREE.Vector4(c.gap.width, c.gap.scale, c.gap.vary, c.lumps.crease) },
        uCvPetalMore: { value: new THREE.Vector4(c.lumps.scale[1]!, c.lumps.turn[1]!, c.lumps.speed[1]!, c.dome.dimple) },
        uCvThreadIn: { value: new THREE.Vector4(l.threadIn[0]!, l.threadIn[1]!, l.patch.low, l.patch.hot) },
        uCvCurl: { value: new THREE.Vector4(c.thread.curl[0]!, c.thread.curl[1]!, c.thread.curl[2]!, c.thread.locks) },
        uCvPoints: { value: new THREE.Vector4(l.points.amount, l.points.within, l.points.few, l.points.scale) },
        uCvTight: { value: new THREE.Vector4(c.tight.from, c.tight.power, c.tight.knee, c.thread.thin) },
        uCvFarMore: { value: new THREE.Vector4(l.far.mottle, l.far.wave, l.far.band[0]!, l.far.band[1]!) },
        uCvPatch: { value: new THREE.Vector4(l.patch.amount, l.patch.band[0]!, l.patch.band[1]!, l.patch.scale) },
        uCvFlankFar: { value: new THREE.Vector4(l.flankFar[0]!, l.flankFar[1]!, l.flankFar[2]!, l.patch.edge) },
        uCvView: { value: new THREE.Vector4(l.view.band[0]!, l.view.band[1]!, l.view.glass, l.view.rim) },
        uCvAbove: { value: new THREE.Vector4(l.view.heights[0]!, l.view.heights[1]!, l.view.lane, l.view.cap) },
        uCvAboveMore: { value: new THREE.Vector4(l.view.spread, l.view.hot, l.view.gain, s.fibres.sway) },
        uCvSwallow: { value: new THREE.Vector4(c.swallow[0]!, c.swallow[1]!, 0, 0) },
        uCvLimbTint: { value: new THREE.Vector4(l.limbTint[0]!, l.limbTint[1]!, l.limbTint[2]!, l.limbTint[3]!) },
        uCvSkin: { value: new THREE.Vector4(l.skin[0]!, l.skin[1]!, l.knee[0]!, l.knee[1]!) },
        uCvGlass: { value: new THREE.Vector4(l.glass.amount, l.glass.from, l.glass.to, l.glass.grown) },
        uCvFall: { value: new THREE.Vector4(l.fall.amount, l.fall.power, l.deep.amount, l.deep.below) },
        uCvRim: { value: new THREE.Vector4(l.rim.amount, l.rim.at, l.rim.wide, l.rim.few) },
        uCvUmbra: { value: new THREE.Vector4(s.floor, s.fibres.head, s.fibres.level, s.fibres.edge) },
        uCvFibreLook: { value: new THREE.Vector4(s.fibres.gap, s.fibres.grains, s.fibres.speed, s.fibres.cut) },
        uCvVeil: { value: new THREE.Vector4(l.veil.amount, l.veil.level, l.veil.most, l.veil.from) },
        uCvVeilTint: { value: new THREE.Vector3().fromArray((l.veil.tint as number[]).map(srgbToLinear)) },
        uCvFar: { value: new THREE.Vector4(l.far.from, l.far.to, l.far.level, l.far.keep) },
        uCvFlat: { value: new THREE.Vector4(l.far.flat[0]!, l.far.flat[1]!, l.far.lane, 0) },
        uCvLine: { value: new THREE.Vector4(l.line.scale, l.line.curl, l.line.wide, l.line.soft) },
        uCvLineMore: { value: new THREE.Vector4(l.line.levels, l.line.glow[0]!, l.line.bunch[1]!, l.line.bunch[2]!) },
        uCvLineIn: { value: new THREE.Vector4(l.line.from[0]!, l.line.from[1]!, l.line.lane, l.line.amount) },
        uCvLineFlow: { value: new THREE.Vector4(l.line.flow[0]!, l.line.flow[1]!, l.line.bunch[0]!, l.line.glow[1]!) },
        uCvHole: { value: new THREE.Vector4(l.pit.amount, l.pit.from, l.pit.to, l.rim.far) },
        uCvLineClose: { value: new THREE.Vector2(l.line.close[0]!, l.line.close[1]!) },
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
    this.laid = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms: this.material.uniforms, transparent: true, side: THREE.DoubleSide })
    this.mesh = new THREE.Group()
    this.mesh.renderOrder = -6
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
        this.pieces.push({ mesh: piece, mid, wide })
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
    for (const piece of this.pieces) piece.mesh.material = material
    const from = this.towards.copy(eye).sub(stage.centre)
    const horizon = Math.acos(Math.min(stage.radius / from.length(), 1)) + this.over
    from.normalize()
    for (const piece of this.pieces) piece.mesh.visible = piece.mid.angleTo(from) - piece.wide < horizon
  }

  dispose(): void {
    for (const piece of this.pieces) piece.mesh.geometry.dispose()
    this.material.dispose()
    this.laid.dispose()
    this.ramp.dispose()
  }
}
