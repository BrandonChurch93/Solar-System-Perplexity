import * as THREE from 'three'
import { DIAG_GLSL } from '../../diagnostics/diag'
import { RING_FIELD_GLSL } from './field'
import { GRAIN_LEVELS, ICE_GLSL, pcg, pixelScale, type Ice } from './ice'
import { GLOBE_SHADOW_GLSL, SHEET_AT_GLSL, SHEET_LAW_GLSL, SHEET_OUTER_GLSL, sheetDepth } from './sheet'
import spec from './grains.json'
import model from './ringfield.json'
import skim from './skim.json'

// The ice near the lens, grain by grain. Every grain is a body of its own: it rides the orbit of its radius,
// floats at a height of its own above or below the middle of the plane, and is lit by the Sun over its body.
// The grains of the counted levels are a part of the sheet (see grains.json): they lie where the sheet has
// depth, they have the colour of the ringlet they lie in, and with what is left of the sheet they add up to
// the whole sheet, so they merge into it with distance. Nothing here is a surface: between the grains one
// sees the grains behind them and what is left of the sheet in their shade.

// the lens of one take, in the frame of the rings: where it is and how it looks, how far the orbit that keeps
// pace with the globe has turned (full circles), the tangents of its half angles across and up, and how far
// a grain may move against it during the take (radii)
export interface Lens { position: THREE.Vector3; quaternion: THREE.Quaternion; turns: number; tan: [number, number]; slack: number }

const VERT = /* glsl */ `
precision highp float;
precision highp int;
in vec3 aPlace;
in vec4 aGrain;
uniform vec3 uCamL;
uniform float uPolar;
uniform float uGrad;
uniform float uGain;
uniform float uWeight;
uniform float uVignette;
uniform float uAspect;
uniform float uSat;
uniform vec3 uTintDense;
uniform vec3 uTintThin;
uniform vec3 uFloor;
uniform vec3 uGrainView;
uniform vec4 uGrainLook[${GRAIN_LEVELS}];
uniform vec4 uGrainLit;
uniform vec4 uGrainShape;
uniform vec4 uGrainShape2;
uniform vec4 uGrainFoot;
uniform float uGrainMean[9];
uniform float uGrainLift[${GRAIN_LEVELS}];
flat out vec4 vTone;
flat out vec3 vWay;
flat out vec4 vSun;
flat out vec3 vLobe0;
flat out vec3 vLobe1;
flat out vec3 vLobe2;
flat out vec2 vMore;
out vec2 vAt;
${RING_FIELD_GLSL}
${GLOBE_SHADOW_GLSL}
${ICE_GLSL}
${SHEET_OUTER_GLSL}
${SHEET_LAW_GLSL}
${SHEET_AT_GLSL}
// One ball of the grain: where its centre lies along and across the way of the grain over the screen, and
// its radius, in pixels. k is the number of the ball, apart how far the balls stand apart (0: all in the
// middle, the grain is round), radius the radius of the grain in pixels, e the direction of the way.
vec3 grainLobe(int k, uint seed, float apart, float turned, float radius, vec2 e) {
  vec3 b = ringBits(ringPcg(seed + 23u + uint(k)));
  float off = uGrainShape.x * (k == 0 ? uGrainShape.y * b.x : 0.5 + 0.5 * b.x);
  float rad = mix(uGrainShape2.z, min(uGrainShape.z + uGrainShape.w * b.z, 1.0 - off), apart);
  float ang = 6.2831853 * b.y + turned;
  vec2 c = (off * apart * radius) * vec2(cos(ang), sin(ang));
  return vec3(dot(c, e), e.x * c.y - e.y * c.x, rad * radius);
}
void main() {
  vec3 pos = aPlace;
  vec3 ray = pos - uCamL;
  float dist = max(length(ray), 1e-6);
  vec3 dir = ray / dist;
  int level = int(aGrain.z + 0.5);
  vec4 look = uGrainLook[level];
  float counted = uGrainReach[level].z;
  vec2 q = pos.xz;
  float r = max(length(q), 1e-6);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec4 clip = projectionMatrix * mv;
  // the radius of the grain on screen, in pixels
  float cosv = clamp(-mv.z / max(length(mv.xyz), 1e-9), 0.05, 1.0);
  float radius = 0.5 * aGrain.x * uGrainView.x / (dist * cosv);
  float shown = grainShown(level, dist) * uIceOrbit.z * (1.0 - smoothstep(look.x, look.y, 2.0 * radius));
  float mu = max(abs(dir.y), 1e-3);
  float mu0 = max(abs(uSunL.y), 0.02);
  // the sheet where the grain lies, read with the footprint of the pixel there or of the grain
  vec2 er = q / r;
  vec2 fd = ray.xz / max(length(ray.xz), 1e-6);
  float pixel = dist / uGrainView.x * length(vec2(dot(er, fd) / mu, er.x * fd.y - er.y * fd.x));
  float fp = max(ringFootprint(pixel, uGrad), uGrainFoot.x * aGrain.x);
  float tau;
  float lum;
  float thin;
  vec4 ink;
  vec3 tint;
  vec2 zone;
  sheetAt(q, r, fp, tau, lum, thin, ink, tint, zone);
  float spokes = iceSpokes(r, atan(q.y, q.x) / 6.2831853);
  lum *= exp(spokes * uIceOrbit.z);
  lum *= pow(clamp(zone.y / uFlatten.x, 1.0 / uFlatten.w, uFlatten.w), uFlatten.y * (1.0 - thin));
  // a grain of a counted level is there where its cell is one of the share that the depth of the sheet asks for
  float cells = grainCells(tau);
  float there = counted > 0.5 ? clamp((cells - aGrain.y) / max(uGrainFoot.y * cells, 1e-5) + 0.5, 0.0, 1.0) : 1.0;
  float taken = grainTaken(cells, dist);
  float left = tau - taken;
  float alpha = shown * there * uWeight;
  // its light: the brightness of the sheet there for a grain in full light, less by the shade of the grains
  // above it; a piece that is not counted is ice in sunlight whatever the sheet around it, and under the
  // middle of the plane it is behind what is left of the sheet
  float deg = degrees(acos(clamp(-dot(dir, uSunL), -1.0, 1.0)));
  float law = sheetLaw(thin, mu, mu0, deg);
  vec3 tone = mix(vec3(1.0), ink.rgb, uSat * mix(1.0, min(law, 1.0), thin * uViewFit.z)) * tint * mix(uTintDense, uTintThin, thin);
  vec3 under = mix(uFloor, vec3(1.0), globeShadow(pos, uSunL, uPolar)) * uShade.z;
  float up = (uCamL.y > 0.0 ? 1.0 : -1.0) * pos.y;
  float deep = clamp(0.5 - 0.5 * up / uGrainFoot.z, 0.0, 1.0);
  float lit = exp(-deep * taken / mu0);
  float below = (1.0 - counted) * (1.0 - smoothstep(-0.5 * aGrain.x, 0.5 * aGrain.x, up));
  lit *= mix(1.0, exp(-left / mu0), below);
  alpha *= mix(1.0, exp(-left / mu), below);
  float bright = mix(uOuter2.w * sheetLaw(0.0, mu, mu0, deg), lum / max(ringSat(tau * uRfLight.x), 1e-6) * law, counted);
  bright *= 1.0 + uGrainLift[level] * grainShown(level, dist);
  uint seed = uint(aGrain.w * 16777216.0);
  vec3 own = ringBits(ringPcg(seed + 11u));
  vec3 col = mix(tone, vec3(1.0), look.z) * under * (bright * (1.0 + mu / mu0) * lit * look.w * (1.0 + uGrainLit.w * (own.x * 2.0 - 1.0)));
  vec2 vq = clip.xy / clip.w * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  // the way of the grain over the screen during one take, in pixels: it rides its orbit and the lens moves
  float s = uIceOrbit.y / r;
  vec3 rel = -6.2831853 * uIceMove.w * s * sqrt(s) * vec3(-pos.z, 0.0, pos.x) - uIceMove.xyz;
  vec3 relV = mat3(modelViewMatrix) * rel;
  float iz = 1.0 / max(-mv.z, 1e-6);
  vec2 slide = (relV.xy + mv.xy * (iz * relV.z)) * (iz * uGrainView.x);
  float far = length(slide);
  vec2 e = far > 1e-4 ? slide / far : vec2(1.0, 0.0);
  // its shape: three balls, turning slowly about the line of sight
  float apart = smoothstep(uGrainShape2.x, uGrainShape2.y, 2.0 * radius);
  float turned = 6.2831853 * (own.y + uGrainFoot.w * (own.z - 0.5) * uIceOrbit.x);
  vLobe0 = grainLobe(0, seed, apart, turned, radius, e);
  vLobe1 = grainLobe(1, seed, apart, turned, radius, e);
  vLobe2 = grainLobe(2, seed, apart, turned, radius, e);
  // the Sun in the frame of the grain as the lens sees it: along and across its way, and toward the lens
  vec3 sv = normalize(mat3(modelViewMatrix) * uSunL);
  vec3 zv = -normalize(mv.xyz);
  vec3 xv = normalize(cross(vec3(0.0, 1.0, 0.0), zv));
  vec3 yv = cross(zv, xv);
  vec3 sun = vec3(dot(sv, xv), dot(sv, yv), dot(sv, zv));
  float knot = clamp(sun.z * 0.5 + 0.5, 0.0, 1.0) * 8.0;
  int k0 = min(int(knot), 7);
  vSun = vec4(dot(sun.xy, e), e.x * sun.y - e.y * sun.x, sun.z, 1.0 / max(mix(uGrainMean[k0], uGrainMean[k0 + 1], knot - float(k0)), 1e-3));
  // the square that holds the grain and its way: two triangles that face the lens, at the depth of the middle
  // of the grain, as large as the grain is (no limit of a card is in it). position is the corner of the square
  // (-1 or 1 across and up), vAt the pixel from the middle of the grain.
  float size = 2.0 * radius + far + 3.0;
  vec2 c = clip.xy / clip.w * uGrainView.yz;
  bool drawn = alpha > 0.004 && clip.w > 0.0 && all(lessThan(abs(c), uGrainView.yz + 0.5 * size));
  vAt = position.xy * (0.5 * size);
  gl_Position = drawn ? vec4((c + vAt) / uGrainView.yz * clip.w, clip.z, clip.w) : vec4(2.0, 2.0, 2.0, 1.0);
  vTone = vec4(col, alpha);
  vWay = vec3(e, max(far, 0.05));
  vMore = vec2(apart > 0.0 ? 3.0 : 1.0, length(mv.xyz));
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
flat in vec4 vTone;
flat in vec3 vWay;
flat in vec4 vSun;
flat in vec3 vLobe0;
flat in vec3 vLobe1;
flat in vec3 vLobe2;
flat in vec2 vMore;
in vec2 vAt;
uniform vec4 uGrainLit;
uniform vec3 uGrainLayer;
out vec4 outColor;
${DIAG_GLSL}
// the area under a ramp that rises from 0 to 1 over the width w, from its foot to u
float grainRamp(float u, float w) {
  return u <= 0.0 ? 0.0 : (u < w ? u * u / (2.0 * w) : u - 0.5 * w);
}
// How much of the pixel one ball of the grain covers, averaged over the time of the take: the ball slides by
// way along x. Across its way the ball is a band with soft ends, a pixel wide; the average over the slide is
// exact for that band. p is the pixel along and across the way from the middle of the grain. Adds the ball's
// normal at the pixel, at the moment the ball is nearest to it, to the sum.
float grainBall(vec3 lobe, vec2 p, float way, inout vec3 normals) {
  float t = p.x - lobe.x;
  float y = p.y - lobe.y;
  float dy = abs(y);
  float ro = lobe.z + 0.5;
  float ri = max(lobe.z - 0.5, 0.0);
  float outer = sqrt(max(ro * ro - dy * dy, 0.0));
  float inner = sqrt(max(ri * ri - dy * dy, 0.0));
  float w = max(outer - inner, 1e-3);
  float a = t + 0.5 * way;
  float b = t - 0.5 * way;
  float cover = clamp(ro - dy, 0.0, 1.0) * (grainRamp(a + outer, w) - grainRamp(a - inner, w) - grainRamp(b + outer, w) + grainRamp(b - inner, w)) / way;
  vec2 d = vec2(t - clamp(t, -0.5 * way, 0.5 * way), y) / max(lobe.z, 0.5);
  float z2 = max(1.0 - dot(d, d), 0.0);
  normals += (z2 + 1e-3) * cover * vec3(d, sqrt(z2));
  return cover;
}
void main() {
  vec2 p = vec2(dot(vAt, vWay.xy), vWay.x * vAt.y - vWay.y * vAt.x);
  vec3 normals = vec3(0.0);
  float cover = grainBall(vLobe0, p, vWay.z, normals);
  for (int k = 0; k < (vMore.x > 1.5 ? 1 : 0); k++) {
    cover = max(cover, grainBall(vLobe1, p, vWay.z, normals));
    cover = max(cover, grainBall(vLobe2, p, vWay.z, normals));
  }
  vec3 n = normalize(normals + vec3(0.0, 0.0, 1e-6));
  // lit as ice: the Sun's light reaches around the body, the ice around it lights the rest, and against the
  // Sun light comes through the thin rim
  float direct = max((dot(n, vSun.xyz) + uGrainLit.y) / (1.0 + uGrainLit.y), 0.0);
  float rim = 1.0 - n.z;
  float light = (uGrainLit.x + direct + uGrainLit.z * rim * rim * max(-vSun.z, 0.0)) * vSun.w;
  float alpha = vTone.a * min(cover, 1.0);
  outColor = diagOut(vec4(vTone.rgb * (light * alpha), alpha), 0.0, 0.0, uGrainLayer, vec2(0.0), vMore.y);
  if (alpha < 0.002 || (uDiag >= 2 && alpha < 0.5)) discard;
}`

// the light a ball returns on average over the disc the lens sees, for nine places of the Sun from behind
// the grain (-1) to behind the lens (1): the same law as in the shader
function lightMeans(): number[] {
  const l = spec.light
  const grid = 64
  const means: number[] = []
  for (let k = 0; k < 9; k++) {
    const sz = -1 + k / 4
    const sx = Math.sqrt(Math.max(1 - sz * sz, 0))
    let sum = 0
    let count = 0
    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const x = ((i + 0.5) / grid) * 2 - 1
        const y = ((j + 0.5) / grid) * 2 - 1
        const z2 = 1 - x * x - y * y
        if (z2 < 0) continue
        const z = Math.sqrt(z2)
        const rim = 1 - z
        sum += l.ambient + Math.max((x * sx + z * sz + l.wrap) / (1 + l.wrap), 0) + l.through * rim * rim * Math.max(-sz, 0)
        count++
      }
    }
    means.push(sum / count)
  }
  return means
}

// the rows of one level: the first row, and for every row how many of its cells may hold a grain at most
interface Rows { first: number; bound: Float32Array; seed: number }

const TAU = 2 * Math.PI
const BUCKETS = 4096

export class Grains {
  // every grain is a square of two triangles that faces the lens, one instance of the same four corners: no
  // grain is a point, so no limit of a card on the size of points is in the picture
  readonly mesh: THREE.Mesh
  // how many grains the last take drew
  drawn = 0
  private readonly geometry = new THREE.InstancedBufferGeometry()
  private readonly material: THREE.ShaderMaterial
  private readonly place: THREE.InstancedBufferAttribute
  private readonly grain: THREE.InstancedBufferAttribute
  private readonly found: Float32Array
  private readonly keys: Uint16Array
  private readonly counts = new Uint32Array(BUCKETS)
  private readonly rows: Rows[] = []
  private readonly refs: number[]
  private readonly view = new THREE.Vector3(1000, 960, 540)
  private readonly looks: THREE.Vector4[]
  private readonly shape: THREE.Vector4
  private readonly right = new THREE.Vector3()
  private readonly up = new THREE.Vector3()
  private readonly fwd = new THREE.Vector3()
  private readonly sync: number

  // shared: the uniforms of the sheet (field, ice, light). ice: the ice of the sheet, with what the levels of
  // grains amount to. sync: the radius of the orbit that keeps pace with the globe.
  constructor(shared: Record<string, THREE.IUniform>, ice: Ice, sync: number) {
    this.sync = sync
    const l = spec.levels
    this.refs = ice.levels.map((level) => level.ref)
    const total = ice.levels.reduce((sum, level, k) => sum + (l.counted[k]! > 0.5 ? level.depth : 0), 0)
    // where the sheet may hold ice: from the inner end of the model to where the ice past the rim ends
    const inner = (model.span as [number, number])[0]
    const outer = skim.outer.end[1]!
    l.name.forEach((_, k) => {
      const cell = l.cell[k]!
      const pitch = cell / l.layers[k]!
      const first = Math.floor(inner / pitch)
      const last = Math.ceil(outer / pitch)
      const bound = new Float32Array(last - first + 1)
      for (let i = first; i <= last; i++) {
        const rc = (i + 0.5) * pitch
        let deepest = 0
        for (let j = -2; j <= 2; j++) deepest = Math.max(deepest, sheetDepth(rc + (j / 2) * cell))
        bound[i - first] = l.counted[k]! > 0.5 ? Math.min((spec.bound * spec.share * deepest) / total, 1) : Math.min(deepest / l.bySheet[k]!, 1)
      }
      this.rows.push({ first, bound, seed: pcg(spec.seed + 101 * k) })
    })
    this.found = new Float32Array(spec.capacity * 7)
    this.keys = new Uint16Array(spec.capacity)
    this.place = new THREE.InstancedBufferAttribute(new Float32Array(spec.capacity * 3), 3)
    this.grain = new THREE.InstancedBufferAttribute(new Float32Array(spec.capacity * 4), 4)
    this.place.setUsage(THREE.DynamicDrawUsage)
    this.grain.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3))
    this.geometry.setIndex([0, 1, 2, 2, 1, 3])
    this.geometry.setAttribute('aPlace', this.place)
    this.geometry.setAttribute('aGrain', this.grain)
    this.geometry.instanceCount = 0
    const b = spec.lobes
    const lit = spec.light
    this.looks = l.name.map((_, k) => new THREE.Vector4(l.largest[k]![0], l.largest[k]![1], l.white[k], l.gain[k]))
    this.shape = new THREE.Vector4(b.pixels[0], b.pixels[1], Math.sqrt(ice.levels[0]!.fill), 0)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        ...shared,
        uGrainView: { value: this.view },
        uGrainLook: { value: this.looks },
        uGrainLit: { value: new THREE.Vector4(lit.ambient, lit.wrap, lit.through, lit.spread) },
        uGrainShape: { value: new THREE.Vector4(b.spread, b.first, b.radius[0], b.radius[1]! - b.radius[0]!) },
        uGrainShape2: { value: this.shape },
        uGrainFoot: { value: new THREE.Vector4(spec.foot, spec.soft, lit.layer, b.tumble) },
        uGrainMean: { value: lightMeans() },
        uGrainLift: { value: l.lift.slice() },
        uGrainLayer: { value: new THREE.Vector3().fromArray(spec.layer) },
      },
      transparent: true, depthWrite: false, depthTest: true, premultipliedAlpha: true, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 7
    this.mesh.visible = false
  }

  // The grains of one take: every grain that can show in the view of the lens, from the farthest to the
  // nearest. focal: the focal length in pixels; width and height of the picture in pixels; near: how near the
  // lens is to the sheet (0 in the hold: no grains).
  set(focal: number, width: number, height: number, near: number, lens: Lens): void {
    this.view.set(focal, width / 2, height / 2)
    // the limits of the look are shares of the height of the frame (grains.json frame): in pixels of this frame
    const scale = pixelScale(height)
    const l = spec.levels
    this.looks.forEach((look, k) => look.set(l.largest[k]![0]! * scale, l.largest[k]![1]! * scale, look.z, look.w))
    this.shape.set(spec.lobes.pixels[0]! * scale, spec.lobes.pixels[1]! * scale, this.shape.z, 0)
    this.mesh.visible = near > 0
    if (near <= 0) {
      this.drawn = 0
      this.geometry.instanceCount = 0
      return
    }
    const cam = lens.position
    const right = this.right.set(1, 0, 0).applyQuaternion(lens.quaternion)
    const up = this.up.set(0, 1, 0).applyQuaternion(lens.quaternion)
    const fwd = this.fwd.set(0, 0, -1).applyQuaternion(lens.quaternion)
    const tanX = lens.tan[0]
    const tanY = lens.tan[1]
    const foot = Math.max(Math.hypot(cam.x, cam.z), 1e-6)
    const lensTurn = Math.atan2(cam.z, cam.x) / TAU
    const found = this.found
    const keys = this.keys
    const counts = this.counts
    counts.fill(0)
    // distances are sorted by their logarithm between these two
    const nearest = 0.02
    let farthest = nearest * 2
    for (let k = 0; k < l.name.length; k++) farthest = Math.max(farthest, Math.min((this.refs[k]! * focal) / (l.pixels[k]![0]! * scale), l.reach[k]![1]!))
    const toKey = (BUCKETS - 1) / Math.log(farthest / nearest)
    let n = 0
    for (let k = 0; k < l.name.length && n < spec.capacity; k++) {
      const rows = this.rows[k]!
      const cell = l.cell[k]!
      const pitch = cell / l.layers[k]!
      const presence = l.presence[k]!
      const [lo, hi] = l.size[k] as [number, number]
      const power = l.power[k]!
      const tall = l.height[k]!
      const tallFar = l.heightFar[k]! - 1
      const highest = tall * l.heightFar[k]!
      // no grain of the level shows further than this
      const reach = Math.min((this.refs[k]! * focal) / (l.pixels[k]![0]! * scale), l.reach[k]![1]!)
      const low = Math.max(Math.abs(cam.y) - highest, 0)
      const flatReach = Math.sqrt(Math.max(reach * reach - low * low, 0))
      const room = highest + cell + 2 * hi + lens.slack
      const from = Math.max(Math.floor((foot - flatReach) / pitch), rows.first)
      const to = Math.min(Math.ceil((foot + flatReach) / pitch), rows.first + rows.bound.length - 1)
      for (let i = from; i <= to && n < spec.capacity; i++) {
        const bound = rows.bound[i - rows.first]!
        if (!(bound > 0)) continue
        const rc = (i + 0.5) * pitch
        // the part of the row that lies within reach of the lens
        const cosine = (rc * rc + foot * foot + low * low - reach * reach) / (2 * rc * foot)
        if (cosine >= 1) continue
        const arc = cosine <= -1 ? 0.5 : Math.acos(cosine) / TAU
        const cells = Math.max(Math.floor((TAU * rc) / cell), 1)
        const hr = pcg((i + rows.seed) >>> 0)
        const hc = pcg((hr + 17) >>> 0)
        // the row rides its orbit: Kepler's third law, counted from the orbit that keeps pace with the globe
        const rowTurn = -lens.turns * Math.pow(this.sync / rc, 1.5) - (hr >>> 8) / 16777216
        const j0 = Math.floor((lensTurn - arc - rowTurn) * cells)
        const count = Math.min(Math.floor((lensTurn + arc - rowTurn) * cells) - j0 + 1, cells)
        const stride = TAU / cells
        const start = ((j0 + 0.5) / cells + rowTurn) * TAU
        let cs = Math.cos(start)
        let sn = Math.sin(start)
        const cd = Math.cos(stride)
        const sd = Math.sin(stride)
        let j = ((j0 % cells) + cells) % cells
        const limit = presence * bound
        for (let step = 0; step < count; step++) {
          // the middle of the cell on the plane, seen from the lens
          const x = rc * cs - cam.x
          const z = rc * sn - cam.z
          const depth = x * fwd.x - cam.y * fwd.y + z * fwd.z
          if (depth > -room && Math.abs(x * right.x - cam.y * right.y + z * right.z) <= depth * tanX + room && Math.abs(x * up.x - cam.y * up.y + z * up.z) <= depth * tanY + room) {
            const h = pcg((j + hc) >>> 0)
            const u = (h >>> 8) / 16777216
            if (u < limit) {
              const bits = pcg((h + 1) >>> 0)
              const v = (pcg((h + 2) >>> 0) >>> 8) / 8388608 - 1
              const v2 = v * v
              const v4 = v2 * v2
              const turn = ((bits & 1023) / 1023 - 0.5) * stride
              const rr = rc + (((bits >>> 10) & 1023) / 1023 - 0.5) * cell
              const px = rr * (cs - sn * turn)
              const pz = rr * (sn + cs * turn)
              const py = tall * v * (1 + tallFar * v4 * v4)
              const size = lo + (hi - lo) * Math.pow(((bits >>> 20) & 1023) / 1023, power)
              const dx = px - cam.x
              const dy = py - cam.y
              const dz = pz - cam.z
              const deep = dx * fwd.x + dy * fwd.y + dz * fwd.z
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
              const edge = size + lens.slack + (4 * deep) / focal
              if (deep > nearest && dist < reach && Math.abs(dx * right.x + dy * right.y + dz * right.z) <= deep * tanX + edge && Math.abs(dx * up.x + dy * up.y + dz * up.z) <= deep * tanY + edge) {
                const o = n * 7
                found[o] = px
                found[o + 1] = py
                found[o + 2] = pz
                found[o + 3] = size
                found[o + 4] = u / presence
                found[o + 5] = k
                found[o + 6] = (pcg((h + 3) >>> 0) >>> 8) / 16777216
                const key = Math.min(Math.max(Math.floor(Math.log(farthest / dist) * toKey), 0), BUCKETS - 1)
                keys[n] = key
                counts[key]!++
                n++
                if (n >= spec.capacity) break
              }
            }
          }
          const next = cs * cd - sn * sd
          sn = sn * cd + cs * sd
          cs = next
          j = j + 1 < cells ? j + 1 : 0
        }
      }
    }
    // from the farthest to the nearest
    let sum = 0
    for (let b = 0; b < BUCKETS; b++) {
      const c = counts[b]!
      counts[b] = sum
      sum += c
    }
    const place = this.place.array as Float32Array
    const grain = this.grain.array as Float32Array
    for (let g = 0; g < n; g++) {
      const at = counts[keys[g]!]!++
      const o = g * 7
      place[at * 3] = found[o]!
      place[at * 3 + 1] = found[o + 1]!
      place[at * 3 + 2] = found[o + 2]!
      grain[at * 4] = found[o + 3]!
      grain[at * 4 + 1] = found[o + 4]!
      grain[at * 4 + 2] = found[o + 5]!
      grain[at * 4 + 3] = found[o + 6]!
    }
    this.place.clearUpdateRanges()
    this.place.addUpdateRange(0, n * 3)
    this.place.needsUpdate = true
    this.grain.clearUpdateRanges()
    this.grain.addUpdateRange(0, n * 4)
    this.grain.needsUpdate = true
    this.geometry.instanceCount = n
    this.drawn = n
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
