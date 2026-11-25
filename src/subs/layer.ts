import * as THREE from 'three'
import { Haze } from './haze'
import { kernel, layout, stateAt, type Item, type Layout } from './layout'
import { SHADE_FAR, SHADE_NEAR, SHADOW } from './look'

export const FAMILY = 'Subs Sans'

const VERT = /* glsl */ `
uniform vec4 uRect;
uniform vec2 uSize;
void main() {
  gl_Position = vec4((uRect.xy + position.xy * uRect.zw) / uSize * 2.0 - 1.0, 0.0, 1.0);
}`

const TILE = /* glsl */ `
uniform sampler2D uAtlas;
uniform ivec4 uCell;
uniform ivec2 uAt;
uniform int uSs;
float tile(ivec2 q) {
  if (q.x < 0 || q.y < 0 || q.x >= uCell.z || q.y >= uCell.w) return 0.0;
  ivec2 o = (uCell.xy + q) * uSs;
  float s = 0.0;
  for (int b = 0; b < uSs; b++) for (int a = 0; a < uSs; a++) s += texelFetch(uAtlas, o + ivec2(a, b), 0).r;
  return s / float(uSs * uSs);
}`

const WORD_FRAG = /* glsl */ `
precision highp float;
${TILE}
uniform float uShown;
out vec4 outColor;
void main() {
  outColor = vec4(tile(ivec2(gl_FragCoord.xy) - uAt) * uShown, 0.0, 0.0, 1.0);
}`

const WORD_H_FRAG = /* glsl */ `
precision highp float;
${TILE}
uniform sampler2D uKernel;
uniform int uRadius;
out vec4 outColor;
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy) - uAt;
  float s = 0.0;
  for (int k = -uRadius; k <= uRadius; k++) s += texelFetch(uKernel, ivec2(k + uRadius, 0), 0).r * tile(q + ivec2(k, 0));
  outColor = vec4(s, 0.0, 0.0, 1.0);
}`

const WORD_V_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
uniform sampler2D uKernel;
uniform int uRadius;
uniform ivec4 uCell;
uniform ivec2 uAt;
uniform int uWhole;
uniform float uPart;
uniform float uShown;
out vec4 outColor;
float col(int x, int j) {
  if (j < 0 || j >= uCell.w) return 0.0;
  float s = 0.0;
  for (int k = -uRadius; k <= uRadius; k++) {
    int r = j + k;
    if (r >= 0 && r < uCell.w) s += texelFetch(uKernel, ivec2(k + uRadius, 0), 0).r * texelFetch(uSrc, ivec2(x, uAt.y + r), 0).r;
  }
  return s;
}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  int j = p.y - uAt.y + uWhole;
  outColor = vec4((col(p.x, j) * (1.0 - uPart) + col(p.x, j + 1) * uPart) * uShown, 0.0, 0.0, 1.0);
}`

const BLUR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
uniform sampler2D uKernel;
uniform int uRadius;
uniform ivec2 uStep;
uniform ivec4 uBounds;
out vec4 outColor;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float s = 0.0;
  for (int k = -uRadius; k <= uRadius; k++) {
    ivec2 q = p + uStep * k;
    if (q.x >= uBounds.x && q.y >= uBounds.y && q.x < uBounds.z && q.y < uBounds.w) s += texelFetch(uKernel, ivec2(k + uRadius, 0), 0).r * texelFetch(uSrc, q, 0).r;
  }
  outColor = vec4(s, 0.0, 0.0, 1.0);
}`

const OVER_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uFrame;
uniform sampler2D uHaze;
uniform sampler2D uWords;
uniform sampler2D uNear;
uniform sampler2D uFar;
uniform ivec2 uGrid;
uniform ivec2 uUp;
uniform int uTop;
uniform int uHeight;
uniform int uBand;
uniform uint uKey;
uniform vec3 uShadow;
out vec4 outColor;
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
vec4 haze(ivec2 p) {
  vec2 f = (vec2(min(p, uUp - 1)) + 0.5) * vec2(uGrid) / vec2(uUp) - 0.5;
  vec2 fl = floor(f);
  vec2 w = f - fl;
  ivec2 a = clamp(ivec2(fl), ivec2(0), uGrid - 1);
  ivec2 b = clamp(ivec2(fl) + 1, ivec2(0), uGrid - 1);
  vec4 top = texelFetch(uHaze, ivec2(a.x, a.y), 0) * (1.0 - w.x) + texelFetch(uHaze, ivec2(b.x, a.y), 0) * w.x;
  vec4 low = texelFetch(uHaze, ivec2(a.x, b.y), 0) * (1.0 - w.x) + texelFetch(uHaze, ivec2(b.x, b.y), 0) * w.x;
  return top * (1.0 - w.y) + low * w.y;
}
void main() {
  ivec2 g = ivec2(gl_FragCoord.xy);
  ivec2 p = ivec2(g.x, uHeight - 1 - g.y - uTop);
  vec3 src = texelFetch(uFrame, ivec2(g.x, g.y - (uHeight - uTop - uBand)), 0).rgb;
  vec4 h = haze(p);
  float at = texelFetch(uWords, p, 0).r;
  float sh = min(0.90, 0.85 * min(1.0, 2.2 * texelFetch(uNear, p, 0).r) + 0.55 * min(1.0, 2.2 * texelFetch(uFar, p, 0).r));
  vec3 P = h.rgb * h.a;
  float A = h.a;
  P = P * (1.0 - sh) + uShadow * sh;
  A = A * (1.0 - sh) + sh;
  P = P * (1.0 - at) + at;
  A = A * (1.0 - at) + at;
  vec3 o = src * (1.0 - A) + P;
  float d = A > 0.004 ? (float(pcg(uint(p.x) + pcg(uint(p.y) + pcg(uKey))) >> 8u) / 16777216.0 - 0.5) / 255.0 : 0.0;
  outColor = vec4(floor(clamp((o + d) * 255.0 + 0.5, 0.0, 255.0)) / 255.0, 1.0);
}`

const quad = new THREE.BufferGeometry()
quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3))
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

class Quad {
  readonly material: THREE.ShaderMaterial
  private readonly scene = new THREE.Scene()

  constructor(fragment: string, uniforms: Record<string, THREE.IUniform>, max = false) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: fragment,
      uniforms: { uRect: { value: new THREE.Vector4() }, uSize: { value: new THREE.Vector2() }, ...uniforms },
      depthTest: false,
      depthWrite: false,
      ...(max ? { blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor } : { blending: THREE.NoBlending }),
    })
    const mesh = new THREE.Mesh(quad, this.material)
    mesh.frustumCulled = false
    this.scene.add(mesh)
  }

  set(name: string, value: unknown): void {
    this.material.uniforms[name]!.value = value
  }

  draw(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null, x: number, y: number, w: number, h: number, sw: number, sh: number): void {
    ;(this.material.uniforms.uRect!.value as THREE.Vector4).set(x, y, w, h)
    ;(this.material.uniforms.uSize!.value as THREE.Vector2).set(sw, sh)
    renderer.setRenderTarget(target)
    renderer.render(this.scene, cam)
  }
}

function plane(width: number, height: number, format: THREE.PixelFormat, type: THREE.TextureDataType): THREE.WebGLRenderTarget {
  const t = new THREE.WebGLRenderTarget(width, height, { type, format, depthBuffer: false, stencilBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, colorSpace: THREE.NoColorSpace })
  t.texture.wrapS = THREE.ClampToEdgeWrapping
  t.texture.wrapT = THREE.ClampToEdgeWrapping
  return t
}

function kernelTexture(sigma: number): { texture: THREE.DataTexture; radius: number } {
  const k = kernel(sigma)
  const texture = new THREE.DataTexture(k, k.length, 1, THREE.RedFormat, THREE.FloatType)
  texture.needsUpdate = true
  return { texture, radius: (k.length - 1) / 2 }
}

class Sized {
  readonly L: Layout
  readonly haze: Haze
  readonly hazeTex: THREE.DataTexture
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  readonly atlas: THREE.CanvasTexture
  readonly frame: THREE.WebGLRenderTarget
  readonly words: THREE.WebGLRenderTarget
  readonly tmp: THREE.WebGLRenderTarget
  readonly near: THREE.WebGLRenderTarget
  readonly far: THREE.WebGLRenderTarget
  readonly kNear: { texture: THREE.DataTexture; radius: number }
  readonly kFar: { texture: THREE.DataTexture; radius: number }
  drawn = -1

  constructor(width: number, height: number) {
    const L = (this.L = layout(width, height))
    this.haze = new Haze(L)
    this.hazeTex = new THREE.DataTexture(this.haze.data, L.gw, L.gh, THREE.RGBAFormat, THREE.FloatType)
    this.canvas = document.createElement('canvas')
    this.canvas.width = L.atlasW * L.ss
    this.canvas.height = L.atlasH * L.ss
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    this.atlas = new THREE.CanvasTexture(this.canvas)
    this.atlas.flipY = false
    this.atlas.minFilter = THREE.NearestFilter
    this.atlas.magFilter = THREE.NearestFilter
    this.atlas.generateMipmaps = false
    this.atlas.colorSpace = THREE.NoColorSpace
    this.frame = plane(width, L.bh, THREE.RGBAFormat, THREE.UnsignedByteType)
    this.words = plane(width, L.bh, THREE.RedFormat, THREE.HalfFloatType)
    this.tmp = plane(width, L.bh, THREE.RedFormat, THREE.HalfFloatType)
    this.near = plane(width, L.bh, THREE.RedFormat, THREE.HalfFloatType)
    this.far = plane(width, L.bh, THREE.RedFormat, THREE.HalfFloatType)
    this.kNear = kernelTexture(SHADE_NEAR * L.em)
    this.kFar = kernelTexture(SHADE_FAR * L.em)
  }

  write(cue: number): void {
    if (this.drawn === cue) return
    this.drawn = cue
    const { ctx, L } = this
    const c = L.lines[cue]!
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.font = L.size + 'px "' + FAMILY + '"'
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
    ctx.fontKerning = 'normal'
    ;(ctx as unknown as { textRendering: string }).textRendering = 'geometricPrecision'
    ctx.fillStyle = '#fff'
    const list = lineWords(cue)
    for (const it of c) ctx.fillText(list[it.i]!, (it.ax + it.x - it.tx) * L.ss, (it.ay + it.base - it.ty) * L.ss)
    this.atlas.needsUpdate = true
  }

  dispose(): void {
    for (const t of [this.frame, this.words, this.tmp, this.near, this.far]) t.dispose()
    for (const t of [this.hazeTex, this.atlas, this.kNear.texture, this.kFar.texture]) t.dispose()
  }
}

import { cues } from './layout'

function lineWords(cue: number): string[] {
  return cues[cue]!.words.map((w) => w.w)
}

export class Layer {
  private sized: Sized | null = null
  private readonly word = new Quad(WORD_FRAG, { uAtlas: { value: null }, uCell: { value: [0, 0, 0, 0] }, uAt: { value: [0, 0] }, uSs: { value: 1 }, uShown: { value: 0 } }, true)
  private readonly wordH = new Quad(WORD_H_FRAG, { uAtlas: { value: null }, uCell: { value: [0, 0, 0, 0] }, uAt: { value: [0, 0] }, uSs: { value: 1 }, uKernel: { value: null }, uRadius: { value: 0 } })
  private readonly wordV = new Quad(WORD_V_FRAG, { uSrc: { value: null }, uKernel: { value: null }, uRadius: { value: 0 }, uCell: { value: [0, 0, 0, 0] }, uAt: { value: [0, 0] }, uWhole: { value: 0 }, uPart: { value: 0 }, uShown: { value: 0 } }, true)
  private readonly blur = new Quad(BLUR_FRAG, { uSrc: { value: null }, uKernel: { value: null }, uRadius: { value: 0 }, uStep: { value: [1, 0] }, uBounds: { value: [0, 0, 0, 0] } })
  private readonly over = new Quad(OVER_FRAG, { uFrame: { value: null }, uHaze: { value: null }, uWords: { value: null }, uNear: { value: null }, uFar: { value: null }, uGrid: { value: [0, 0] }, uUp: { value: [0, 0] }, uTop: { value: 0 }, uHeight: { value: 0 }, uBand: { value: 0 }, uKey: { value: 0 }, uShadow: { value: new THREE.Vector3(...SHADOW) } })
  private softKernel: THREE.DataTexture | null = null
  last = 0

  constructor(private readonly renderer: THREE.WebGLRenderer) {}

  draw(t: number, key: number): boolean {
    const r = this.renderer
    const size = r.getDrawingBufferSize(new THREE.Vector2())
    const W = size.x
    const H = size.y
    if (!this.sized || this.sized.L.width !== W || this.sized.L.height !== H) {
      this.sized?.dispose()
      this.sized = new Sized(W, H)
    }
    const s = this.sized
    const L = s.L
    const state = stateAt(t, L.em)
    if (!state) return false
    const began = performance.now()
    s.haze.fill(t, state)
    s.hazeTex.needsUpdate = true
    s.write(state.cue)
    const gl = r.getContext() as WebGL2RenderingContext
    const bh = L.bh
    for (const target of [s.words, s.near, s.far]) {
      r.setRenderTarget(target)
      r.clear(true, false, false)
    }
    let x0 = W
    let y0 = bh
    let x1 = 0
    let y1 = 0
    const items = L.lines[state.cue]!
    for (const it of items) {
      const ws = state.words[it.i]!
      if (!(ws.shown > 0)) continue
      x0 = Math.min(x0, it.tx)
      y0 = Math.min(y0, it.ty)
      x1 = Math.max(x1, it.tx + it.tw)
      y1 = Math.max(y1, it.ty + it.th)
      if (ws.settled) this.settled(s, it, ws.shown)
      else this.coming(s, it, ws.shown, ws.soft, ws.drop)
    }
    x0 = Math.max(0, x0)
    y0 = Math.max(0, y0)
    x1 = Math.min(W, x1)
    y1 = Math.min(bh, y1)
    if (x1 > x0 && y1 > y0) {
      for (const [k, target] of [[s.kNear, s.near], [s.kFar, s.far]] as const) {
        const a = Math.max(0, x0 - k.radius)
        const b = Math.min(W, x1 + k.radius)
        const c = Math.max(0, y0 - k.radius)
        const d = Math.min(bh, y1 + k.radius)
        this.blur.set('uKernel', k.texture)
        this.blur.set('uRadius', k.radius)
        this.blur.set('uSrc', s.words.texture)
        this.blur.set('uStep', [1, 0])
        this.blur.set('uBounds', [x0, y0, x1, y1])
        this.blur.draw(r, s.tmp, a, y0, b - a, y1 - y0, W, bh)
        this.blur.set('uSrc', s.tmp.texture)
        this.blur.set('uStep', [0, 1])
        this.blur.set('uBounds', [a, y0, b, y1])
        this.blur.draw(r, target, a, c, b - a, d - c, W, bh)
      }
    }
    r.setRenderTarget(s.frame)
    r.state.bindFramebuffer(gl.READ_FRAMEBUFFER, null)
    gl.blitFramebuffer(0, H - L.y1, W, H - L.y0, 0, 0, W, bh, gl.COLOR_BUFFER_BIT, gl.NEAREST)
    this.over.set('uFrame', s.frame.texture)
    this.over.set('uHaze', s.hazeTex)
    this.over.set('uWords', s.words.texture)
    this.over.set('uNear', s.near.texture)
    this.over.set('uFar', s.far.texture)
    this.over.set('uGrid', [L.gw, L.gh])
    this.over.set('uUp', [L.upW, L.upH])
    this.over.set('uTop', L.y0)
    this.over.set('uHeight', H)
    this.over.set('uBand', bh)
    this.over.set('uKey', key >>> 0)
    this.over.draw(r, null, 0, H - L.y1, W, bh, W, H)
    this.last = performance.now() - began
    return true
  }

  private settled(s: Sized, it: Item, shown: number): void {
    const L = s.L
    this.word.set('uAtlas', s.atlas)
    this.word.set('uCell', [it.ax, it.ay, it.tw, it.th])
    this.word.set('uAt', [it.tx, it.ty])
    this.word.set('uSs', L.ss)
    this.word.set('uShown', shown)
    this.word.draw(this.renderer, s.words, it.tx, it.ty, it.tw, it.th, L.width, L.bh)
  }

  private coming(s: Sized, it: Item, shown: number, soft: number, drop: number): void {
    const L = s.L
    const k = soft > 0 ? kernel(soft) : new Float32Array([1])
    this.softKernel?.dispose()
    const kt = (this.softKernel = new THREE.DataTexture(k, k.length, 1, THREE.RedFormat, THREE.FloatType))
    kt.needsUpdate = true
    const radius = (k.length - 1) / 2
    this.wordH.set('uAtlas', s.atlas)
    this.wordH.set('uCell', [it.ax, it.ay, it.tw, it.th])
    this.wordH.set('uAt', [it.tx, it.ty])
    this.wordH.set('uSs', L.ss)
    this.wordH.set('uKernel', kt)
    this.wordH.set('uRadius', radius)
    this.wordH.draw(this.renderer, s.tmp, it.tx, it.ty, it.tw, it.th, L.width, L.bh)
    const shift = -Math.round(drop * 32) / 32
    const whole = Math.floor(shift)
    this.wordV.set('uSrc', s.tmp.texture)
    this.wordV.set('uKernel', kt)
    this.wordV.set('uRadius', radius)
    this.wordV.set('uCell', [it.ax, it.ay, it.tw, it.th])
    this.wordV.set('uAt', [it.tx, it.ty])
    this.wordV.set('uWhole', whole)
    this.wordV.set('uPart', shift - whole)
    this.wordV.set('uShown', shown)
    this.wordV.draw(this.renderer, s.words, it.tx, it.ty, it.tw, it.th, L.width, L.bh)
  }
}
