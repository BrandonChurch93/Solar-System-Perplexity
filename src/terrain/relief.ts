import * as THREE from 'three'
import type { RenderView, SetContext } from '../core/types'
import { DIAG_GLSL, biasUniform, diagUniform, fineUniform, gradUniform } from '../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../post/chain'
import { MAX_MARK, reach, reachNeeded, uniformCells } from './shield'

export interface ReliefLayerDef {
  color: string
  alpha?: string
  alphaOne?: boolean
  dist: string
  box: [number, number, number, number]
  distSize: [number, number]
  tint: [number, number, number]
}

export interface ReliefDef {
  imageSize: [number, number]
  vfovDeg: number
  layers: ReliefLayerDef[]
  masks: string
  maskBox: [number, number, number, number]
  mistDir: [number, number]
}

export interface ReliefAir {
  pitchDeg: number
  dipDeg: number
  cool: [number, number, number]
  coolScaleDeg: number
  warm: [number, number, number]
  warmScaleDeg: number
  side: [number, number]
  warmSide: [number, number, number, number]
  starScaleDeg: number
  starCut: number
  veil: number
  drift?: [number, number, number, number]
}

export interface ReliefValley { top: number; soft: number; strength: number; color: [number, number, number]; wind: [number, number]; speed: number; scale: number; stretch: number; churn: number; mask: [number, number]; cut: [number, number] }

interface ReliefApron { padding: number; fullWidth: number; mips: boolean; baseAlphaNoMips: string[]; resolution: { full: number; web: number }; layers: { layer: string; atlas: string; depth: string; edges: number[]; bottomColorShear: number[]; rightColorShear: number[] }[] }
interface ReliefRidge { layer: string; center: number[]; radius: number[]; core: number; slope: number; interval: number[]; taps: number[] }

export interface ReliefMotion { mistSpeed: number; dustSpeed: number; dustDir: [number, number]; mesh: number; air?: ReliefAir; valley?: ReliefValley; pitchDeg?: number; apron?: ReliefApron; ridge?: ReliefRidge }

export const NOISE_GLSL = /* glsl */ `
float vhash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(vhash(i), vhash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(vhash(i + vec3(0.0, 1.0, 0.0)), vhash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y);
  float b = mix(mix(vhash(i + vec3(0.0, 0.0, 1.0)), vhash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(vhash(i + vec3(0.0, 1.0, 1.0)), vhash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y);
  return mix(a, b, f.z);
}`

const AIR_VERT = /* glsl */ `
out vec3 vDir;
out vec3 vClip;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
  vClip = gl_Position.xyw;
  gl_Position.z = gl_Position.w * 0.9999;
}`

const AIR_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uUp;
uniform float uDip;
uniform vec3 uCool;
uniform vec3 uWarm;
uniform vec4 uScale;
uniform vec2 uSide;
uniform vec4 uWarmSide;
uniform float uSpan;
uniform float uVeil;
uniform vec4 uDrift;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vDir;
in vec3 vClip;
out vec4 outColor;
${NOISE_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 d = normalize(vDir);
  float elev = max(asin(clamp(dot(d, uUp), -1.0, 1.0)) + uDip, 0.0);
  float across = clamp(d.x / max(-d.z, 0.2) / uSpan, -1.0, 1.0) * 0.5 + 0.5;
  float side = mix(uSide.x, uSide.y, across);
  float az = atan(d.x, -d.z);
  vec3 dq = vec3(az * uDrift.y - uDrift.z, elev * uDrift.w, uDrift.z * 0.4);
  float streak = 1.0 + uDrift.x * (0.65 * vnoise(dq) + 0.35 * vnoise(dq * vec3(2.3, 1.7, 1.0) + 5.2) - 0.5) * 2.0;
  vec3 glow = uCool * exp(-elev / uScale.x) * side + uWarm * exp(-elev / uScale.y) * mix(uWarmSide.x, uWarmSide.y, smoothstep(uWarmSide.z, uWarmSide.w, across)) * streak;
  float cut = 1.0 - (1.0 - uVeil) * (1.0 - uScale.w * exp(-elev / uScale.z));
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  outColor = vec4(glow * uGain * vig, cut);
}`

const VERT = /* glsl */ `
in vec2 aImage;
out vec2 vImage;
out vec2 vUv;
out vec3 vView;
out vec3 vClip;
out vec3 vLocal;
out vec3 vEye;
void main() {
  vImage = aImage;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  vLocal = position;
  vEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uAlpha;
uniform sampler2D uMasks;
uniform float uHasAlpha;
uniform vec2 uSize;
uniform vec4 uMaskBox;
uniform vec2 uToLayer;
uniform vec2 uMist;
uniform vec2 uDust;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uLayer;
uniform float uGrad;
uniform float uFine;
uniform float uBias;
uniform vec3 uUpL;
uniform vec4 uValley;
uniform vec4 uValleyFlow;
uniform vec4 uValleyShape;
uniform vec3 uValleyColor;
#ifdef RELIEF_APRON
uniform sampler2D uApron;
uniform vec2 uApronSize;
uniform vec4 uApronEdges;
uniform vec3 uApronBottomShear;
uniform vec4 uApronRightShear;
vec2 apronPixel(vec2 p, vec2 region) {
  float pad = uApronEdges.w;
  if (region.y > uSize.y) return vec2(p.x + uApronEdges.x, p.y - uSize.y + pad);
  float start = uApronEdges.z > 0.0 ? uApronEdges.z + pad : 0.0;
  if (region.x < 0.0) return p.yx + vec2(0.0, start + uApronEdges.x);
  if (uApronEdges.x > 0.0) start += uApronEdges.x + pad;
  return p.yx + vec2(0.0, start - uSize.x + pad);
}
vec2 apronUV(vec2 p) {
  return vec2(p.x, uApronSize.y - p.y) / uApronSize;
}
vec2 apronColorSource(vec2 p) {
  float w = smoothstep(uApronBottomShear.y, uApronBottomShear.z, p.x / uSize.x);
  float v = p.y / uSize.y;
  float r = smoothstep(uApronRightShear.y, uApronRightShear.z, v) * (1.0 - smoothstep(uApronRightShear.w, 1.0, v));
  return p + max(p.yx - uSize.yx, 0.0) * vec2(w * uApronBottomShear.x, r * uApronRightShear.x);
}
#endif
in vec2 vImage;
in vec2 vUv;
in vec3 vView;
in vec3 vClip;
in vec3 vLocal;
in vec3 vEye;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${NOISE_GLSL}
float valleyDensity(vec3 p) {
  float h = dot(p, uUpL);
  vec3 fwd = vec3(0.0, uUpL.z, -uUpL.y);
  vec2 g = vec2(p.x, dot(p, fwd));
  vec2 w = uValleyFlow.xy;
  vec2 along = vec2(dot(g, w), dot(g, vec2(-w.y, w.x)));
  along.x -= uValleyFlow.z;
  vec3 q = vec3(along.x / uValleyShape.y, along.y, h * 1.6 + uValleyFlow.w) * uValleyShape.x;
  float n = 0.55 * vnoise(q) + 0.3 * vnoise(q * 2.03 + 7.1) + 0.15 * vnoise(q * 4.1 + 3.3);
  return smoothstep(uValley.x, uValley.x - uValley.y, h) * smoothstep(uValleyShape.z, uValleyShape.w, n);
}
void main() {
  vec2 mq = (vImage - uMaskBox.xy) / uMaskBox.zw;
  vec3 m = texture(uMasks, vec2(mq.x, 1.0 - mq.y), uBias).rgb;
  vec2 shift = uMist * m.r + uDust * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) * uToLayer;
  vec4 texel = textureGrad(uColor, uv, dFdx(vUv) * uGrad, dFdy(vUv) * uGrad);
  float alpha = uHasAlpha > 0.5 ? texture(uAlpha, vUv, uBias).r : texel.a;
#ifdef RELIEF_APRON
  vec2 source = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  vec2 sx = dFdx(source);
  vec2 sy = dFdy(source);
  vec2 cp = apronColorSource(source);
  vec2 cx = dFdx(cp);
  vec2 cy = dFdy(cp);
  if (source.x < 0.0 || source.x > uSize.x || source.y > uSize.y) {
    vec2 p = apronPixel(source, source);
    vec2 ap = apronPixel(cp, source);
    vec2 ax = (apronPixel(cp + cx, source) - ap) / uApronSize * vec2(1.0, -1.0);
    vec2 ay = (apronPixel(cp + cy, source) - ap) / uApronSize * vec2(1.0, -1.0);
    texel = textureGrad(uApron, apronUV(apronPixel(apronColorSource(source - shift * uToLayer * uSize), source)), ax * uGrad, ay * uGrad);
    vec2 px = (apronPixel(source + sx, source) - p) / uApronSize * vec2(1.0, -1.0);
    vec2 py = (apronPixel(source + sy, source) - p) / uApronSize * vec2(1.0, -1.0);
    alpha = textureGrad(uApron, apronUV(p), px * uFine, py * uFine).a;
  }
#endif
  float texels = diagTexels(uv * uSize);
  if (alpha < 0.004) discard;
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;
  float hE = dot(vEye, uUpL);
  float hP = dot(vLocal, uUpL);
  if (uValley.z > 0.0 && hP < uValley.x && hE > hP) {
    float t0 = clamp((uValley.x - hE) / (hP - hE), 0.0, 1.0);
    vec3 ray = vLocal - vEye;
    float sum = 0.0;
    for (int i = 0; i < 4; i++) sum += valleyDensity(vEye + ray * mix(t0, 1.0, (float(i) + 0.5) / 4.0));
    float tau = uValley.z * sum * 0.25 * (1.0 - t0) * length(ray) * (uValley.w + m.r);
    float f = 1.0 - exp(-tau);
    col = mix(col, uValleyColor * uGain * vig, f);
  }
  if (uDiag >= 2 && alpha < 0.5) discard;
  outColor = diagOut(vec4(col * alpha, alpha), texels, 1.0, uLayer, shift * 60.0, length(vView));
}`

const MARK_FRAG = /* glsl */ `
precision highp float;
uniform float uMark;
out vec4 outColor;
void main() {
  outColor = vec4(0.0, 0.0, 0.0, uMark);
}`

// The relief with a presence (Relief.presence): the same shader with its premultiplied output times a share. Built when a relief asks
// for the first time; a relief that never asks keeps the shaders above to the letter.
const HEAD = 'out vec4 outColor;'
const LIT = 'vec4(col * alpha, alpha)'
const AIR_LIT = 'vec4(glow * uGain * vig, cut)'

export function withPresence(source: string, lit: string): string {
  if (source.split(HEAD).length !== 2 || source.split(lit).length !== 2 || source.includes('uPresence')) throw new Error('the relief shader has no single place for a presence')
  return source.replace(HEAD, HEAD + '\nuniform float uPresence;').replace(lit, lit + ' * uPresence')
}

// The relief with an edge (Relief.presenceEdge): the same shaders with their premultiplied output times a share that follows the place in
// the WHOLE source picture, the layers' boxes taken together: 0 at a side of that picture and beyond it, where a layer's apron lies (the
// apron is the picture's last texels drawn out), and 1 one feather inside the side, smooth between. Every layer reads the same coordinate
// (vImage, the place in the whole picture, not in its own box), so all layers end along one line on the ground. The air reads it where the
// ray of its pixel meets the sphere of the relief's farthest distance about the picture's eye, which is where its haze band belongs, so
// the band ends with the ground under it. Built when a relief asks for the first time; a relief that never asks keeps the shaders above
// to the letter.
const IMAGE_IN = 'in vec2 vImage;'
const THIN = 'if (alpha < 0.004) discard;'
const AIR_DIR_IN = 'in vec3 vDir;'
const AIR_DIR_OUT = 'out vec3 vDir;'
const AIR_DIR = 'vDir = position;'

export const EDGE_GLSL = /* glsl */ `
uniform vec4 uEdgeSide;
uniform vec4 uEdgeOver;
float edgeSide(float inside, float over) {
  return over > 0.0 ? smoothstep(0.0, 1.0, inside * over) : 1.0;
}
float edgeShare(vec2 im) {
  return edgeSide(im.x - uEdgeSide.x, uEdgeOver.x) * edgeSide(uEdgeSide.y - im.x, uEdgeOver.y) * edgeSide(uEdgeSide.z - im.y, uEdgeOver.z) * edgeSide(im.y - uEdgeSide.w, uEdgeOver.w);
}`

export const EDGE_AIR_GLSL = /* glsl */ `
uniform vec3 uEdgeFar;
in vec3 vEdgeEye;
vec2 edgeAirImage(vec3 d) {
  float b = dot(vEdgeEye, d);
  float c = dot(vEdgeEye, vEdgeEye) - uEdgeFar.x * uEdgeFar.x;
  vec3 p = vEdgeEye + d * (sqrt(max(b * b - c, 0.0)) - b);
  float ahead = -p.z;
  if (ahead <= 1e-6 * uEdgeFar.x) return vec2(p.x < 0.0 ? -1e6 : 1e6, p.y < 0.0 ? 1e6 : -1e6);
  return vec2(p.x / ahead * uEdgeFar.y, -p.y / ahead * uEdgeFar.z) * 0.5 + 0.5;
}`

export function withEdge(source: string, lit: string): string {
  const air = lit === AIR_LIT
  const head = air ? AIR_DIR_IN : IMAGE_IN
  if (source.split(head).length !== 2 || source.split(lit).length !== 2 || (!air && source.split(THIN).length !== 2) || source.includes('uEdgeSide')) throw new Error('the relief shader has no single place for an edge')
  if (air) return source.replace(head, head + EDGE_GLSL + EDGE_AIR_GLSL).replace(lit, lit + ' * edgeShare(edgeAirImage(d))')
  return source.replace(head, head + EDGE_GLSL).replace(THIN, 'if (alpha < 0.004 || edgeShare(vImage) <= 0.0) discard;').replace(lit, lit + ' * edgeShare(vImage)')
}

// The lens in the air's own frame, for the edge: the air is drawn about the lens, so its vertex shader has no use for the place of the
// lens until an edge asks where a ray meets the relief's far distance. The same line as the layers' eye, with the scale of the group.
export function withEdgeEye(source: string): string {
  if (source.split(AIR_DIR_OUT).length !== 2 || source.split(AIR_DIR).length !== 2 || source.includes('vEdgeEye')) throw new Error('the relief shader has no single place for the eye of its edge')
  return source.replace(AIR_DIR_OUT, AIR_DIR_OUT + '\nout vec3 vEdgeEye;\nuniform float uEyeScale;').replace(AIR_DIR, AIR_DIR + '\n  vEdgeEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz * uEyeScale;')
}

// The share of the edge at a place of the whole picture, as the shader reads it (for the shield and for tests).
export function edgeShareAt(ix: number, iy: number, side: readonly number[], over: readonly number[]): number {
  const one = (inside: number, k: number): number => {
    if (!(k > 0)) return 1
    const t = Math.min(Math.max(inside * k, 0), 1)
    return t * t * (3 - 2 * t)
  }
  return one(ix - side[0]!, over[0]!) * one(side[1]! - ix, over[1]!) * one(side[2]! - iy, over[2]!) * one(iy - side[3]!, over[3]!)
}

// The eye of the layers under a scaled group. The layers take the eye out of the model view matrix as if the group had no scale; under a
// scale s that is s squared times the eye, so the valley mist is seen from near the picture's own eye and not from the camera. A set that
// stands the relief in another scene with a scale (the close view's ground in the globe's scene, through the twin) gets the same line
// times 1 over s squared. Built when a relief finds its group scaled for the first time (Relief.update); a relief whose group is never
// scaled keeps the shader above to the letter.
const EYE_OUT = 'out vec3 vEye;'
const EYE = 'vEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz;'
const EYE_PLAIN = 1e-9

export function withEyeScale(source: string): string {
  if (source.split(EYE_OUT).length !== 2 || source.split(EYE).length !== 2 || source.includes('uEyeScale')) throw new Error('the relief shader has no single place for the scale of its eye')
  return source.replace(EYE_OUT, EYE_OUT + '\nuniform float uEyeScale;').replace(EYE, EYE.slice(0, -1) + ' * uEyeScale;')
}

interface Grid {
  cols: number
  rows: number
  left: number
  nx: number
  ny: number
  position: Float32Array
  index: Uint32Array
  alpha: THREE.Texture | null
  one: Uint8Array
  zero: Uint8Array
  du: number
  dv: number
  full: THREE.BufferGeometry
  lean: THREE.BufferGeometry
  probe: THREE.Mesh
  veil: THREE.Mesh
  sx: Float64Array
  sy: Float64Array
  cells: Uint32Array
  solid: Uint8Array
  box: Int16Array
  kept: number
  // With an edge (Relief.presenceEdge): 1 for a cell of the layer's own box whose four corners have the whole share. Null without one.
  inside: Uint8Array | null
  image: Float32Array
}

interface Layer { mesh: THREE.Mesh; material: THREE.ShaderMaterial; grid: Grid }

const scratch = new THREE.Matrix4()

function marker(id: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: MARK_FRAG, uniforms: { uMark: { value: id } }, side: THREE.DoubleSide, blending: THREE.NoBlending })
}

const rad = THREE.MathUtils.degToRad

export class Relief {
  readonly group = new THREE.Group()
  private readonly layers: Layer[] = []
  private air: { mesh: THREE.Mesh; material: THREE.ShaderMaterial } | null = null
  private readonly def: ReliefDef
  private readonly motion: ReliefMotion
  private readonly probes = new THREE.Scene()
  private readonly soft = marker(0)
  private readonly none = new THREE.MeshBasicMaterial({ visible: false })
  private state: 'new' | 'ready' | 'off' = 'new'
  private readonly share = { value: 1 }
  private fades = false
  private readonly eyeScale = { value: 1 }
  private scaled = false
  private edged = false
  private readonly edgeSide = { value: new THREE.Vector4(0, 1, 1, 0) }
  private readonly edgeOver = { value: new THREE.Vector4(0, 0, 0, 0) }
  private readonly edgeFar = { value: new THREE.Vector3(1, 1, 1) }
  private far = 0

  private constructor(def: ReliefDef, motion: ReliefMotion) {
    this.def = def
    this.motion = motion
    this.group.userData.shield = this
    this.probes.matrixWorldAutoUpdate = false
  }

  owns(o: THREE.Object3D): boolean {
    return this.layers.some((l) => l.mesh === o)
  }

  private ready(renderer: THREE.WebGLRenderer): boolean {
    if (this.state !== 'new') return this.state === 'ready'
    this.state = 'off'
    if (this.layers.length === 0 || this.layers.length > MAX_MARK) return false
    const gl = renderer.getContext()
    for (const l of this.layers) {
      const g = l.grid
      const flags = { one: new Uint8Array(g.nx * g.ny), zero: new Uint8Array(g.nx * g.ny) }
      if (g.alpha) {
        const size = g.alpha.image as { width: number; height: number }
        renderer.initTexture(g.alpha)
        const handle = (renderer.properties.get(g.alpha) as { __webglTexture?: WebGLTexture }).__webglTexture
        if (!handle) return false
        const rgba = new Uint8Array(size.width * size.height * 4)
        const fb = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, handle, 0)
        const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
        if (complete) gl.readPixels(0, 0, size.width, size.height, gl.RGBA, gl.UNSIGNED_BYTE, rgba)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.deleteFramebuffer(fb)
        renderer.resetState()
        if (!complete) return false
        Object.assign(flags, uniformCells(rgba, size.width, size.height, g.nx, g.ny))
        g.du = size.width / g.nx
        g.dv = size.height / g.ny
      }
      g.one = reach(flags.one, g.nx, g.ny)
      g.zero = reach(flags.zero, g.nx, g.ny)
    }
    this.state = 'ready'
    return true
  }

  screen(renderer: THREE.WebGLRenderer, camera: THREE.Camera, width: number, height: number, tile: number): boolean {
    if (this.share.value < 1) return false
    if (!this.ready(renderer)) return false
    this.group.updateWorldMatrix(true, true)
    const tc = Math.ceil(width / tile) - 1
    const tr = Math.ceil(height / tile) - 1
    for (const l of this.layers) {
      const g = l.grid
      const e = scratch.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(l.mesh.matrixWorld).elements
      const p = g.position
      const { sx, sy, cols } = g
      for (let n = 0, q = 0; n < sx.length; n++, q += 3) {
        const x = p[q]!
        const y = p[q + 1]!
        const z = p[q + 2]!
        const w = e[3]! * x + e[7]! * y + e[11]! * z + e[15]!
        const ok = w > 1e-6
        sx[n] = ok ? ((e[0]! * x + e[4]! * y + e[8]! * z + e[12]!) / w * 0.5 + 0.5) * width : NaN
        sy[n] = ok ? ((e[1]! * x + e[5]! * y + e[9]! * z + e[13]!) / w * 0.5 + 0.5) * height : NaN
      }
      const probe = (g.probe.geometry.getIndex()!.array as Uint32Array)
      const all = g.index
      let kept = 0
      let soft = 0
      for (let cj = 0; cj < g.rows - 1; cj++) {
        for (let ci = 0; ci < cols - 1; ci++) {
          const a = cj * cols + ci
          const ax = sx[a]!
          const ay = sy[a]!
          const bx = sx[a + 1]!
          const by = sy[a + 1]!
          const cx = sx[a + cols]!
          const cy = sy[a + cols]!
          const dx = sx[a + cols + 1]!
          const dy = sy[a + cols + 1]!
          const cell = cj * (cols - 1) + ci
          let solid = 0
          let x0 = 0
          let x1 = tc
          let y0 = 0
          let y1 = tr
          if (ax + bx + cx + dx + ay + by + cy + dy === ax + bx + cx + dx + ay + by + cy + dy) {
            const minX = Math.min(ax, bx, cx, dx) - 1
            const maxX = Math.max(ax, bx, cx, dx) + 1
            const minY = Math.min(ay, by, cy, dy) - 1
            const maxY = Math.max(ay, by, cy, dy) + 1
            if (maxX < 0 || minX > width || maxY < 0 || minY > height) continue
            const bi = ci - g.left
            if (bi >= 0 && bi < g.nx && cj < g.ny) {
              const base = cj * g.nx + bi
              const one = g.one[base]!
              const zero = g.zero[base]!
              if (one > 1 || zero > 1) {
                const need = Math.max(reachNeeded(ax, ay, bx, by, cx, cy, g.du, g.dv), reachNeeded(dx, dy, cx, cy, bx, by, g.du, g.dv))
                if (zero >= need) continue
                if (one >= need && (!g.inside || g.inside[base])) solid = 1
              }
            }
            x0 = Math.min(tc, Math.max(0, Math.floor(minX / tile)))
            x1 = Math.min(tc, Math.max(0, Math.floor(maxX / tile)))
            y0 = Math.min(tr, Math.max(0, Math.floor(minY / tile)))
            y1 = Math.min(tr, Math.max(0, Math.floor(maxY / tile)))
          }
          g.cells[kept] = cell
          g.solid[kept] = solid
          g.box[kept * 4] = x0
          g.box[kept * 4 + 1] = x1
          g.box[kept * 4 + 2] = y0
          g.box[kept * 4 + 3] = y1
          kept++
          if (!solid) {
            probe.set(all.subarray(cell * 6, cell * 6 + 6), soft)
            soft += 6
          }
        }
      }
      g.kept = kept
      let end = soft
      for (let k = 0; k < kept; k++) {
        if (!g.solid[k]) continue
        const cell = g.cells[k]!
        probe.set(all.subarray(cell * 6, cell * 6 + 6), end)
        end += 6
      }
      const geo = g.probe.geometry
      const index = geo.getIndex()!
      geo.clearGroups()
      geo.addGroup(0, soft, 0)
      geo.addGroup(soft, end - soft, 1)
      index.addUpdateRange(0, end)
      index.needsUpdate = true
      for (const m of [g.probe, g.veil]) {
        m.visible = end > 0 && l.mesh.visible
        m.matrixWorld.copy(l.mesh.matrixWorld)
      }
    }
    return true
  }

  mark(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    renderer.render(this.probes, camera)
  }

  hide(marks: Uint16Array, tileCols: number): void {
    this.layers.forEach((l, id) => {
      const g = l.grid
      const lean = g.lean.getIndex()!
      const out = lean.array as Uint32Array
      const all = g.index
      const self = 1 | (2 << id)
      let n = 0
      for (let k = 0; k < g.kept; k++) {
        const x0 = g.box[k * 4]!
        const x1 = g.box[k * 4 + 1]!
        const y1 = g.box[k * 4 + 3]!
        let hidden = true
        for (let y = g.box[k * 4 + 2]!; hidden && y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            if (marks[y * tileCols + x]! & self) {
              hidden = false
              break
            }
          }
        }
        if (hidden) continue
        const cell = g.cells[k]!
        out.set(all.subarray(cell * 6, cell * 6 + 6), n)
        n += 6
      }
      g.lean.setDrawRange(0, n)
      lean.addUpdateRange(0, n)
      lean.needsUpdate = true
      l.mesh.geometry = g.lean
    })
  }

  show(): void {
    for (const l of this.layers) l.mesh.geometry = l.grid.full
  }

  // How much of the relief is there, 0 to 1: the premultiplied output of every layer and of the air times the share. A pixel one part of
  // the relief covers is then the picture with the relief times the share plus the picture without it times the rest; where parts lie over
  // one another the one behind shows through the one in front while the share is between 0 and 1. Off until a set calls it: a relief that
  // never does keeps its shaders to the letter and draws as before. The first call gives the materials the shader with the share, which
  // is a new program: call it once where the set is built, so the program is compiled with the others. Under 1 the relief is no shield
  // (screen answers false), so nothing behind it is culled. The share is the set's to give from a height, a distance or an angle, never
  // from a frame number.
  presence(share: number): void {
    if (!(share >= 0 && share <= 1)) throw new Error('the presence of a relief is a share from 0 to 1, not ' + share)
    if (!this.fades) {
      this.fades = true
      const parts: [THREE.ShaderMaterial, string][] = this.layers.map((l) => [l.material, LIT])
      if (this.air) parts.push([this.air.material, AIR_LIT])
      for (const [material, lit] of parts) {
        material.fragmentShader = withPresence(material.fragmentShader, lit)
        material.uniforms.uPresence = this.share
        material.needsUpdate = true
      }
    }
    this.share.value = share
  }

  // Where the relief ends: a feather at each side of the whole source picture, [left, right, bottom, top] in pixels of that picture (the
  // units of the layers' boxes), 0 for a side that does not fade. The sides are those of the layers' boxes taken together, margins and
  // all. The premultiplied output of every layer and of the air is times a share by the place in the picture: 0 at the side and beyond
  // it (so no apron of that side is drawn), 1 one feather inside, smooth between; the same for every layer, so they end along one line
  // on the ground, and the air ends with the far ground under its haze. A share by place, never by the clock. It goes with a presence
  // (the two shares multiply). Off until a set calls it: a relief that never does keeps its shaders to the letter and draws as before.
  // The first call gives the materials the shader with the edge, which is a new program: call it once where the set is built. Inside
  // the feather the relief is no shield, so what lies behind it there is drawn; one feather inside it is the shield it was.
  presenceEdge(feather: readonly [number, number, number, number]): void {
    if (feather.length !== 4 || !feather.every((f) => f >= 0 && Number.isFinite(f))) throw new Error('the edge of a relief is four feathers of 0 or more pixels (left, right, bottom, top), not ' + JSON.stringify(feather))
    const [W, H] = this.def.imageSize
    const boxes = this.def.layers.map((l) => l.box)
    const x0 = Math.min(...boxes.map((b) => b[0]))
    const x1 = Math.max(...boxes.map((b) => b[0] + b[2]))
    const y0 = Math.min(...boxes.map((b) => b[1]))
    const y1 = Math.max(...boxes.map((b) => b[1] + b[3]))
    this.edgeSide.value.set(x0 / W, x1 / W, y1 / H, y0 / H)
    this.edgeOver.value.set(feather[0] > 0 ? W / feather[0] : 0, feather[1] > 0 ? W / feather[1] : 0, feather[2] > 0 ? H / feather[2] : 0, feather[3] > 0 ? H / feather[3] : 0)
    if (!this.edged) {
      this.edged = true
      const th = Math.tan(rad(this.def.vfovDeg) / 2)
      this.edgeFar.value.set(this.far, 1 / (th * W / H), 1 / th)
      for (const l of this.layers) {
        l.material.fragmentShader = withEdge(l.material.fragmentShader, LIT)
        l.material.uniforms.uEdgeSide = this.edgeSide
        l.material.uniforms.uEdgeOver = this.edgeOver
        l.material.needsUpdate = true
      }
      if (this.air) {
        const m = this.air.material
        m.fragmentShader = withEdge(m.fragmentShader, AIR_LIT)
        m.vertexShader = withEdgeEye(m.vertexShader)
        m.uniforms.uEdgeSide = this.edgeSide
        m.uniforms.uEdgeOver = this.edgeOver
        m.uniforms.uEdgeFar = this.edgeFar
        m.uniforms.uEyeScale = this.eyeScale
        m.needsUpdate = true
      }
    }
    const side = this.edgeSide.value.toArray()
    const over = this.edgeOver.value.toArray()
    for (const l of this.layers) {
      const g = l.grid
      const inside = g.inside ?? new Uint8Array(g.nx * g.ny)
      for (let cj = 0; cj < g.ny; cj++) {
        for (let bi = 0; bi < g.nx; bi++) {
          const a = cj * g.cols + bi + g.left
          let whole = 1
          for (const n of [a, a + 1, a + g.cols, a + g.cols + 1]) if (edgeShareAt(g.image[n * 2]!, g.image[n * 2 + 1]!, side, over) < 1) whole = 0
          inside[cj * g.nx + bi] = whole
        }
      }
      g.inside = inside
    }
  }

  static async load(ctx: SetContext, base: string, def: ReliefDef, motion: ReliefMotion): Promise<Relief> {
    const r = new Relief(def, motion)
    const [W, H] = def.imageSize
    const masks = await ctx.texture(base + def.masks, { srgb: false, mips: false })
    const th = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2)
    const aspect = W / H
    const a = motion.air
    if (a) {
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: AIR_VERT,
        fragmentShader: AIR_FRAG,
        uniforms: {
          uUp: { value: new THREE.Vector3(0, Math.cos(rad(a.pitchDeg)), Math.sin(rad(a.pitchDeg))) }, uDip: { value: rad(a.dipDeg) },
          uCool: { value: new THREE.Vector3().fromArray(a.cool) }, uWarm: { value: new THREE.Vector3().fromArray(a.warm) },
          uScale: { value: new THREE.Vector4(rad(a.coolScaleDeg), rad(a.warmScaleDeg), rad(a.starScaleDeg), a.starCut) },
          uSide: { value: new THREE.Vector2().fromArray(a.side) }, uWarmSide: { value: new THREE.Vector4().fromArray(a.warmSide) }, uVeil: { value: a.veil }, uDrift: { value: new THREE.Vector4(0, 1, 0, 1) }, uSpan: { value: th * aspect },
          uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
        },
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), material)
      mesh.frustumCulled = false
      mesh.renderOrder = -1
      r.group.add(mesh)
      r.air = { mesh, material }
    }
    for (let k = 0; k < def.layers.length; k++) {
      const l = def.layers[k]!
      const color = await ctx.texture(base + l.color, { srgb: true, anisotropy: 8 })
      const alphaMips = !motion.apron?.baseAlphaNoMips.some((id) => l.alpha === `relief-${id}-alpha.png`)
      const alpha = l.alpha ? await ctx.texture(base + l.alpha, l.alphaOne ? { srgb: false, anisotropy: 4, mips: alphaMips, channels: 1 } : { srgb: false, anisotropy: 4, mips: alphaMips }) : null
      const dist = new Float32Array(await ctx.buffer(base + l.dist))
      const [dw, dh] = l.distSize
      if (dist.length !== dw * dh) throw new Error('relief distance size mismatch: ' + l.dist)
      const [x0, y0, bw, bh] = l.box
      const nx = Math.max(2, Math.round(bw >= bh ? motion.mesh : (motion.mesh * bw) / bh))
      const ny = Math.max(2, Math.round(bw >= bh ? (motion.mesh * bh) / bw : motion.mesh))
      const apron = motion.apron?.layers.find((a) => l.color === `relief-${a.layer}-color.jpg`)
      const ridge = l.color === `relief-${motion.ridge?.layer}-color.jpg` ? motion.ridge : undefined
      const apronScale = W / (motion.apron?.fullWidth ?? W)
      const apronResolution = motion.apron?.resolution[apronScale === 1 ? 'full' : 'web'] ?? 1
      const left = (apron?.edges[0] ?? 0) * apronScale
      const right = (apron?.edges[1] ?? 0) * apronScale
      const bottom = (apron?.edges[2] ?? 0) * apronScale
      const pad = (motion.apron?.padding ?? 0) * apronScale
      const apronTexture = apron ? await ctx.texture(base + apron.atlas, { srgb: true, anisotropy: 8, mips: motion.apron?.mips }) : null
      const apronSize = apronTexture?.image as { width: number; height: number } | undefined
      const apronDist = apron ? new Float32Array(await ctx.buffer(base + apron.depth)) : null
      const aw = (apronSize?.width ?? 0) / 2
      const ah = (apronSize?.height ?? 0) / 2
      if (apronDist && apronDist.length !== aw * ah) throw new Error('relief apron distance size mismatch: ' + apron?.depth)
      const nl = Math.ceil(left * nx / bw)
      const nr = Math.ceil(right * nx / bw)
      const nb = Math.ceil(bottom * ny / bh)
      const cols = nl + nx + nr + 1
      const rows = ny + nb + 1
      const position = new Float32Array(cols * rows * 3)
      const uv = new Float32Array(cols * rows * 2)
      const image = new Float32Array(cols * rows * 2)
      const sample = (data: Float32Array, width: number, height: number, x: number, y: number): number => {
        const px = Math.min(Math.max(x - 0.5, 0), width - 1)
        const py = Math.min(Math.max(y - 0.5, 0), height - 1)
        const ix = Math.min(Math.floor(px), width - 2)
        const iy = Math.min(Math.floor(py), height - 2)
        const tx = px - ix
        const ty = py - iy
        const a = data[iy * width + ix]!
        const b = data[iy * width + ix + 1]!
        const c = data[(iy + 1) * width + ix]!
        const d = data[(iy + 1) * width + ix + 1]!
        return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
      }
      const distance = (fx: number, fy: number): number => {
        if (!apronDist || (fx >= 0 && fx <= 1 && fy <= 1)) {
          const d = sample(dist, dw, dh, fx * dw, fy * dh)
          if (!ridge) return d
          const y = (y0 + fy * bh) / H - ridge.center[1]!
          const x = (x0 + fx * bw) / W - ridge.center[0]! - ridge.slope * y
          const weight = 1 - THREE.MathUtils.smoothstep(Math.hypot(x / ridge.radius[0]!, y / ridge.radius[1]!), ridge.core, 1)
          if (!weight) return d
          const mid = (ridge.taps.length - 1) / 2
          let sum = 0
          let total = 0
          for (const [j, wy] of ridge.taps.entries()) {
            const sy = fy + (j - mid) * ridge.interval[1]! * H / bh
            for (const [i, wx] of ridge.taps.entries()) {
              const sx = fx + (i - mid) * ridge.interval[0]! * W / bw
              const w = wx * wy
              sum += w / sample(dist, dw, dh, sx * dw, sy * dh)
              total += w
            }
          }
          return THREE.MathUtils.lerp(d, total / sum, weight)
        }
        const px = fx * bw
        const py = fy * bh
        const side = bottom ? bottom + pad : 0
        const texel = 1 / apronResolution
        const s = apronResolution / 2
        if (fy > 1) return sample(apronDist, aw, ah, Math.min(Math.max(px + left, texel), bw + left + right - texel) * s, Math.min(py - bh + pad, side - texel) * s)
        if (fx < 0) return sample(apronDist, aw, ah, py * s, (side + Math.max(px + left, texel)) * s)
        const start = side + (left ? left + pad : 0)
        return sample(apronDist, aw, ah, py * s, (start + Math.min(px - bw + pad, right + pad - texel)) * s)
      }
      let n = 0
      for (let j = 0; j < rows; j++) {
        for (let i = -nl; i <= nx + nr; i++) {
          const fx = i < 0 ? i * left / (nl * bw) : i > nx ? 1 + (i - nx) * right / (nr * bw) : i / nx
          const fy = j > ny ? 1 + (j - ny) * bottom / (nb * bh) : j / ny
          const ix = (x0 + fx * bw) / W
          const iy = (y0 + fy * bh) / H
          const dir = new THREE.Vector3((2 * ix - 1) * th * aspect, (1 - 2 * iy) * th, -1).normalize()
          const dd = distance(fx, fy)
          if (fx >= 0 && fx <= 1 && fy <= 1 && dd > r.far) r.far = dd
          position[n * 3] = dir.x * dd
          position[n * 3 + 1] = dir.y * dd
          position[n * 3 + 2] = dir.z * dd
          uv[n * 2] = fx
          uv[n * 2 + 1] = 1 - fy
          image[n * 2] = ix
          image[n * 2 + 1] = iy
          n++
        }
      }
      const index = new Uint32Array((cols - 1) * (rows - 1) * 6)
      let m = 0
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = j * cols + i
          const b = a + 1
          const c = a + cols
          const d = c + 1
          index[m++] = a; index[m++] = c; index[m++] = b
          index[m++] = b; index[m++] = c; index[m++] = d
        }
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      geo.setAttribute('aImage', new THREE.BufferAttribute(image, 2))
      geo.setIndex(new THREE.BufferAttribute(index, 1))
      const size = color.image as unknown as { width: number; height: number }
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        ...(apronTexture ? { defines: { RELIEF_APRON: 1 } } : {}),
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          ...(apron && apronTexture && apronSize ? {
            uApron: { value: apronTexture }, uApronSize: { value: new THREE.Vector2(apronSize.width / apronResolution, apronSize.height / apronResolution) },
            uApronEdges: { value: new THREE.Vector4(left, right, bottom, pad) },
            uApronBottomShear: { value: new THREE.Vector3().fromArray(apron.bottomColorShear) },
            uApronRightShear: { value: new THREE.Vector4().fromArray(apron.rightColorShear) },
          } : {}),
          uColor: { value: color }, uAlpha: { value: alpha ?? color }, uMasks: { value: masks }, uHasAlpha: { value: alpha ? 1 : 0 },
          uSize: { value: new THREE.Vector2(size.width, size.height) }, uMaskBox: { value: new THREE.Vector4(def.maskBox[0] / W, def.maskBox[1] / H, def.maskBox[2] / W, def.maskBox[3] / H) }, uToLayer: { value: new THREE.Vector2(W / bw, H / bh) },
          uMist: { value: new THREE.Vector2() }, uDust: { value: new THREE.Vector2() }, uGain: { value: 1 }, uVignette: { value: 0 },
          uAspect: { value: 16 / 9 }, uLayer: { value: new THREE.Vector3().fromArray(l.tint) }, uDiag: diagUniform, uGrad: gradUniform, uFine: fineUniform, uBias: biasUniform,
          uUpL: { value: new THREE.Vector3(0, Math.cos(rad(motion.pitchDeg ?? 0)), Math.sin(rad(motion.pitchDeg ?? 0))) }, uValley: { value: new THREE.Vector4(0, 1, 0, 0) }, uValleyFlow: { value: new THREE.Vector4(1, 0, 0, 0) }, uValleyShape: { value: new THREE.Vector4(1, 1, 0, 1) }, uValleyColor: { value: new THREE.Vector3() },
        },
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true,
      })
      const mesh = new THREE.Mesh(geo, material)
      mesh.frustumCulled = false
      mesh.renderOrder = k
      r.group.add(mesh)
      const part = (): THREE.BufferGeometry => {
        const copy = new THREE.BufferGeometry()
        for (const name of ['position', 'uv', 'aImage']) copy.setAttribute(name, geo.getAttribute(name))
        const own = new THREE.BufferAttribute(new Uint32Array(index.length), 1)
        own.setUsage(THREE.DynamicDrawUsage)
        copy.setIndex(own)
        return copy
      }
      const probe = new THREE.Mesh(part(), [r.none, marker(k + 1)])
      const veil = new THREE.Mesh(probe.geometry, [r.soft, r.none])
      probe.renderOrder = k
      veil.renderOrder = def.layers.length + k
      for (const m of [probe, veil]) {
        m.frustumCulled = false
        m.matrixAutoUpdate = false
        m.matrixWorldAutoUpdate = false
        r.probes.add(m)
      }
      const cellCount = (cols - 1) * (rows - 1)
      r.layers.push({ mesh, material, grid: {
        cols, rows, left: nl, nx, ny, position, index, alpha, one: new Uint8Array(0), zero: new Uint8Array(0), du: 1, dv: 1, full: geo, lean: part(), probe, veil,
        sx: new Float64Array(cols * rows), sy: new Float64Array(cols * rows), cells: new Uint32Array(cellCount), solid: new Uint8Array(cellCount), box: new Int16Array(cellCount * 4), kept: 0, inside: null, image,
      } })
    }
    return r
  }

  update(dt: number, gain: number, vignette: number, view: RenderView): void {
    const d = this.def
    const m = this.motion
    this.group.updateWorldMatrix(true, false)
    const e = this.group.matrixWorld.elements
    const s2 = e[0]! * e[0]! + e[1]! * e[1]! + e[2]! * e[2]!
    const plain = Math.abs(s2 - 1) < EYE_PLAIN
    if (!plain && !this.scaled) {
      this.scaled = true
      for (const l of this.layers) {
        l.material.vertexShader = withEyeScale(l.material.vertexShader)
        l.material.uniforms.uEyeScale = this.eyeScale
        l.material.needsUpdate = true
      }
    }
    this.eyeScale.value = plain ? 1 : 1 / s2
    if (this.air) {
      const u = this.air.material.uniforms
      const f = m.air?.drift
      if (f) (u.uDrift!.value as THREE.Vector4).set(f[0], f[1], f[2] * dt + 40, f[3])
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uAspect!.value = view.format.width / view.format.height
    }
    for (const l of this.layers) {
      const u = l.material.uniforms
      ;(u.uMist!.value as THREE.Vector2).set(d.mistDir[0] * m.mistSpeed * dt, d.mistDir[1] * m.mistSpeed * dt)
      ;(u.uDust!.value as THREE.Vector2).set(m.dustDir[0] * m.dustSpeed * dt, m.dustDir[1] * m.dustSpeed * dt)
      const v = m.valley
      if (v) {
        const wl = Math.hypot(v.wind[0], v.wind[1])
        ;(u.uValley!.value as THREE.Vector4).set(v.top, v.soft, v.strength * v.mask[1], v.mask[0] / Math.max(v.mask[1], 1e-6))
        ;(u.uValleyFlow!.value as THREE.Vector4).set(v.wind[0] / wl, v.wind[1] / wl, v.speed * dt, v.churn * dt)
        ;(u.uValleyShape!.value as THREE.Vector4).set(v.scale, v.stretch, v.cut[0], v.cut[1])
        ;(u.uValleyColor!.value as THREE.Vector3).fromArray(v.color)
      }
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uAspect!.value = view.format.width / view.format.height
    }
  }

  dispose(): void {
    if (this.air) {
      this.air.mesh.geometry.dispose()
      this.air.material.dispose()
    }
    this.soft.dispose()
    this.none.dispose()
    for (const l of this.layers) {
      l.grid.full.dispose()
      l.grid.lean.dispose()
      l.grid.probe.geometry.dispose()
      ;(l.grid.probe.material as THREE.Material[])[1]!.dispose()
      l.material.dispose()
    }
  }
}
