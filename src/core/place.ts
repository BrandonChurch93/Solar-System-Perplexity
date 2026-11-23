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
}

const MODES: Record<PlaceMode, number> = { beauty: 0, texels: 1, mask: 2, picture: 3 }
const KEPT = 2

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

export function placeGeometry(camera: Pose, place: Pick<PlaceState, 'twin' | 'centre' | 'radius'>): PlaceGeometry {
  const back = camera.quaternion.clone().invert()
  const o = place.centre.clone().sub(camera.position)
  const distance = o.length()
  const r = place.radius
  const shiftWorld = place.twin.position.clone().sub(camera.position)
  const tc = place.twin.position.clone().sub(place.centre)
  const twinDistance = tc.length()
  const heightTwin = twinDistance - r
  const height = distance - r
  return {
    centre: o.clone().applyQuaternion(back),
    shift: shiftWorld.clone().applyQuaternion(back),
    delta: shiftWorld.clone().applyQuaternion(place.twin.quaternion.clone().invert()),
    rel: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(place.twin.quaternion.clone().invert().multiply(camera.quaternion))),
    c: height * (distance + r),
    radius: r,
    heights: heightTwin > 0 ? height / heightTwin : 1,
    distance,
    up: tc.clone().divideScalar(Math.max(twinDistance, 1e-30)).applyQuaternion(back),
    sinDipTwin: Math.sqrt(Math.max(1 - (r / Math.max(twinDistance, 1e-30)) ** 2, 0)),
    sinDip: Math.sqrt(Math.max(1 - (r / Math.max(distance, 1e-30)) ** 2, 0)),
  }
}

export function placeUv(g: PlaceGeometry, proj: [number, number, number, number], ray: THREE.Vector3): { uv: [number, number]; hit: boolean; front: boolean; honest: number } {
  const d = ray.clone().normalize()
  const b = d.dot(g.centre)
  const disc = b * b - g.c
  const hit = disc > 0 && b > 0
  let q: THREE.Vector3
  let honest: number
  if (hit) {
    const t = g.c / (b + Math.sqrt(disc))
    const p = d.clone().multiplyScalar(t)
    const n = p.clone().sub(g.centre).divideScalar(g.radius)
    const own = (g.c - t * b) / g.radius
    honest = ((own + n.dot(g.shift)) / Math.max(own, 1e-30)) * g.heights
    q = p.applyMatrix3(g.rel).sub(g.delta)
  } else {
    const own = g.sinDip - b / g.distance
    honest = (d.dot(g.up) + g.sinDipTwin) / Math.max(own, 1e-30)
    q = d.applyMatrix3(g.rel)
  }
  const front = -q.z > 0
  const w = Math.max(-q.z, 1e-30)
  return { uv: [((proj[0] * q.x + proj[2] * q.z) / w) * 0.5 + 0.5, ((proj[1] * q.y + proj[3] * q.z) / w) * 0.5 + 0.5], hit, front, honest }
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

const LAY = /* glsl */ `
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
uniform vec4 uFeather;
uniform vec4 uLimits;
uniform vec4 uLens;
uniform vec2 uScale;
uniform vec4 uDump;
uniform float uDumpAs;
uniform sampler2D uMatte;
uniform float uMatteOn;
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
  float honest;
  if (disc > 0.0 && b > 0.0) {
    float t = uBall.x / (b + sqrt(disc));
    vec3 p = d * t;
    vec3 n = (p - uCentre) / uBall.y;
    float own = (uBall.x - t * b) / uBall.y;
    honest = (own + dot(n, uShift)) / max(own, 1e-30) * uBall.z;
    q = uRel * p - uDelta;
  } else {
    float own = uSinDip - b / uBall.w;
    honest = (dot(d, uHorizon.xyz) + uHorizon.w) / max(own, 1e-30);
    q = uRel * d;
  }
  float front = -q.z > 0.0 ? 1.0 : 0.0;
  vec2 uv = (uProj.xy * q.xy + uProj.zw * q.z) / max(-q.z, 1e-30) * 0.5 + 0.5;
  if (mode == 3) {
    uv = uDumpAs > 0.5 ? vec2(uDump.x + vUv.x * uDump.z, uSize.y - uDump.y - (1.0 - vUv.y) * uDump.w) / uSize : vUv;
    front = 1.0;
    honest = 1.0;
  }
  vec2 pt = uv * uSize;
  vec2 dx = dFdx(pt);
  vec2 dy = dFdy(pt);
  vec4 edge = clamp((vec4(pt.x, uSize.x - pt.x, pt.y, uSize.y - pt.y) - 0.5) * uFeather, 0.0, 1.0);
  edge = edge * edge * (3.0 - 2.0 * edge);
  float s1 = dot(dx, dx) + dot(dy, dy);
  float det = dx.x * dy.y - dx.y * dy.x;
  float least = sqrt(max(0.5 * (s1 - sqrt(max(s1 * s1 - 4.0 * det * det, 0.0))), 1e-12));
  float sharp = 1.0 - smoothstep(uLimits.z, uLimits.z * (1.0 + uLimits.w), uScale.x / least);
  float k = uLimits.x * front * edge.x * edge.y * edge.z * edge.w * smoothstep(0.0, uLimits.y, honest) * (mode == 3 ? 1.0 : sharp);
  float most = max(length(dx), length(dy)) * uLens.z;
  float fit = min(1.0, uLens.w / max(most, 1e-9)) * uLens.z;
  vec4 pic = textureGrad(uPicture, uv, dx / uSize * fit, dy / uSize * fit);
  if (uMatteOn > 0.5) k *= textureGrad(uMatte, uv, dx / uSize * fit, dy / uSize * fit).r;
  if (mode == 1) {
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
  outColor = vec4(col * k, k);
}`

export class Place {
  readonly camera = new THREE.PerspectiveCamera()
  private black: THREE.WebGLRenderTarget | null = null
  private white: THREE.WebGLRenderTarget | null = null
  private sky: THREE.WebGLRenderTarget | null = null
  private readonly pictures: PlacePicture[] = []
  private clock = 0
  private readonly copy = new Pass(COPY, { uFrom: { value: null } }, { blending: THREE.NoBlending })
  private readonly pack = new Pass(PACK, { uBlack: { value: null }, uWhite: { value: null }, uPair: { value: 1 } }, { blending: THREE.NoBlending })
  private readonly lay = new Pass(LAY, {
    uPicture: { value: null }, uSky: { value: null }, uSize: { value: new THREE.Vector2(1, 1) }, uRay: { value: new THREE.Vector4() }, uProj: { value: new THREE.Vector4() },
    uRel: { value: new THREE.Matrix3() }, uDelta: { value: new THREE.Vector3() }, uShift: { value: new THREE.Vector3() }, uCentre: { value: new THREE.Vector3() }, uBall: { value: new THREE.Vector4() },
    uHorizon: { value: new THREE.Vector4() }, uSinDip: { value: 0 }, uFeather: { value: new THREE.Vector4() }, uLimits: { value: new THREE.Vector4() }, uLens: { value: new THREE.Vector4() }, uScale: { value: new THREE.Vector2(1, 0) },
    uDump: { value: new THREE.Vector4() }, uDumpAs: { value: 0 }, uMatte: { value: null }, uMatteOn: { value: 0 },
  }, { transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor })

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
    const u = this.lay.material.uniforms
    const l = pic.layout
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
    const feather = (px: number): number => 1 / Math.max(c.edge * (px * l.scale - 1), 1e-3)
    ;(u.uFeather!.value as THREE.Vector4).set(feather(l.left), feather(l.right), feather(l.bottom), feather(l.top))
    ;(u.uLimits!.value as THREE.Vector4).set(place.weight, place.seen ?? c.seen, place.maxEnlarge ?? config.raw.handover.maxEnlarge, place.enlargeSoft ?? c.enlargeSoft)
    ;(u.uLens!.value as THREE.Vector4).set(vignette * (place.lens ?? c.lens), aspect, grad / l.scale, c.maxGradTexels)
    ;(u.uScale!.value as THREE.Vector2).set(l.scale, MODES[mode])
    ;(u.uDump!.value as THREE.Vector4).set(dump?.x ?? 0, dump?.y ?? 0, target.width, target.height)
    u.uDumpAs!.value = mode === 'picture' && dump ? (dump.what === 'alpha' ? 2 : 1) : 0
    u.uMatte!.value = matte ?? pic.target.texture
    u.uMatteOn!.value = matte ? 1 : 0
    const m = this.lay.material
    const plain = mode !== 'beauty'
    m.blending = plain ? THREE.NoBlending : THREE.CustomBlending
    m.transparent = !plain
    this.lay.render(r, target)
  }

  reset(): void {
    for (const p of this.pictures) p.target.dispose()
    this.pictures.length = 0
    this.release()
    this.sky?.dispose()
    this.sky = null
  }

  dispose(): void {
    this.reset()
    this.copy.dispose()
    this.pack.dispose()
    this.lay.dispose()
  }
}
