import * as THREE from 'three'
import { config } from '../../config'
import { Pass, floatTarget } from '../../core/pass'
import { hash01 } from '../../core/random'
import type { RenderView, Shot } from '../../core/types'
import { isRaw } from '../../diagnostics/diag'
import { BeltMotion, beltSegment, beltSpec, type BeltDirector, type RockPose } from './motion'
import { rockMaterial } from './rock'
import { BeltStore, rockGeometry } from './store'

const ADD = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
uniform float uWeight;
uniform vec2 uShift;
out vec4 outColor;
void main() {
  outColor = texelFetch(uSrc, ivec2(gl_FragCoord.xy - uShift), 0) * uWeight;
}`

const STREAK = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform vec2 uDir;
out vec4 outColor;
void main() {
  vec4 sum = vec4(0.0);
  for (int i = 1; i < 10; i++) {
    float t = float(i) / 5.0 - 1.0;
    sum += texture(uSrc, (gl_FragCoord.xy + uDir * t) / uSize) * (1.0 - abs(t));
  }
  outColor = sum / 5.0;
}`

const BOKEH = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform float uRadius;
out vec4 outColor;
void main() {
  vec4 sum = texture(uSrc, gl_FragCoord.xy / uSize);
  for (int k = 1; k <= 4; k++) {
    float rad = uRadius * float(k) / 4.5;
    int n = 6 * k;
    for (int i = 0; i < n; i++) {
      float a = 6.2831853 * (float(i) + 0.5 * float(k)) / float(n);
      sum += texture(uSrc, (gl_FragCoord.xy + vec2(cos(a), sin(a)) * rad) / uSize);
    }
  }
  outColor = sum / 61.0;
}`

const SOFT = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform float uRadius;
out vec4 outColor;
void main() {
  vec4 sum = texture(uSrc, gl_FragCoord.xy / uSize);
  for (int i = 0; i < 6; i++) {
    float a = 1.0471976 * float(i);
    sum += texture(uSrc, (gl_FragCoord.xy + vec2(cos(a), sin(a)) * uRadius) / uSize) * 0.6;
    sum += texture(uSrc, (gl_FragCoord.xy + vec2(cos(a + 0.5235988), sin(a + 0.5235988)) * uRadius * 2.0) / uSize) * 0.2;
  }
  outColor = sum / 5.8;
}`

const OVER = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
uniform vec2 uSize;
uniform vec3 uMap;
out vec4 outColor;
void main() {
  outColor = texture(uSrc, (gl_FragCoord.xy + uMap.xy) * uMap.z / uSize);
}`

const G = 1.32471795724474602596
const RAD = Math.PI / 180
const blend = (dst: THREE.BlendingDstFactor): Partial<THREE.ShaderMaterialParameters> => ({ transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: dst, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: dst })

interface Seen { x: number; y: number; r: number; dist: number; depth: number; out: boolean }
interface Item { mesh: THREE.Mesh; material: THREE.ShaderMaterial; radius: number; spin: number; gain: number }

export class Belt {
  private store: BeltStore | null = null
  private storeAssets = ''
  private loading: Promise<void> | null = null
  private motion: BeltMotion | null = null
  private readonly items: Item[] = []
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(30, 16 / 9, beltSpec.near, beltSpec.far)
  private scratch: THREE.WebGLRenderTarget | null = null
  private fine: THREE.WebGLRenderTarget | null = null
  private acc: THREE.WebGLRenderTarget | null = null
  private tmp: THREE.WebGLRenderTarget | null = null
  private layer: THREE.WebGLRenderTarget | null = null
  private add: Pass | null = null
  private streak: Pass | null = null
  private bokeh: Pass | null = null
  private soft: Pass | null = null
  private over: Pass | null = null
  private drawn = false
  private readonly pose: RockPose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
  private readonly inv = new THREE.Quaternion()
  private readonly v = new THREE.Vector3()
  private readonly first: number
  private readonly end: number
  private readonly spheres: THREE.Vector4[] = []
  private coverFrame = -1

  constructor() {
    const s = beltSegment()
    this.first = s.firstFrame
    this.end = s.endFrame
  }

  private inside(frame: number): boolean {
    return frame >= this.first && frame < this.end
  }

  get bytes(): number {
    const t = this.layer ? (this.layer.width * this.layer.height + 3 * this.acc!.width * this.acc!.height) * 8 : 0
    return (this.store?.bytes ?? 0) + t
  }

  ready(frame: number, assets: string): boolean {
    return !this.inside(frame) || (this.store !== null && this.storeAssets === assets)
  }

  async prepare(frame: number, assets: string, renderer: THREE.WebGLRenderer): Promise<void> {
    if (!this.inside(frame)) {
      if (this.store && !this.loading) this.free()
      return
    }
    if (this.store && this.storeAssets === assets) return
    if (!this.loading) {
      this.loading = BeltStore.load(assets, renderer.capabilities.getMaxAnisotropy()).then((store) => {
        this.free()
        this.store = store
        this.storeAssets = assets
        for (const r of beltSpec.rocks) {
          const asset = store.rocks.get(r.asset)
          if (!asset) throw new Error('belt rock asset missing: ' + r.asset)
          const material = rockMaterial(asset, store.detail!)
          const mesh = new THREE.Mesh(rockGeometry(r.mesh, asset.radii, asset.aux), material)
          mesh.frustumCulled = false
          mesh.visible = false
          this.scene.add(mesh)
          ;(material.uniforms.uFill!.value as THREE.Vector3).multiplyScalar(r.fill)
          this.items.push({ mesh, material, radius: r.radius, spin: r.spin, gain: r.gain })
        }
        this.loading = null
      })
    }
    await this.loading
  }

  private free(): void {
    for (const it of this.items) {
      it.mesh.geometry.dispose()
      it.material.dispose()
    }
    this.items.length = 0
    this.scene.clear()
    this.store?.dispose()
    this.store = null
    this.storeAssets = ''
    for (const t of [this.scratch, this.fine, this.acc, this.tmp, this.layer]) t?.dispose()
    this.scratch = this.fine = this.acc = this.tmp = this.layer = null
  }

  private targets(width: number, height: number, pad: number): void {
    const w = width + 2 * pad
    const h = height + 2 * pad
    if (this.layer && this.layer.width === width && this.layer.height === height && this.acc!.width === w) return
    for (const t of [this.scratch, this.fine, this.acc, this.tmp, this.layer]) t?.dispose()
    this.scratch = floatTarget(w, h, THREE.HalfFloatType, true)
    this.fine = floatTarget(Math.min(w, Math.ceil((beltSpec.blur.fineSize * height) / 1080)), Math.min(h, Math.ceil((beltSpec.blur.fineSize * height) / 1080)), THREE.HalfFloatType, true)
    this.fine.samples = beltSpec.blur.msaa
    this.acc = floatTarget(w, h, THREE.HalfFloatType)
    this.tmp = floatTarget(w, h, THREE.HalfFloatType)
    this.layer = floatTarget(width, height, THREE.HalfFloatType)
    if (!this.add) {
      const size = (): THREE.IUniform => ({ value: new THREE.Vector2() })
      this.add = new Pass(ADD, { uSrc: { value: null }, uWeight: { value: 1 }, uShift: { value: new THREE.Vector2() } }, blend(THREE.OneFactor))
      this.streak = new Pass(STREAK, { uSrc: { value: null }, uSize: size(), uDir: { value: new THREE.Vector2() } })
      this.bokeh = new Pass(BOKEH, { uSrc: { value: null }, uSize: size(), uRadius: { value: 1 } })
      this.soft = new Pass(SOFT, { uSrc: { value: null }, uSize: size(), uRadius: { value: 1 } })
      this.over = new Pass(OVER, { uSrc: { value: null }, uSize: size(), uMap: { value: new THREE.Vector3() } }, blend(THREE.OneMinusSrcAlphaFactor))
    }
  }

  private see(index: number, shot: Shot, focal: number, cx: number, cy: number, scale: number): Seen {
    this.motion!.pose(index, shot, this.pose)
    const c = this.v.copy(this.pose.position).applyQuaternion(this.inv.copy(shot.camera.quaternion).invert())
    const dist = c.length()
    const depth = -c.z
    const radius = this.items[index]!.radius
    const hx = cx + this.coc(dist, scale) / 2 + 2
    const hy = cy + this.coc(dist, scale) / 2 + 2
    const out = depth < -radius || (focal * Math.abs(c.x) - hx * depth) / Math.hypot(focal, hx) > radius || (focal * Math.abs(c.y) - hy * depth) / Math.hypot(focal, hy) > radius
    if (depth < radius * 1.2) return { x: cx, y: cy, r: 1e6, dist, depth, out }
    return { x: cx + (c.x / depth) * focal, y: cy + (c.y / depth) * focal, r: ((focal * radius) / (depth - radius)) * (dist / depth), dist, depth, out }
  }

  private place(index: number, shot: Shot): void {
    const it = this.items[index]!
    this.motion!.pose(index, shot, this.pose)
    it.mesh.position.copy(this.pose.position)
    it.mesh.quaternion.copy(this.pose.quaternion)
    it.mesh.scale.setScalar(it.radius)
    it.mesh.updateMatrixWorld(true)
    const u = it.material.uniforms
    this.inv.copy(this.pose.quaternion).invert()
    ;(u.uSunB!.value as THREE.Vector3).copy(shot.sun.dir).applyQuaternion(this.inv).normalize()
    ;(u.uEyeB!.value as THREE.Vector3).copy(this.pose.position).multiplyScalar(-1 / it.radius).applyQuaternion(this.inv)
    const k = shot.sun.intensity * beltSpec.light.gain * it.gain
    ;(u.uSunTint!.value as THREE.Vector3).set(shot.sun.color.r * k, shot.sun.color.g * k, shot.sun.color.b * k)
    u.uGain!.value = 1 / shot.post.exposure
  }

  private aim(quaternion: THREE.Quaternion, vfov: number, aspect: number): void {
    const cam = this.camera
    cam.fov = vfov
    cam.aspect = aspect
    cam.position.set(0, 0, 0)
    cam.quaternion.copy(quaternion)
  }

  private coc(dist: number, scale: number): number {
    return beltSpec.aperture * scale * Math.max(0, 1 / dist - 1 / beltSpec.focus)
  }

  render(r: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, director: BeltDirector, shot: Shot, view: RenderView): void {
    if (shot.segment.id !== beltSpec.segment || !this.store) return
    this.motion ??= new BeltMotion(director)
    if (isRaw(view.diag)) {
      this.direct(r, target, shot, view)
      return
    }
    if (view.sample === 0) this.build(r, director, shot, view)
    if (this.drawn) {
      const u = this.over!.material.uniforms
      u.uSrc!.value = this.layer!.texture
      ;(u.uSize!.value as THREE.Vector2).set(this.layer!.width, this.layer!.height)
      ;(u.uMap!.value as THREE.Vector3).set(0, 0, 1)
      this.over!.render(r, target)
    }
    r.setRenderTarget(target)
  }

  cover(shot: Shot): { mask: THREE.Texture; rocks: THREE.Vector4[] } | null {
    if (shot.segment.id !== beltSpec.segment || !this.drawn || !this.layer || this.coverFrame !== shot.frame) return null
    return { mask: this.layer.texture, rocks: this.spheres }
  }

  private direct(r: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, shot: Shot, view: RenderView): void {
    const { width, height } = view.format
    const scale = height / 1080
    const focal = height / 2 / Math.tan((shot.camera.vfov * RAD) / 2)
    let any = false
    this.items.forEach((it, i) => {
      const s = this.see(i, shot, focal, width / 2, height / 2, scale)
      it.mesh.visible = !s.out
      if (!it.mesh.visible) return
      any = true
      this.place(i, shot)
      it.material.uniforms.uCounted!.value = this.coc(s.dist, scale) < beltSpec.blur.countedCoc ? 1 : 0
    })
    if (!any) return
    this.aim(shot.camera.quaternion, shot.camera.vfov, width / height)
    const jitter = view.camera.view
    this.camera.setViewOffset(width, height, jitter?.offsetX ?? 0, jitter?.offsetY ?? 0, width, height)
    this.camera.updateMatrixWorld(true)
    r.setRenderTarget(target)
    r.clearDepth()
    r.render(this.scene, this.camera)
    for (const it of this.items) it.mesh.visible = false
  }

  private build(r: THREE.WebGLRenderer, director: BeltDirector, shot: Shot, view: RenderView): void {
    const { width, height } = view.format
    const scale = height / 1080
    const pad = Math.ceil(beltSpec.blur.pad * scale)
    this.targets(width, height, pad)
    const coarse = this.scratch!
    let a = this.acc!
    let b = this.tmp!
    const layer = this.layer!
    const fw = width + 2 * pad
    const fh = height + 2 * pad
    const frame = shot.frame
    const t0 = frame / config.fps
    const span = config.shutterFraction / config.fps
    const open = director.shotAt(frame, t0)
    const close = director.shotAt(frame, t0 + span)
    const mid = director.shotAt(frame, t0 + span / 2)
    const focal = height / 2 / Math.tan((mid.camera.vfov * RAD) / 2)
    const cx = pad + width / 2
    const cy = pad + height / 2
    const plan: { index: number; depth: number; coc: number; steps: number; shift: [number, number]; box: [number, number, number, number]; level: number }[] = []
    this.items.forEach((it, i) => {
      const s0 = this.see(i, open, focal, cx, cy, scale)
      const s1 = this.see(i, close, focal, cx, cy, scale)
      const sm = this.see(i, mid, focal, cx, cy, scale)
      if (s0.out && s1.out && sm.out) return
      const coc = this.coc(sm.dist, scale)
      const huge = Math.max(s0.r, s1.r, sm.r) > 1e5
      const move = huge ? 1e4 : Math.hypot(s1.x - s0.x, s1.y - s0.y) + Math.abs(s1.r - s0.r) + it.spin * RAD * span * sm.r
      const steps = Math.min(Math.max(Math.ceil(move / Math.max(beltSpec.steps.gap * scale, coc * 0.2)), beltSpec.steps.min), beltSpec.steps.max)
      const spacing = huge ? 0 : move / steps
      const margin = coc * 0.7 + spacing + 4
      let x0 = 0
      let y0 = 0
      let x1 = fw
      let y1 = fh
      if (!huge) {
        x0 = Math.max(0, Math.floor(Math.min(s0.x - s0.r, s1.x - s1.r, sm.x - sm.r) - margin))
        y0 = Math.max(0, Math.floor(Math.min(s0.y - s0.r, s1.y - s1.r, sm.y - sm.r) - margin))
        x1 = Math.min(fw, Math.ceil(Math.max(s0.x + s0.r, s1.x + s1.r, sm.x + sm.r) + margin))
        y1 = Math.min(fh, Math.ceil(Math.max(s0.y + s0.r, s1.y + s1.r, sm.y + sm.r) + margin))
      }
      if (x1 <= x0 || y1 <= y0) return
      const reduce = beltSpec.blur.reduceAt * scale
      const level = coc >= reduce * 2 ? Math.min(Math.floor(Math.log2(coc / reduce)), beltSpec.blur.levels) : 0
      const len = Math.hypot(s1.x - s0.x, s1.y - s0.y)
      const shift: [number, number] = len > 1e-6 && !huge ? [((s1.x - s0.x) / len) * spacing, ((s1.y - s0.y) / len) * spacing] : [0, 0]
      plan.push({ index: i, depth: sm.dist, coc, steps, shift, box: [x0, y0, x1, y1], level })
    })
    plan.sort((p, q) => q.depth - p.depth)
    this.drawn = plan.length > 0
    this.coverFrame = shot.frame
    this.spheres.length = 0
    this.inv.copy(mid.camera.quaternion).invert()
    for (const p of plan) {
      this.motion!.pose(p.index, mid, this.pose)
      this.v.copy(this.pose.position).applyQuaternion(this.inv)
      this.spheres.push(new THREE.Vector4(this.v.x, this.v.y, this.v.z, this.items[p.index]!.radius))
    }
    if (!this.drawn) return
    layer.scissorTest = false
    layer.viewport.set(0, 0, width, height)
    r.setRenderTarget(layer)
    r.clear(true, false, false)
    for (const p of plan) {
      const it = this.items[p.index]!
      const s = 1 / (1 << p.level)
      const vw = Math.ceil(fw * s)
      const vh = Math.ceil(fh * s)
      const bx = Math.max(0, Math.floor(p.box[0] * s) - 1)
      const by = Math.max(0, Math.floor(p.box[1] * s) - 1)
      const bw = Math.min(vw, Math.ceil(p.box[2] * s) + 1) - bx
      const bh = Math.min(vh, Math.ceil(p.box[3] * s) + 1) - by
      const small = p.coc < beltSpec.blur.fineCoc * scale && p.steps <= beltSpec.blur.fineSteps && bw <= this.fine!.width && bh <= this.fine!.height
      const scratch = small ? this.fine! : coarse
      for (const t of [coarse, a, b]) {
        t.viewport.set(0, 0, vw, vh)
        t.scissorTest = false
      }
      r.setRenderTarget(a)
      r.clear(true, false, false)
      r.setRenderTarget(b)
      r.clear(true, false, false)
      for (const t of [coarse, a, b]) {
        t.scissor.set(bx, by, bw, bh)
        t.scissorTest = true
      }
      this.fine!.viewport.set(0, 0, bw, bh)
      this.fine!.scissor.set(0, 0, bw, bh)
      this.fine!.scissorTest = true
      it.mesh.visible = true
      it.material.uniforms.uCounted!.value = 1
      const add = this.add!.material.uniforms
      add.uSrc!.value = scratch.texture
      add.uWeight!.value = 1 / p.steps
      ;(add.uShift!.value as THREE.Vector2).set(small ? bx : 0, small ? by : 0)
      const order = Array.from({ length: p.steps }, (_, k) => k).sort((x, y) => hash01(x, p.index, p.steps) - hash01(y, p.index, p.steps))
      for (let k = 0; k < p.steps; k++) {
        const at = director.shotAt(frame, t0 + (span * (k + 0.5)) / p.steps)
        this.place(p.index, at)
        this.aim(at.camera.quaternion, at.camera.vfov, width / height)
        const n = order[k]! + 1 + p.index * 7
        const jx = ((0.5 + n / G) % 1) - 0.5
        const jy = ((0.5 + n / (G * G)) % 1) - 0.5
        if (small) this.camera.setViewOffset(width * s, height * s, -pad * s + jx + bx, -pad * s + jy + vh - by - bh, bw, bh)
        else this.camera.setViewOffset(width * s, height * s, -pad * s + jx, -pad * s + jy, vw, vh)
        this.camera.updateMatrixWorld(true)
        r.setRenderTarget(scratch)
        r.clear(true, true, false)
        r.render(this.scene, this.camera)
        this.add!.render(r, a)
      }
      it.mesh.visible = false
      const size = (pass: Pass): void => {
        ;(pass.material.uniforms.uSize!.value as THREE.Vector2).set(a.width, a.height)
      }
      const swap = (): void => {
        const t = a
        a = b
        b = t
      }
      if (Math.hypot(p.shift[0], p.shift[1]) * s > 1) {
        const u = this.streak!.material.uniforms
        u.uSrc!.value = a.texture
        ;(u.uDir!.value as THREE.Vector2).set(p.shift[0] * s, p.shift[1] * s)
        size(this.streak!)
        this.streak!.render(r, b)
        swap()
      }
      if (p.coc * s >= beltSpec.blur.minCoc) {
        const rad = (p.coc * s) / 2
        let u = this.bokeh!.material.uniforms
        u.uSrc!.value = a.texture
        u.uRadius!.value = rad
        size(this.bokeh!)
        this.bokeh!.render(r, b)
        u = this.soft!.material.uniforms
        u.uSrc!.value = b.texture
        u.uRadius!.value = rad / 9
        size(this.soft!)
        this.soft!.render(r, a)
      }
      const o = this.over!.material.uniforms
      o.uSrc!.value = a.texture
      ;(o.uSize!.value as THREE.Vector2).set(a.width, a.height)
      ;(o.uMap!.value as THREE.Vector3).set(pad, pad, s)
      layer.scissor.set(Math.max(0, p.box[0] - pad), Math.max(0, p.box[1] - pad), Math.min(width, p.box[2] - pad) - Math.max(0, p.box[0] - pad), Math.min(height, p.box[3] - pad) - Math.max(0, p.box[1] - pad))
      layer.scissorTest = true
      if (layer.scissor.z > 0 && layer.scissor.w > 0) this.over!.render(r, layer)
      layer.scissorTest = false
    }
    for (const t of [coarse, this.fine!, a, b]) t.scissorTest = false
    this.acc = a
    this.tmp = b
  }
}
