import * as THREE from 'three'
import { config } from '../config'
import type { PlaceDump } from '../diagnostics/probe'
import { FILMIC_GLSL } from '../post/chain'
import { Pass, floatTarget } from './pass'
import type { PlaceState, Pose } from './types'

export interface PlaceLayout { scale: number; left: number; right: number; bottom: number; top: number; width: number; height: number; shift: number }

export interface PlaceSize { scale?: number; margin?: number; valid?: [number, number, number, number] }

export type PlaceMatte = 'pair' | 'alpha' | 'raw'

export type PlaceMode = 'beauty' | 'texels' | 'mask' | 'picture'

export interface PlacePicture { key: string; target: THREE.WebGLRenderTarget; layout: PlaceLayout; proj: [number, number, number, number]; used: number }

export interface PlaceGeometry {
  centre: THREE.Vector3
  shift: THREE.Vector3
  delta: THREE.Vector3
  rel: THREE.Matrix3
  c: number
  radius: number
  heights: number
  distance: number
  up: THREE.Vector3
  sinDipTwin: number
  sinDip: number
  limb: THREE.Vector3
  limbDip: number
  reach: number
  hold: [number, number]
  // The lap of the ball at its limb, in the units of c: a ray whose b * b - c lies between 0 and this passes the limb of the sphere so
  // close that the mesh of the globe may or may not be there (under the sphere when positive, over it when negative). Read by lapOf.
  lap: number
}

const MODES: Record<PlaceMode, number> = { beauty: 0, texels: 1, mask: 2, picture: 3 }
const KEPT = 2
const TONE_TAPS = 64
const TONE_GLOBE = 4
const TONE_OWN = 5

export function placeLayout(format: { width: number; height: number }, size: PlaceSize, maxEdge: number): PlaceLayout {
  const c = config.raw.handover.place
  const W = format.width
  const H = format.height
  const half = (size.margin ?? c.margin) / 2
  const sides = size.valid ?? [half, half, half, half]
  const px = (share: number, of: number): number => Math.max(size.valid ? Math.ceil(share * of - 1e-9) : Math.round(share * of), 1)
  const left = px(sides[0], W)
  const right = px(sides[1], W)
  const bottom = px(sides[2], H)
  const top = px(sides[3], H)
  if (left + right > c.maxShare * W + 1 || bottom + top > c.maxShare * H + 1) throw new Error('the margins of the place picture are wider than handover.place.maxShare allows')
  const edge = Math.max(W + left + right, H + bottom + top)
  const limit = Math.min(c.maxEdge, maxEdge)
  let scale = Math.max(Math.floor(size.scale ?? c.scale), 1)
  while (scale > 1 && edge * scale > limit) scale--
  if (edge * scale > limit) throw new Error('the place picture needs an edge of ' + edge * scale + ', the limit is ' + limit)
  return { scale, left, right, bottom, top, width: (W + left + right) * scale, height: (H + bottom + top) * scale, shift: scale % 2 === 0 ? 0.5 : 0 }
}

// How far the feather of each side of the picture reaches in over the frame, in texels of the picture: left, right, bottom, top.
// A picture that comes in with a weight by time alone shows its sides as straight lines wherever the ground under it is not quite
// the same ground. With edgeIn the picture comes in from the place outward: while its weight is low the feather of a side reaches
// in over the frame by that side's share of the frame's width or height, and it draws back to the margin as the weight goes to 1.
// At T the weight is 1 and the reach is 0, so the two sides stay equal there. All four shares 0 is the pass as it was.
export function edgeReach(place: Pick<PlaceState, 'weight' | 'edgeIn'>, layout: PlaceLayout): [number, number, number, number] {
  const share = place.edgeIn ?? config.raw.handover.place.edgeIn
  const open = 1 - Math.min(Math.max(place.weight, 0), 1)
  const width = layout.width - (layout.left + layout.right) * layout.scale
  const height = layout.height - (layout.bottom + layout.top) * layout.scale
  return [share[0] * open * width, share[1] * open * width, share[2] * open * height, share[3] * open * height]
}

// How far the picture's own broad tone stays back from each side of the picture, in texels of the picture: left, right, bottom, top.
// The picture and the globe under it are seldom of one tone, and a picture that brings its own tone with it stands on the globe as an
// island with a rim. With toneIn the picture is split in two: its detail comes in as before, its broad tone (a wide blur of the frame)
// is the globe's own near the picture's sides and the picture's only toward its middle, over a feather far wider than the one of the
// detail. The reach of that feather is the side's share of the frame times what is missing of the weight raised to
// handover.place.tonePower: 0 at T, where the weight is 1 and the picture is itself, so the two sides stay equal there. All four
// shares 0 is the pass as it was, with no tone pass at all.
export function toneReach(place: Pick<PlaceState, 'weight' | 'toneIn'>, layout: PlaceLayout): [number, number, number, number] {
  const c = config.raw.handover.place
  const share = place.toneIn ?? c.toneIn
  const open = Math.pow(1 - Math.min(Math.max(place.weight, 0), 1), c.tonePower)
  const width = layout.width - (layout.left + layout.right) * layout.scale
  const height = layout.height - (layout.bottom + layout.top) * layout.scale
  return [share[0] * open * width, share[1] * open * width, share[2] * open * height, share[3] * open * height]
}

// The grid of the tone pass: cells of handover.place.toneCell frame pixels, and the blur of handover.place.toneReach of the frame's
// height (one sigma) counted in cells, with the taps it takes on each side.
export function toneGrid(width: number, height: number): { cols: number; rows: number; sigma: number; taps: number } {
  const c = config.raw.handover.place
  const cols = Math.max(Math.ceil(width / c.toneCell), 1)
  const rows = Math.max(Math.ceil(height / c.toneCell), 1)
  const sigma = Math.max((c.toneReach * height) / c.toneCell, 1e-3)
  return { cols, rows, sigma, taps: Math.min(Math.ceil(3 * sigma), TONE_TAPS) }
}

export function placeCamera(cam: THREE.PerspectiveCamera, format: { width: number; height: number }, layout: PlaceLayout, pose: Pose, near: number, far: number): void {
  const s = layout.scale
  cam.fov = pose.vfov
  cam.aspect = format.width / format.height
  cam.near = near
  cam.far = far
  cam.setViewOffset(format.width * s, format.height * s, -(layout.left * s + layout.shift), -(layout.top * s + layout.shift), layout.width, layout.height)
  cam.position.set(0, 0, 0)
  cam.quaternion.copy(pose.quaternion)
  cam.updateProjectionMatrix()
  cam.updateMatrixWorld(true)
}

export function placeGeometry(camera: Pose, place: Pick<PlaceState, 'twin' | 'centre' | 'radius' | 'limbReachDeg' | 'limbHoldDeg' | 'limbLap'>): PlaceGeometry {
  const back = camera.quaternion.clone().invert()
  const o = place.centre.clone().sub(camera.position)
  const distance = o.length()
  const r = place.radius
  const shiftWorld = place.twin.position.clone().sub(camera.position)
  const tc = place.twin.position.clone().sub(place.centre)
  const twinDistance = tc.length()
  const heightTwin = twinDistance - r
  const height = distance - r
  const sinDipTwin = Math.sqrt(Math.max(1 - (r / Math.max(twinDistance, 1e-30)) ** 2, 0))
  const sinDip = Math.sqrt(Math.max(1 - (r / Math.max(distance, 1e-30)) ** 2, 0))
  const upTwin = tc.clone().divideScalar(Math.max(twinDistance, 1e-30))
  const band = place.limbHoldDeg ?? config.raw.handover.place.limbHoldDeg
  const lap = place.limbLap ?? config.raw.handover.place.limbLap
  return {
    centre: o.clone().applyQuaternion(back),
    shift: shiftWorld.clone().applyQuaternion(back),
    delta: shiftWorld.clone().applyQuaternion(place.twin.quaternion.clone().invert()),
    rel: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(place.twin.quaternion.clone().invert().multiply(camera.quaternion))),
    c: height * (distance + r),
    radius: r,
    heights: heightTwin > 0 ? height / heightTwin : 1,
    distance,
    up: upTwin.clone().applyQuaternion(back),
    sinDipTwin,
    sinDip,
    limb: o.clone().divideScalar(-Math.max(distance, 1e-30)).sub(upTwin).applyQuaternion(back),
    limbDip: sinDip - sinDipTwin,
    reach: Math.sin(THREE.MathUtils.degToRad(place.limbReachDeg ?? config.raw.handover.place.limbReachDeg)),
    hold: [Math.sin(THREE.MathUtils.degToRad(band[0]!)), Math.sin(THREE.MathUtils.degToRad(band[1]!))],
    lap: r * r * lap * (2 - lap),
  }
}

// Where the sky ends for a picture with a horizon of its own, in the units of c: a ray is of the sky unless its b * b - c is above this.
// In the lap of the ball the frame itself tells: where something has written depth (drawn) the globe is there and the ray is ground,
// where nothing has, the ray is sky. So a pixel nobody drew counts the lap under the sphere as sky, and a drawn pixel counts the lap
// over the sphere as ground. A globe that writes no depth is sky throughout a lap under its sphere.
export function lapOf(g: PlaceGeometry, drawn: boolean): number {
  return drawn ? Math.min(g.lap, 0) : Math.max(g.lap, 0)
}

// sky: the ray is of the sky for a picture with a horizon of its own (lapOf), at a pixel where something has written depth (drawn) or
// where nothing has.
export function placeUv(g: PlaceGeometry, proj: [number, number, number, number], ray: THREE.Vector3, drawn = false): { uv: [number, number]; hit: boolean; sky: boolean; front: boolean; honest: number; hold: number; dir: THREE.Vector3 } {
  const d = ray.clone().normalize()
  const b = d.dot(g.centre)
  const disc = b * b - g.c
  const hit = disc > 0 && b > 0
  let q: THREE.Vector3
  let honest: number
  let hold = 0
  if (hit) {
    const t = g.c / (b + Math.sqrt(disc))
    const p = d.clone().multiplyScalar(t)
    const n = p.clone().sub(g.centre).divideScalar(g.radius)
    const own = (g.c - t * b) / g.radius
    honest = ((own + n.dot(g.shift)) / Math.max(own, 1e-30)) * g.heights
    if (g.reach > 0) {
      const rim = n.dot(g.up)
      const brink = Math.sqrt(Math.max(1 - g.sinDipTwin * g.sinDipTwin, 0))
      if (rim < brink) {
        const level = n.clone().addScaledVector(g.up, -rim)
        const at = g.up.clone().multiplyScalar(brink).addScaledVector(level, g.sinDipTwin / Math.max(level.length(), 1e-12))
        p.copy(g.centre).addScaledVector(at, g.radius)
      }
      const x = Math.min(Math.max((b / g.distance - g.sinDip - g.hold[0]) / (g.hold[1] - g.hold[0]), 0), 1)
      hold = 1 - x * x * (3 - 2 * x)
    }
    q = p.applyMatrix3(g.rel).sub(g.delta)
  } else {
    const own = g.sinDip - b / g.distance
    const s = d.dot(g.up)
    if (g.reach > 0) {
      const gap = d.dot(g.limb) + g.limbDip
      const x = Math.min(Math.max(own / Math.max(g.reach, 2 * Math.abs(gap)), 0), 1)
      const lift = gap * (1 - x * x * (3 - 2 * x))
      const s2 = s + lift
      const level = Math.sqrt(Math.max(1 - s * s, 0))
      const along = d.clone().addScaledVector(g.up, -s).divideScalar(Math.max(level, 1e-6))
      d.addScaledVector(g.up, lift).addScaledVector(along, Math.sqrt(Math.max(1 - s2 * s2, 0)) - level)
      honest = 1
    } else honest = (s + g.sinDipTwin) / Math.max(own, 1e-30)
    q = d.applyMatrix3(g.rel)
  }
  const front = -q.z > 0
  const w = Math.max(-q.z, 1e-30)
  return { uv: [((proj[0] * q.x + proj[2] * q.z) / w) * 0.5 + 0.5, ((proj[1] * q.y + proj[3] * q.z) / w) * 0.5 + 0.5], hit, sky: !(disc > lapOf(g, drawn) && b > 0), front, honest, hold, dir: q }
}

// Where the place pass reads the picture for a ray of the sky when the picture's horizon runs on the clock of the sky (limbSky): what
// the shader does in VEIL_SIDE. A ray of the sky is one that passes the ball less its lap at a pixel nobody drew (sky of placeUv, drawn
// as there). Inside the picture it is the ray's own place, and for a ray in the lap, which meets the sphere but not the mesh of the
// globe, the place a ray of the sky reaches as it comes down onto the limb: the picture's horizon in the ray's own direction. A ray
// that leaves the picture by a side, or looks away from it, is turned about the line to the centre of the body until it meets the
// nearer side of the picture, so it reads that side at its own height over the horizon: the haze goes on along the limb at the height
// it has in the picture. Above the top of the picture it reads the top row. size is the picture's size in texels.
export function horizonUv(g: PlaceGeometry, proj: [number, number, number, number], ray: THREE.Vector3, size: { width: number; height: number }, drawn = false): { uv: [number, number]; front: boolean } {
  const got = placeUv(g, proj, ray, drawn)
  const brim: [number, number] = [0.5 / size.width, 0.5 / size.height]
  let [u, v] = got.uv
  let front = got.front
  let dir = got.dir
  if (got.sky && got.hit) {
    const d = ray.clone().normalize()
    const s = d.dot(g.up)
    const along = d.addScaledVector(g.up, -s).multiplyScalar(Math.sqrt(Math.max(1 - g.sinDipTwin * g.sinDipTwin, 0)) / Math.max(Math.sqrt(Math.max(1 - s * s, 0)), 1e-6))
    dir = along.addScaledVector(g.up, -g.sinDipTwin).applyMatrix3(g.rel)
    front = -dir.z > 0
    const w = Math.max(-dir.z, 1e-30)
    u = ((proj[0] * dir.x + proj[2] * dir.z) / w) * 0.5 + 0.5
    v = ((proj[1] * dir.y + proj[3] * dir.z) / w) * 0.5 + 0.5
  }
  if (!front || u < brim[0] || u > 1 - brim[0]) {
    const q = dir.clone().normalize()
    const side = (front ? u > 0.5 : q.x > 0) ? 1 - brim[0] : brim[0]
    const up = g.up.clone().applyMatrix3(g.rel)
    const n = new THREE.Vector3(proj[0], 0, proj[2] + 2 * side - 1)
    const s = q.dot(up)
    const c = Math.sqrt(Math.max(1 - s * s, 0))
    const nu = n.dot(up)
    const level = n.clone().addScaledVector(up, -nu)
    const m = Math.max(level.length(), 1e-9)
    const a = level.divideScalar(m)
    const b = new THREE.Vector3().crossVectors(up, a)
    const ct = Math.min(Math.max((-s * nu) / Math.max(c * m, 1e-9), -1), 1)
    const base = up.clone().multiplyScalar(s).addScaledVector(a, ct * c)
    const turn = b.multiplyScalar(Math.sqrt(1 - ct * ct) * c)
    const one = base.clone().add(turn)
    const two = base.clone().sub(turn)
    const r = one.z < two.z ? one : two
    front = -r.z > 0
    const w = Math.max(-r.z, 1e-30)
    u = ((proj[0] * r.x + proj[2] * r.z) / w) * 0.5 + 0.5
    v = ((proj[1] * r.y + proj[3] * r.z) / w) * 0.5 + 0.5
  }
  return { uv: [Math.min(Math.max(u, brim[0]), 1 - brim[0]), Math.min(Math.max(v, brim[1]), 1 - brim[1])], front }
}

// The weight of the place pass on one ray when the picture's horizon runs on the clock of the sky (limbSky): what the shader does with
// uVeil. ground is the weight the pass gives the ray by the picture's own rules, and a ray that meets the ball less its lap keeps it. A
// ray of the sky (sky of placeUv) takes the weight of the horizon and nothing else; front is then the one of horizonUv. Without a
// horizon in the state it is ground.
export function horizonK(place: Pick<PlaceState, 'horizon'>, ray: { sky: boolean; front: boolean }, ground: number): number {
  if (place.horizon === undefined || !ray.sky) return ground
  return ray.front ? place.horizon : 0
}

export function placeSkyGrad(g: PlaceGeometry, proj: [number, number, number, number], ray: THREE.Vector3, step: [number, number]): { dx: [number, number]; dy: [number, number] } {
  const w = ray.clone().applyMatrix3(g.rel)
  const e = g.rel.elements
  const den = Math.max(-w.z, 1e-30)
  const num: [number, number] = [proj[0] * w.x + proj[2] * w.z, proj[1] * w.y + proj[3] * w.z]
  const along = (ax: number, ay: number, az: number, by: number): [number, number] => [
    (0.5 * ((proj[0] * ax + proj[2] * az) * den + num[0] * az) * by) / (den * den),
    (0.5 * ((proj[1] * ay + proj[3] * az) * den + num[1] * az) * by) / (den * den),
  ]
  return { dx: along(e[0]!, e[1]!, e[2]!, step[0]), dy: along(e[3]!, e[4]!, e[5]!, step[1]) }
}

const COPY = /* glsl */ `
precision highp float;
uniform sampler2D uFrom;
in vec2 vUv;
out vec4 outColor;
void main() {
  outColor = texture(uFrom, vUv);
}`

const PACK = /* glsl */ `
precision highp float;
uniform sampler2D uBlack;
uniform sampler2D uWhite;
uniform float uPair;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 k = texture(uBlack, vUv);
  vec3 through = texture(uWhite, vUv).rgb - k.rgb;
  float solid = uPair > 0.5 ? 1.0 - (through.r + through.g + through.b) / 3.0 : k.a;
  outColor = vec4(k.rgb, uPair > 1.5 ? k.a : clamp(solid, 0.0, 1.0));
}`

// The tone pass of the place picture. The same shader as the picture's own with three additions, so that a film in which no stop asks
// for toneIn compiles and runs the shader exactly as it was.
// uCell: frame pixels along one side of a cell of the tone pass (1 when the picture itself is drawn). The rates of the picture along the
// frame are taken per frame pixel whatever the pass, so the weight of a cell is the weight of the frame pixels in it.
// Mode 4 writes, per cell, the frame under the picture times how far the picture counts there, and that share itself; mode 5 the same of
// the picture. Blurred, colour over share is the broad tone of each. The picture is then moved from its own tone to the globe's channel by
// channel: what lies under the picture's own tone is scaled by the ratio of the two, so the shadows keep their depth against what is around
// them, and what lies over it is shifted by their difference, so the lights keep their height over it. The two meet at the tone itself, and
// neither can go under zero nor over what the picture had plus the globe's tone.
// land: the tone is the ground's alone. A ray that misses the ball counts for nothing in either tone and is lent nothing, and a ray
// that meets it counts by how far under the horizon it does, from nothing at the first angle of handover.place.toneLandDeg to all at
// the second: the sky and the haze over the horizon stay the picture's own, the dark of the sky does not leak into the tone of the far
// field, and the far field comes to the globe's tone over a band wide enough to show no line along the horizon.
const TONE_UNIFORMS = /* glsl */ `
uniform sampler2D uUnder;
uniform sampler2D uTone;
uniform sampler2D uOwn;
uniform vec4 uToneFeather;
uniform vec2 uPixel;
uniform vec2 uLand;
uniform float uCell;`

const TONE_CELL = /* glsl */ `  dx /= uCell;
  dy /= uCell;
`

const TONE_SPLIT = /* glsl */ `  float land = disc > 0.0 && b > 0.0 ? smoothstep(uLand.x, uLand.y, b / uBall.w - uSinDip) : 0.0;
  if (mode >= 4) {
    float counts = uLimits.x > 0.0 ? clamp(k / uLimits.x, 0.0, 1.0) * land : 0.0;
    vec3 cell = col;
    if (mode == 4) {
      cell = vec3(0.0);
      for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) cell += texture(uUnder, vUv + ((vec2(float(i), float(j)) + 0.5) * 0.25 - 0.5) * uCell * uPixel).rgb;
      cell /= 16.0;
    }
    outColor = vec4(max(cell, vec3(0.0)) * counts, counts);
    return;
  }
  if (mode == 0) {
    vec4 wide = clamp((vec4(pt.x, uSize.x - pt.x, pt.y, uSize.y - pt.y) - 0.5) * uToneFeather, 0.0, 1.0);
    wide = wide * wide * (3.0 - 2.0 * wide);
    float lent = (1.0 - wide.x * wide.y * wide.z * wide.w) * land;
    vec4 globe = texture(uTone, vUv);
    vec4 own = texture(uOwn, vUv);
    vec3 mine = own.rgb / max(own.a, 1e-4);
    vec3 theirs = globe.rgb / max(globe.a, 1e-4);
    col = mix(col, mix(col + theirs - mine, col * theirs / max(mine, vec3(1e-6)), vec3(lessThanEqual(col, mine))), lent);
  }
`

const BLUR = /* glsl */ `
precision highp float;
uniform sampler2D uFrom;
uniform vec2 uStep;
uniform float uSigma;
uniform int uTaps;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 sum = texture(uFrom, vUv);
  float total = 1.0;
  float fall = -0.5 / (uSigma * uSigma);
  for (int i = 1; i <= uTaps; i++) {
    float w = exp(float(i * i) * fall);
    vec2 a = vUv + uStep * float(i);
    vec2 b = vUv - uStep * float(i);
    if (a.x < 1.0 && a.y < 1.0) {
      sum += texture(uFrom, a) * w;
      total += w;
    }
    if (b.x > 0.0 && b.y > 0.0) {
      sum += texture(uFrom, b) * w;
      total += w;
    }
  }
  outColor = sum / total;
}`

// The horizon of the picture on the clock of the sky (limbSky). Two additions to the shader, so that a film in which no stop asks for it
// compiles and runs the shader exactly as it was.
// A ray that misses the ball is the picture's sky: the haze over the horizon with the frame's own stars behind it. It takes uVeil.x, the
// weight of the horizon, alone: not the weight of the picture, not its sides, not its limits of enlargement and not the land matte.
// The ground keeps the picture's own weight, the band under the limb too: the picture's horizon row held there at the weight of the sky
// stood on the globe as a stripe (Mars, 21:20). The ball is taken less its lap (uVeil.y, in the units of disc): the mesh of a globe lies
// a little inside its sphere, and without the lap the globe's own sky, at its brightest on the limb, showed as a line of 1 to 2 px
// between the sky and the ground (Mars, 21:30). In the lap the mesh is there in one pixel and not in the next, and the picture's horizon
// at the weight of the sky on the globe's ground is a line too, a darker one (Mars, 22:05). So the pass is drawn twice, each pixel
// once: where nothing has written depth with the lap under the sphere as sky, where something has with the lap over the sphere as
// ground (lapOf); the shader writes the far depth for that test. A ray in the lap reads the picture's horizon in its own direction, the
// place a ray of the sky reaches as it comes down onto the limb. A ray of the sky that leaves the picture by a side, or looks away from
// it, is turned about the line to the centre of the body until it meets the nearer side, so it reads that side at its own height over
// the horizon; above the top of the picture it reads the top row. So the haze goes on along the limb and up the sky and does not end
// on a line.
const VEIL_UNIFORMS = /* glsl */ `
uniform vec2 uVeil;`

const VEIL_SIDE = /* glsl */ `  bool over = !(disc > uVeil.y && b > 0.0);
  if (mode != 3 && over) {
    vec2 brim = vec2(0.5) / uSize;
    if (disc > 0.0 && b > 0.0) {
      float hLow = dot(d, uHorizon.xyz);
      q = uRel * (uHorizon.xyz * -uHorizon.w + (d - uHorizon.xyz * hLow) * (sqrt(max(1.0 - uHorizon.w * uHorizon.w, 0.0)) / max(sqrt(max(1.0 - hLow * hLow, 0.0)), 1e-6)));
      front = -q.z > 0.0 ? 1.0 : 0.0;
      uv = (uProj.xy * q.xy + uProj.zw * q.z) / max(-q.z, 1e-30) * 0.5 + 0.5;
    }
    if (front < 0.5 || uv.x < brim.x || uv.x > 1.0 - brim.x) {
      float hSide = (front > 0.5 ? uv.x > 0.5 : q.x > 0.0) ? 1.0 - brim.x : brim.x;
      vec3 hUp = uRel * uHorizon.xyz;
      vec3 hN = vec3(uProj.x, 0.0, uProj.z + 2.0 * hSide - 1.0);
      vec3 hQ = normalize(q);
      float hS = dot(hQ, hUp);
      float hC = sqrt(max(1.0 - hS * hS, 0.0));
      float hNu = dot(hN, hUp);
      vec3 hLevel = hN - hUp * hNu;
      float hM = max(length(hLevel), 1e-9);
      vec3 hA = hLevel / hM;
      float hCt = clamp(-hS * hNu / max(hC * hM, 1e-9), -1.0, 1.0);
      vec3 hBase = hUp * hS + hA * (hCt * hC);
      vec3 hTurn = cross(hUp, hA) * (sqrt(1.0 - hCt * hCt) * hC);
      vec3 hR = (hBase + hTurn).z < (hBase - hTurn).z ? hBase + hTurn : hBase - hTurn;
      front = -hR.z > 0.0 ? 1.0 : 0.0;
      uv = (uProj.xy * hR.xy + uProj.zw * hR.z) / max(-hR.z, 1e-30) * 0.5 + 0.5;
    }
    uv = clamp(uv, brim, vec2(1.0) - brim);
  }
`

const VEIL_WEIGHT = /* glsl */ `  if (mode != 3 && over) k = uVeil.x * front;
  gl_FragDepth = 1.0;
`

const lay = (tone: boolean, veil = false): string => /* glsl */ `
precision highp float;
uniform sampler2D uPicture;
uniform sampler2D uSky;
uniform vec2 uSize;
uniform vec4 uRay;
uniform vec4 uProj;
uniform mat3 uRel;
uniform vec3 uDelta;
uniform vec3 uShift;
uniform vec3 uCentre;
uniform vec4 uBall;
uniform vec4 uHorizon;
uniform float uSinDip;
uniform vec4 uLimb;
uniform vec2 uReach;
uniform vec2 uHold;
uniform vec4 uFeather;
uniform vec4 uLimits;
uniform vec4 uLens;
uniform vec2 uScale;
uniform vec4 uDump;
uniform float uDumpAs;
uniform sampler2D uMatte;
uniform float uMatteOn;${tone ? TONE_UNIFORMS : ''}${veil ? VEIL_UNIFORMS : ''}
in vec2 vUv;
out vec4 outColor;
${FILMIC_GLSL}
void main() {
  int mode = int(uScale.y + 0.5);
  vec2 ndc = vUv * 2.0 - 1.0;
  vec3 d = normalize(vec3(ndc.x * uRay.x + uRay.z, ndc.y * uRay.y + uRay.w, -1.0));
  float b = dot(d, uCentre);
  float disc = b * b - uBall.x;
  vec3 q;
  vec3 plain;
  float honest;
  float hold = 0.0;
  bool aloft = false;
  if (disc > 0.0 && b > 0.0) {
    float t = uBall.x / (b + sqrt(disc));
    vec3 p = d * t;
    vec3 n = (p - uCentre) / uBall.y;
    float own = (uBall.x - t * b) / uBall.y;
    honest = (own + dot(n, uShift)) / max(own, 1e-30) * uBall.z;
    q = uRel * p - uDelta;
    plain = q;
    if (uReach.y > 0.5) {
      float rim = dot(n, uHorizon.xyz);
      float brink = sqrt(max(1.0 - uHorizon.w * uHorizon.w, 0.0));
      if (rim < brink) {
        vec3 level = n - uHorizon.xyz * rim;
        q = uRel * (uCentre + (uHorizon.xyz * brink + level * (uHorizon.w / max(length(level), 1e-12))) * uBall.y) - uDelta;
        aloft = true;
      }
      hold = 1.0 - smoothstep(uHold.x, uHold.y, b / uBall.w - uSinDip);
    }
  } else {
    float own = uSinDip - b / uBall.w;
    float s = dot(d, uHorizon.xyz);
    float gap = dot(d, uLimb.xyz) + uLimb.w;
    float lift = gap * (1.0 - smoothstep(0.0, 1.0, own / max(uReach.x, 2.0 * abs(gap))));
    float s2 = s + lift;
    float level = sqrt(max(1.0 - s * s, 0.0));
    vec3 e = d + uHorizon.xyz * lift + (d - uHorizon.xyz * s) / max(level, 1e-6) * (sqrt(max(1.0 - s2 * s2, 0.0)) - level);
    honest = uReach.y > 0.5 ? 1.0 : (s + uHorizon.w) / max(own, 1e-30);
    q = uRel * e;
    plain = uRel * d;
    aloft = uReach.y > 0.5;
  }
  float front = -q.z > 0.0 ? 1.0 : 0.0;
  vec2 uv = (uProj.xy * q.xy + uProj.zw * q.z) / max(-q.z, 1e-30) * 0.5 + 0.5;
  vec2 held = (uProj.xy * plain.xy + uProj.zw * plain.z) / max(-plain.z, 1e-30) * 0.5 + 0.5;
  if (mode == 3) {
    uv = uDumpAs > 0.5 ? vec2(uDump.x + vUv.x * uDump.z, uSize.y - uDump.y - (1.0 - vUv.y) * uDump.w) / uSize : vUv;
    held = uv;
    front = 1.0;
    honest = 1.0;
  }
  vec2 pt = uv * uSize;
  vec2 dx = dFdx(held * uSize);
  vec2 dy = dFdy(held * uSize);
  vec2 step = vec2(dFdx(vUv.x), dFdy(vUv.y)) * 2.0 * uRay.xy;
  if (aloft && mode != 3) {
    vec3 w = uRel * vec3(ndc.x * uRay.x + uRay.z, ndc.y * uRay.y + uRay.w, -1.0);
    vec3 wx = uRel[0] * step.x;
    vec3 wy = uRel[1] * step.y;
    vec2 num = uProj.xy * w.xy + uProj.zw * w.z;
    float den = max(-w.z, 1e-30);
    dx = 0.5 * ((uProj.xy * wx.xy + uProj.zw * wx.z) * den + num * wx.z) / (den * den) * uSize;
    dy = 0.5 * ((uProj.xy * wy.xy + uProj.zw * wy.z) * den + num * wy.z) / (den * den) * uSize;
  }
${tone ? TONE_CELL : ''}  vec4 edge = clamp((vec4(pt.x, uSize.x - pt.x, pt.y, uSize.y - pt.y) - 0.5) * uFeather, 0.0, 1.0);
  edge = edge * edge * (3.0 - 2.0 * edge);
  float s1 = dot(dx, dx) + dot(dy, dy);
  float det = dx.x * dy.y - dx.y * dy.x;
  float least = sqrt(max(0.5 * (s1 - sqrt(max(s1 * s1 - 4.0 * det * det, 0.0))), 1e-12));
  float sharp = 1.0 - smoothstep(uLimits.z, uLimits.z * (1.0 + uLimits.w), uScale.x / least);
  float k = uLimits.x * front * edge.x * edge.y * edge.z * edge.w * smoothstep(0.0, uLimits.y, honest) * (mode == 3 ? 1.0 : sharp);
  if (hold > 0.0) k = max(k, uLimits.x * front * edge.x * edge.y * edge.z * edge.w * hold);
  float most = max(length(dx), length(dy)) * uLens.z;
  float fit = min(1.0, uLens.w / max(most, 1e-9)) * uLens.z;
${tone ? '  fit *= uCell;\n' : ''}${veil ? VEIL_SIDE : ''}  vec4 pic = textureGrad(uPicture, uv, dx / uSize * fit, dy / uSize * fit);
  if (uMatteOn > 0.5) k *= textureGrad(uMatte, uv, dx / uSize * fit, dy / uSize * fit).r;
${veil ? VEIL_WEIGHT : ''}  if (mode == 1) {
    if (k <= 0.5) discard;
    float texels = min(pic.r * 2.0, 1.0) * sqrt(max(dot(dx, dx), dot(dy, dy)));
    outColor = vec4(clamp(texels * 0.5, 0.0, 1.0), pic.g, 0.0, 1.0);
    return;
  }
  if (mode == 2) {
    outColor = vec4(k, k, k, 1.0);
    return;
  }
  if (mode == 3 && uDumpAs > 0.5) {
    bool inside = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
    vec3 seen = uDumpAs > 1.5 ? vec3(pic.a) : filmic(pic.rgb / max(pic.a, 1e-3));
    outColor = vec4(inside ? seen : vec3(0.0), 1.0);
    return;
  }
  vec2 lq = (vUv - 0.5) * vec2(uLens.y, 1.0);
  float undo = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(lq, lq) * 0.9, 2.0), uLens.x);
  vec3 col = texture(uSky, vUv).rgb * (1.0 - pic.a) + pic.rgb * undo;
${tone ? TONE_SPLIT : ''}  outColor = vec4(col * k, k);
}`

function layUniforms(): Record<string, THREE.IUniform> {
  return {
    uPicture: { value: null }, uSky: { value: null }, uSize: { value: new THREE.Vector2(1, 1) }, uRay: { value: new THREE.Vector4() }, uProj: { value: new THREE.Vector4() },
    uRel: { value: new THREE.Matrix3() }, uDelta: { value: new THREE.Vector3() }, uShift: { value: new THREE.Vector3() }, uCentre: { value: new THREE.Vector3() }, uBall: { value: new THREE.Vector4() },
    uHorizon: { value: new THREE.Vector4() }, uSinDip: { value: 0 }, uLimb: { value: new THREE.Vector4() }, uReach: { value: new THREE.Vector2(1, 0) }, uHold: { value: new THREE.Vector2(0, 1) }, uFeather: { value: new THREE.Vector4() }, uLimits: { value: new THREE.Vector4() }, uLens: { value: new THREE.Vector4() }, uScale: { value: new THREE.Vector2(1, 0) },
    uDump: { value: new THREE.Vector4() }, uDumpAs: { value: 0 }, uMatte: { value: null }, uMatteOn: { value: 0 },
  }
}

function toneUniforms(): Record<string, THREE.IUniform> {
  return { uUnder: { value: null }, uTone: { value: null }, uOwn: { value: null }, uToneFeather: { value: new THREE.Vector4() }, uPixel: { value: new THREE.Vector2() }, uLand: { value: new THREE.Vector2() }, uCell: { value: 1 } }
}

const LAY_BLEND: Partial<THREE.ShaderMaterialParameters> = { transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }

export class Place {
  readonly camera = new THREE.PerspectiveCamera()
  private black: THREE.WebGLRenderTarget | null = null
  private white: THREE.WebGLRenderTarget | null = null
  private sky: THREE.WebGLRenderTarget | null = null
  private readonly pictures: PlacePicture[] = []
  private clock = 0
  private readonly copy = new Pass(COPY, { uFrom: { value: null } }, { blending: THREE.NoBlending })
  private readonly pack = new Pass(PACK, { uBlack: { value: null }, uWhite: { value: null }, uPair: { value: 1 } }, { blending: THREE.NoBlending })
  private readonly lay = new Pass(lay(false), layUniforms(), LAY_BLEND)
  private split: Pass | null = null
  private veil: Pass | null = null
  private veilSplit: Pass | null = null
  private blur: Pass | null = null
  private toneGlobe: THREE.WebGLRenderTarget | null = null
  private toneOwn: THREE.WebGLRenderTarget | null = null
  private toneHalf: THREE.WebGLRenderTarget | null = null

  find(key: string): PlacePicture | null {
    const hit = this.pictures.find((p) => p.key === key) ?? null
    if (hit) hit.used = ++this.clock
    return hit
  }

  private raw(old: THREE.WebGLRenderTarget | null, layout: PlaceLayout): THREE.WebGLRenderTarget {
    if (old && old.width === layout.width && old.height === layout.height) return old
    old?.dispose()
    const t = floatTarget(layout.width, layout.height, THREE.FloatType, true, false)
    t.texture.minFilter = t.texture.magFilter = THREE.NearestFilter
    return t
  }

  build(r: THREE.WebGLRenderer, key: string, layout: PlaceLayout, matte: PlaceMatte, keep: boolean, anisotropy: number, draw: (target: THREE.WebGLRenderTarget, white: boolean) => void): PlacePicture {
    let pic = this.pictures.find((p) => p.key === key) ?? null
    if (!pic) {
      if (this.pictures.length >= KEPT) {
        this.pictures.sort((a, b) => a.used - b.used)
        this.pictures.shift()!.target.dispose()
      }
      const target = floatTarget(layout.width, layout.height, THREE.HalfFloatType, false, false)
      target.texture.minFilter = THREE.LinearMipmapLinearFilter
      target.texture.generateMipmaps = true
      target.texture.anisotropy = anisotropy
      pic = { key, target, layout, proj: [0, 0, 0, 0], used: 0 }
      this.pictures.push(pic)
    }
    pic.used = ++this.clock
    this.black = this.raw(this.black, layout)
    draw(this.black, false)
    const pair = matte === 'pair'
    if (pair) {
      this.white = this.raw(this.white, layout)
      draw(this.white, true)
    }
    const u = this.pack.material.uniforms
    u.uBlack!.value = this.black.texture
    u.uWhite!.value = pair ? this.white!.texture : this.black.texture
    u.uPair!.value = matte === 'pair' ? 1 : matte === 'raw' ? 2 : 0
    this.pack.render(r, pic.target)
    const e = this.camera.projectionMatrix.elements
    pic.proj = [e[0]!, e[5]!, e[8]!, e[9]!]
    if (!keep) this.release()
    return pic
  }

  private release(): void {
    this.black?.dispose()
    this.white?.dispose()
    this.black = null
    this.white = null
  }

  keepSky(r: THREE.WebGLRenderer, from: THREE.WebGLRenderTarget): void {
    if (!this.sky || this.sky.width !== from.width || this.sky.height !== from.height) {
      this.sky?.dispose()
      this.sky = floatTarget(from.width, from.height, THREE.HalfFloatType, false, false)
      this.sky.texture.minFilter = this.sky.texture.magFilter = THREE.NearestFilter
    }
    this.copy.material.uniforms.uFrom!.value = from.texture
    this.copy.render(r, this.sky)
  }

  render(r: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, pic: PlacePicture, place: PlaceState, camera: Pose, frame: THREE.PerspectiveCamera, mode: PlaceMode, vignette: number, aspect: number, grad: number, dump?: PlaceDump, matte: THREE.Texture | null = null): void {
    const c = config.raw.handover.place
    const g = placeGeometry(camera, place)
    const l = pic.layout
    const wide = toneReach(place, l)
    const toned = mode === 'beauty' && place.weight > 0 && wide.some((x) => x > 0)
    const veiled = (mode === 'beauty' || mode === 'mask') && place.horizon !== undefined && g.reach > 0
    const pass = veiled ? this.veilPass(toned) : toned ? this.splitPass() : this.lay
    const u = pass.material.uniforms
    if (veiled) (u.uVeil!.value as THREE.Vector2).set(Math.min(Math.max(place.horizon ?? 0, 0), 1), lapOf(g, false))
    const e = frame.projectionMatrix.elements
    u.uPicture!.value = pic.target.texture
    u.uSky!.value = this.sky?.texture ?? pic.target.texture
    ;(u.uSize!.value as THREE.Vector2).set(l.width, l.height)
    ;(u.uRay!.value as THREE.Vector4).set(1 / e[0]!, 1 / e[5]!, e[8]! / e[0]!, e[9]! / e[5]!)
    ;(u.uProj!.value as THREE.Vector4).fromArray(pic.proj)
    ;(u.uRel!.value as THREE.Matrix3).copy(g.rel)
    ;(u.uDelta!.value as THREE.Vector3).copy(g.delta)
    ;(u.uShift!.value as THREE.Vector3).copy(g.shift)
    ;(u.uCentre!.value as THREE.Vector3).copy(g.centre)
    ;(u.uBall!.value as THREE.Vector4).set(g.c, g.radius, g.heights, g.distance)
    ;(u.uHorizon!.value as THREE.Vector4).set(g.up.x, g.up.y, g.up.z, g.sinDipTwin)
    u.uSinDip!.value = g.sinDip
    const lifted = g.reach > 0
    ;(u.uLimb!.value as THREE.Vector4).set(lifted ? g.limb.x : 0, lifted ? g.limb.y : 0, lifted ? g.limb.z : 0, lifted ? g.limbDip : 0)
    ;(u.uReach!.value as THREE.Vector2).set(lifted ? g.reach : 1, lifted ? 1 : 0)
    ;(u.uHold!.value as THREE.Vector2).set(g.hold[0], g.hold[1])
    const [inLeft, inRight, inBottom, inTop] = edgeReach(place, l)
    const feather = (px: number, inward: number): number => 1 / Math.max(c.edge * (px * l.scale - 1) + inward, 1e-3)
    ;(u.uFeather!.value as THREE.Vector4).set(feather(l.left, inLeft), feather(l.right, inRight), feather(l.bottom, inBottom), feather(l.top, inTop))
    ;(u.uLimits!.value as THREE.Vector4).set(place.weight, place.seen ?? c.seen, place.maxEnlarge ?? config.raw.handover.maxEnlarge, place.enlargeSoft ?? c.enlargeSoft)
    ;(u.uLens!.value as THREE.Vector4).set(vignette * (place.lens ?? c.lens), aspect, grad / l.scale, c.maxGradTexels)
    ;(u.uScale!.value as THREE.Vector2).set(l.scale, MODES[mode])
    ;(u.uDump!.value as THREE.Vector4).set(dump?.x ?? 0, dump?.y ?? 0, target.width, target.height)
    u.uDumpAs!.value = mode === 'picture' && dump ? (dump.what === 'alpha' ? 2 : 1) : 0
    u.uMatte!.value = matte ?? pic.target.texture
    u.uMatteOn!.value = matte ? 1 : 0
    const m = pass.material
    if (toned) {
      // The broad tones first: the frame under the picture and the picture, per cell, each blurred along both axes.
      const grid = toneGrid(target.width, target.height)
      this.toneGlobe = this.cells(this.toneGlobe, grid.cols, grid.rows)
      this.toneOwn = this.cells(this.toneOwn, grid.cols, grid.rows)
      this.toneHalf = this.cells(this.toneHalf, grid.cols, grid.rows)
      const blur = this.blurPass()
      const b = blur.material.uniforms
      b.uSigma!.value = grid.sigma
      b.uTaps!.value = grid.taps
      u.uUnder!.value = target.texture
      u.uTone!.value = pic.target.texture
      u.uOwn!.value = pic.target.texture
      ;(u.uPixel!.value as THREE.Vector2).set(1 / target.width, 1 / target.height)
      ;(u.uLand!.value as THREE.Vector2).set(Math.sin(THREE.MathUtils.degToRad(c.toneLandDeg[0]!)), Math.sin(THREE.MathUtils.degToRad(c.toneLandDeg[1]!)))
      u.uCell!.value = target.width / grid.cols
      m.blending = THREE.NoBlending
      m.transparent = false
      for (const [code, into] of [[TONE_GLOBE, this.toneGlobe], [TONE_OWN, this.toneOwn]] as const) {
        ;(u.uScale!.value as THREE.Vector2).set(l.scale, code)
        pass.render(r, into)
        b.uFrom!.value = into.texture
        ;(b.uStep!.value as THREE.Vector2).set(1 / grid.cols, 0)
        blur.render(r, this.toneHalf)
        b.uFrom!.value = this.toneHalf.texture
        ;(b.uStep!.value as THREE.Vector2).set(0, 1 / grid.rows)
        blur.render(r, into)
      }
      u.uUnder!.value = pic.target.texture
      u.uTone!.value = this.toneGlobe.texture
      u.uOwn!.value = this.toneOwn.texture
      ;(u.uToneFeather!.value as THREE.Vector4).set(feather(l.left, wide[0]), feather(l.right, wide[1]), feather(l.bottom, wide[2]), feather(l.top, wide[3]))
      u.uCell!.value = 1
      ;(u.uScale!.value as THREE.Vector2).set(l.scale, MODES[mode])
    }
    const plain = mode !== 'beauty'
    m.blending = plain ? THREE.NoBlending : THREE.CustomBlending
    m.transparent = !plain
    if (veiled && g.lap !== 0) {
      // The lap of the ball: the pixels nobody has written depth into first, then the others, so every pixel is drawn once.
      m.depthTest = true
      m.depthFunc = THREE.EqualDepth
      pass.render(r, target)
      m.depthFunc = THREE.NotEqualDepth
      ;(u.uVeil!.value as THREE.Vector2).y = lapOf(g, true)
      pass.render(r, target)
      m.depthTest = false
      m.depthFunc = THREE.LessEqualDepth
    } else pass.render(r, target)
  }

  private splitPass(): Pass {
    this.split ??= new Pass(lay(true), { ...layUniforms(), ...toneUniforms() }, LAY_BLEND)
    return this.split
  }

  private veilPass(toned: boolean): Pass {
    if (toned) {
      this.veilSplit ??= new Pass(lay(true, true), { ...layUniforms(), ...toneUniforms(), uVeil: { value: new THREE.Vector2() } }, LAY_BLEND)
      return this.veilSplit
    }
    this.veil ??= new Pass(lay(false, true), { ...layUniforms(), uVeil: { value: new THREE.Vector2() } }, LAY_BLEND)
    return this.veil
  }

  private blurPass(): Pass {
    this.blur ??= new Pass(BLUR, { uFrom: { value: null }, uStep: { value: new THREE.Vector2() }, uSigma: { value: 1 }, uTaps: { value: 0 } }, { blending: THREE.NoBlending })
    return this.blur
  }

  private cells(old: THREE.WebGLRenderTarget | null, cols: number, rows: number): THREE.WebGLRenderTarget {
    if (old && old.width === cols && old.height === rows) return old
    old?.dispose()
    return floatTarget(cols, rows, THREE.HalfFloatType, false, false)
  }

  reset(): void {
    for (const p of this.pictures) p.target.dispose()
    this.pictures.length = 0
    this.release()
    this.sky?.dispose()
    this.sky = null
    this.toneGlobe?.dispose()
    this.toneOwn?.dispose()
    this.toneHalf?.dispose()
    this.toneGlobe = null
    this.toneOwn = null
    this.toneHalf = null
  }

  dispose(): void {
    this.reset()
    this.copy.dispose()
    this.pack.dispose()
    this.lay.dispose()
    this.split?.dispose()
    this.veil?.dispose()
    this.veilSplit?.dispose()
    this.blur?.dispose()
    this.split = null
    this.veil = null
    this.veilSplit = null
    this.blur = null
  }
}
