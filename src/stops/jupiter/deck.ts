import * as THREE from 'three'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { PALL_GLSL, type PallLook } from './pall'

export interface DeckMeta {
  canvas: number[]; origin: number[]; image: number[]; focalPx: number; cell: number; grid: number[]
  nadir: number[]; radius: number; tangent: number
  sets: Record<string, { wide: number[]; core: number[] }>
}

export interface DeckTiers { box: number[]; rise: number[]; top: number; layers: { lift: number; taper: number[] }[] }

export interface Vortex { px: [number, number]; axes: [number, number]; degPerSecond: number; wispDegPerSecond: number }
export interface Flash { px: [number, number]; sizePx: number; period: number; phase: number; gain: number }

export interface DeckLook {
  skyRimDeg: number
  edgePixels: number
  vortices: Vortex[]
  collar: [number, number, number]
  tone: [number, number, number, number, number]
  toneHigh: [number, number, number]
  settle: number
  wisp: { tile: number; amount: number; shadow: number; shadowLength: number; fine: number; drift: [number, number]; fade: [number, number]; sun: [number, number] }
  haze: { color: [number, number, number]; tile: number; layer: number; height: number; clear: [number, number]; gather: [number, number]; tone: [number, number, number, number] }
  depth: number
  depthBorder: number
  pall: PallLook
  flashes: Flash[]
  flashColor: [number, number, number]
  flashBody: [number, number]
  beyond: [number, number, number]
  detail: [number, number, number, number]
}

const VORTICES = 6
const FLASHES = 10

const WARP_GLSL = /* glsl */ `
uniform float uFocal;
uniform float uRadius;
uniform vec3 uS;
uniform vec3 uEx;
uniform vec3 uEy;
uniform vec3 uEn;
uniform vec4 uVortex[${VORTICES}];
uniform vec2 uTurn[${VORTICES}];
uniform vec3 uCollar;
uniform vec4 uWispMove;
vec2 toPx(vec2 g) {
  vec3 p = uS + uEx * g.x + uEy * g.y - uEn * (dot(g, g) / (2.0 * uRadius));
  return vec2(uFocal * p.x / -p.z, -uFocal * p.y / -p.z);
}
vec2 swirl(vec2 g, int k) {
  vec2 d = vec2(0.0);
  for (int i = 0; i < ${VORTICES}; i++) {
    vec2 q = (g - uVortex[i].xy) / uVortex[i].zw;
    float r2 = dot(q, q);
    float wide = r2 / (uCollar.z * uCollar.z);
    float a = -uTurn[i][k] * (1.0 / (1.0 + r2 * r2) + (i == 0 ? uCollar[k] : 0.0) / (1.0 + wide * wide));
    float c = cos(a);
    float s = sin(a);
    d += (vec2(c * q.x - s * q.y, s * q.x + c * q.y) - q) * uVortex[i].zw;
  }
  return g + d;
}`

const VERT = /* glsl */ `
in vec2 aPx;
in vec2 aGround;
out vec2 vPx;
out vec2 vGround;
out vec3 vView;
out vec3 vClip;
out vec3 vLocal;
out vec3 vEye;
uniform vec2 uTierRise;
uniform vec2 uTierLift;
uniform vec4 uTierTaper;
${WARP_GLSL}
void main() {
  vPx = aPx;
  vGround = aGround;
  vLocal = position;
  vEye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz;
  float scale = 1.0;
#if LAYER > 0
  float nearby = 1.0 - smoothstep(uWispMove.z, uWispMove.w, length(position - vEye));
  vec2 at = aPx + (toPx(swirl(aGround, 0)) - toPx(aGround)) * nearby;
  float rise = clamp((uTierRise.y - max(at.y, aPx.y)) / (uTierRise.y - uTierRise.x), 0.0, 1.0);
  scale -= uTierLift.x * rise * (1.0 - smoothstep(uTierTaper.x, uTierTaper.y, at.x));
#endif
#if LAYER > 1
  scale -= uTierLift.y * rise * (1.0 - smoothstep(uTierTaper.z, uTierTaper.w, at.x));
#endif
  vec4 mv = modelViewMatrix * vec4(position * scale, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uWide;
uniform sampler2D uCore;
uniform sampler2D uWisp;
uniform sampler2D uTiers;
uniform sampler2D uUnder;
uniform vec4 uTierBox;
uniform vec2 uUnderSize;
uniform vec2 uCanvas;
uniform vec2 uOrigin;
uniform vec2 uImage;
uniform vec2 uWideSize;
uniform vec2 uCoreSize;
uniform vec3 uCentre;
uniform float uEdge;
uniform vec3 uTone;
uniform vec3 uToneHigh;
uniform vec2 uToneRange;
uniform vec4 uWispShape;
uniform vec4 uWispSun;
uniform vec4 uFlash[${FLASHES}];
uniform vec3 uFlashColor;
uniform vec2 uFlashBody;
uniform vec3 uBeyond;
uniform vec4 uDetail;
uniform vec4 uHaze;
uniform vec4 uHazeColor;
uniform vec4 uHazeTone;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uGrad;
in vec2 vPx;
in vec2 vGround;
in vec3 vView;
in vec3 vClip;
in vec3 vLocal;
in vec3 vEye;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${PALL_GLSL}
${WARP_GLSL}
void main() {
  vec3 ray = normalize(vLocal - vEye);
  vec3 toC = uCentre - vEye;
  float along = dot(toC, ray);
  float miss = sqrt(max(dot(toC, toC) - along * along, 0.0)) - uRadius;
  float soft = max(fwidth(miss), 1e-7) * uEdge;
  float alpha = along > 0.0 ? 1.0 - smoothstep(-soft, soft, miss) : 0.0;
  float reach = length(vLocal - vEye);
  float nearby = 1.0 - smoothstep(uWispMove.z, uWispMove.w, reach);
  vec2 warped = vGround;
  vec2 wispG = vGround;
  for (int k = 0; k < (nearby > 0.0 ? 1 : 0); k++) {
    warped = swirl(vGround, 0);
    wispG = swirl(vGround, 1);
  }
  vec2 shift = (toPx(warped) - toPx(vGround)) * nearby;
  vec2 px = vPx + shift;
  vec2 gx = dFdx(vPx) * uGrad;
  vec2 gy = dFdy(vPx) * uGrad;
  vec2 tb = (px - uTierBox.xy) * uTierBox.zw;
  vec2 tuv = vec2(tb.x, 1.0 - tb.y);
  vec3 tier = textureGrad(uTiers, tuv, gx * uTierBox.zw, gy * uTierBox.zw).rgb;
#if LAYER == 0
  float matte = 1.0;
  float plate = tier.b * (1.0 - tier.g);
#elif LAYER == 1
  float matte = tier.r;
  float plate = tier.b * tier.g;
#else
  float matte = tier.g;
  float plate = 0.0;
#endif
  vec2 ip = px - uOrigin;
  vec2 e = min(ip, uImage - ip);
  float inCore = smoothstep(4.0, 28.0, min(e.x, e.y));
  vec3 wide = vec3(0.0);
  vec3 core = vec3(0.0);
  for (int k = 0; k < (inCore < 1.0 ? 1 : 0); k++) wide = textureGrad(uWide, vec2(px.x, uCanvas.y - px.y) / uCanvas, gx / uCanvas, gy / uCanvas).rgb;
  for (int k = 0; k < (inCore > 0.0 ? 1 : 0); k++) core = textureGrad(uCore, vec2(ip.x, uImage.y - ip.y) / uImage, gx / uImage, gy / uImage).rgb;
  vec3 texel = mix(wide, core, inCore);
  for (int k = 0; k < (plate > 0.0 ? 1 : 0); k++) texel = mix(texel, textureGrad(uUnder, tuv, gx * uTierBox.zw, gy * uTierBox.zw).rgb, plate);
  vec2 out2 = max(max(-px, px - uCanvas), vec2(0.0));
  float off = smoothstep(0.0, uBeyond.z, max(out2.x, out2.y));
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float pix = length(vec2(dFdx(q.y), dFdy(q.y)));
  vec2 ax = dFdx(vPx);
  vec2 ay = dFdy(vPx);
  float mag = uImage.y * pix / sqrt(max(abs(ax.x * ay.y - ax.y * ay.x), 1e-9));
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = inverseFilmic(texel);
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= mix(uTone, uToneHigh, smoothstep(uToneRange.x, uToneRange.y, lum));
  col = mix(col, lum * uBeyond.x + vec3(uBeyond.y), off);
  vec2 wx = dFdx(vGround) * uWispShape.x;
  vec2 wy = dFdy(vGround) * uWispShape.x;
  for (int k = 0; k < (nearby * alpha > 0.0 ? 1 : 0); k++) {
    vec2 wuv = (wispG - uWispMove.xy) * uWispShape.x;
    vec2 fine = textureGrad(uWisp, wuv, wx * uGrad, wy * uGrad).rg;
    float body = fine.r + (fine.g - 0.5) * uWispSun.z;
    float shade = textureGrad(uWisp, wuv + uWispSun.xy * uWispShape.w * uWispShape.x, wx * 3.0, wy * 3.0).r;
    float wv = ((body - 0.5) * uWispShape.y - (shade - 0.5) * uWispShape.z) * nearby;
    float open = smoothstep(uDetail.z, uDetail.w, mag) * nearby;
    for (int j = 0; j < (open > 0.0 ? 1 : 0); j++) {
      vec2 duv = warped * uDetail.y;
      vec2 dx = wx / uWispShape.x * uDetail.y * uGrad;
      vec2 dy = wy / uWispShape.x * uDetail.y * uGrad;
      vec2 a1 = textureGrad(uWisp, duv, dx, dy).rg;
      float a2 = textureGrad(uWisp, duv * 2.7 + 0.31, dx * 2.7, dy * 2.7).g;
      wv += uDetail.x * open * ((a1.r - 0.5) + 0.7 * (a1.g - 0.5) + 0.6 * (a2 - 0.5));
    }
    col *= max(1.0 + wv, 0.0);
  }
  vec3 flash = vec3(0.0);
  for (int i = 0; i < ${FLASHES}; i++) {
    for (int k = 0; k < (uFlash[i].w > 0.0 ? 1 : 0); k++) {
      vec2 d = px - uFlash[i].xy;
      flash += uFlashColor * uFlash[i].w * exp(-dot(d, d) * uFlash[i].z);
    }
  }
  col += flash * (uFlashBody.x + uFlashBody.y * lum) * alpha;
  float fog = 0.0;
  float fogTone = 1.0;
  vec3 fogColor = uHazeColor.rgb;
  for (int k = 0; k < (uHaze.x > 0.0 ? 1 : 0); k++) {
    vec3 hp = vEye + (vLocal - vEye) * uHaze.z - uS;
    vec2 hg = vec2(dot(hp, uEx), dot(hp, uEy) * 0.35) * uHaze.y;
    float hv = 0.62 * textureLod(uWisp, hg, 3.0).r + 0.38 * textureLod(uWisp, hg * 2.7 + 0.37, 3.0).r;
    float patchy = 1.0 - smoothstep(2.5, 7.0, reach);
    float thick = 1.0 - exp(-uHaze.x * reach * mix(1.05, 0.35 + 1.4 * smoothstep(0.25, 0.75, hv), patchy));
    float dC = length(toC);
    float elev = asin(clamp((miss + uRadius) / dC, 0.0, 1.0)) - asin(clamp(uRadius / dC, 0.0, 1.0));
    float above = exp(-max(elev, 0.0) / uHaze.w) * (1.0 - smoothstep(uHazeColor.a * 0.45, uHazeColor.a * 0.85, elev));
    fog = thick * (alpha + (1.0 - alpha) * above);
    fogTone = 1.0 + 0.4 * (hv - 0.5) * patchy;
    vec3 mass = inverseFilmic(textureLod(uWide, vec2(px.x, uCanvas.y - px.y - uHazeTone.w * (1.0 - patchy)) / uCanvas, uHazeTone.x).rgb) * uTone;
    fogColor = mix(uHazeColor.rgb, mass * uHazeTone.z, uHazeTone.y);
  }
  float held = 1.0;
  for (int k = 0; k < (uPallSea.w > 0.0 ? 1 : 0); k++) held = mix(1.0, pallReach(vClip.xy / vClip.z), uPallSea.w);
  col = (col * (1.0 - fog) + fogColor * fogTone * fog) * uGain * vig * held;
  alpha *= held;
  bool gone = matte <= 0.0 || (uDiag >= 2 && alpha * matte < 0.5);
  alpha += (1.0 - alpha) * fog * held;
  float texels = mix(mix(diagTexels(px / uCanvas * uWideSize), diagTexels(ip / uImage * uCoreSize), inCore), diagTexels(tb * uUnderSize), plate);
#if LAYER == 0
  vec4 lit = vec4(col, alpha);
  vec3 tint = mix(mix(vec3(0.3, 0.5, 0.85), vec3(0.85, 0.45, 0.25), inCore), vec3(0.6, 0.3, 0.8), plate);
  tint = mix(tint, vec3(1.0, 0.0, 0.0), step(0.5, tier.r) * step(plate, 0.5));
#else
  vec4 lit = vec4(col * matte, matte);
  vec3 tint = LAYER == 1 ? mix(vec3(0.45, 0.8, 0.4), vec3(0.2, 0.75, 0.75), plate) : vec3(0.9, 0.8, 0.3);
  tint = mix(tint, vec3(1.0, 0.0, 0.0), LAYER == 1 ? step(0.5, tier.g) * step(plate, 0.5) : 0.0);
#endif
  outColor = diagOut(lit, texels, 1.0, tint, shift * 0.05, length(vView));
  if (gone) discard;
}`

export class Deck {
  readonly group = new THREE.Group()
  readonly material: THREE.ShaderMaterial
  private readonly turn: THREE.Vector2[] = []

  private constructor(private readonly look: DeckLook, private readonly geometries: THREE.BufferGeometry[], private readonly materials: THREE.ShaderMaterial[]) {
    this.material = materials[0]!
    for (let i = 0; i < VORTICES; i++) this.turn.push(new THREE.Vector2())
    this.material.uniforms.uTurn = { value: this.turn }
    geometries.forEach((geometry, n) => {
      const mesh = new THREE.Mesh(geometry, materials[n]!)
      mesh.frustumCulled = false
      mesh.renderOrder = n
      this.group.add(mesh)
    })
  }

  static async load(ctx: SetContext, base: string, meta: DeckMeta, look: DeckLook, tiers: DeckTiers, wisp: THREE.Texture, pall: Record<string, THREE.IUniform>): Promise<Deck> {
    const sizes = meta.sets[ctx.assets]!
    const wide = await ctx.texture(base + 'deck-wide.jpg', { srgb: true, anisotropy: 16 })
    const core = await ctx.texture(base + 'deck-core.jpg', { srgb: true, anisotropy: 16 })
    const under = await ctx.texture(base + 'deck-under.jpg', { srgb: true, anisotropy: 16 })
    const mattes = await ctx.texture(base + 'deck-tiers.png', { srgb: false, anisotropy: 16 })
    const dist = new Float32Array(await ctx.buffer(base + 'deck-dist.bin'))
    const [gw, gh] = meta.grid as [number, number]
    if (dist.length !== gw * gh) throw new Error('deck distance grid size mismatch')
    const [ox, oy] = meta.origin as [number, number]
    const [iw, ih] = meta.image as [number, number]
    const f = meta.focalPx
    const nadir = new THREE.Vector3().fromArray(meta.nadir)
    const centre = nadir.clone().multiplyScalar(meta.radius + 1)
    const ray = (x: number, y: number) => new THREE.Vector3(x - iw / 2, -(y - ih / 2), -f).normalize()
    const hit = (d: THREE.Vector3): number => {
      const b = d.dot(centre)
      const disc = b * b - (centre.lengthSq() - meta.radius * meta.radius)
      return disc > 0 ? b - Math.sqrt(disc) : meta.tangent
    }
    const anchor = look.vortices[0]!.px
    const sRay = ray(anchor[0], anchor[1])
    const s = sRay.clone().multiplyScalar(hit(sRay))
    const en = s.clone().sub(centre).normalize()
    const ey = sRay.clone().addScaledVector(en, -sRay.dot(en)).normalize()
    const ex = new THREE.Vector3().crossVectors(ey, en)
    const ground = (x: number, y: number): [number, number] => {
      const d = ray(x, y)
      const p = d.multiplyScalar(hit(d)).sub(s)
      return [p.dot(ex), p.dot(ey)]
    }

    const position = new Float32Array(gw * gh * 3)
    const px = new Float32Array(gw * gh * 2)
    const gr = new Float32Array(gw * gh * 2)
    const high = new Uint8Array(gw * gh)
    const cosLimit = Math.cos(Math.asin(meta.radius / (meta.radius + 1)) + THREE.MathUtils.degToRad(look.skyRimDeg))
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i
        const cx = i * meta.cell
        const cy = j * meta.cell
        const d = ray(cx - ox, cy - oy)
        high[k] = d.dot(nadir) < cosLimit ? 1 : 0
        const g = ground(cx - ox, cy - oy)
        const base = hit(d)
        const ratio = dist[k]! / base
        d.multiplyScalar(ratio > 0 ? base * Math.pow(ratio, 1 + (look.depth - 1) * THREE.MathUtils.smoothstep(Math.min(i, gw - 1 - i, gh - 1 - j) * meta.cell, 0, look.depthBorder)) : dist[k]!)
        position[k * 3] = d.x
        position[k * 3 + 1] = d.y
        position[k * 3 + 2] = d.z
        px[k * 2] = cx
        px[k * 2 + 1] = cy
        gr[k * 2] = g[0]
        gr[k * 2 + 1] = g[1]
      }
    }
    const index: number[][] = [[], [], []]
    for (let j = 0; j < gh - 1; j++) {
      for (let i = 0; i < gw - 1; i++) {
        const a = j * gw + i
        const b = a + 1
        const c = a + gw
        const d = c + 1
        if (high[a]! + high[b]! + high[c]! + high[d]! === 4) continue
        index[0]!.push(a, c, b, b, c, d)
        if ((j + 1) * meta.cell < tiers.top) continue
        index[1]!.push(a, c, b, b, c, d)
        index[2]!.push(a, c, b, b, c, d)
      }
    }
    const attributes = { position: new THREE.BufferAttribute(position, 3), aPx: new THREE.BufferAttribute(px, 2), aGround: new THREE.BufferAttribute(gr, 2) }
    const geometries = index.map((list) => {
      const geometry = new THREE.BufferGeometry()
      for (const [name, attribute] of Object.entries(attributes)) geometry.setAttribute(name, attribute)
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(list), 1))
      return geometry
    })

    const vortex: THREE.Vector4[] = []
    for (let i = 0; i < VORTICES; i++) {
      const v = look.vortices[i]
      if (!v) { vortex.push(new THREE.Vector4(1e6, 1e6, 1, 1)); continue }
      const g = ground(v.px[0], v.px[1])
      vortex.push(new THREE.Vector4(g[0], g[1], v.axes[0], v.axes[1]))
    }
    const flash: THREE.Vector4[] = []
    for (let i = 0; i < FLASHES; i++) {
      const fl = look.flashes[i]
      flash.push(fl ? new THREE.Vector4(fl.px[0] + ox, fl.px[1] + oy, 1 / (fl.sizePx * fl.sizePx), 0) : new THREE.Vector4(0, 0, 0, 0))
    }
    const w = look.wisp
    const sunLen = Math.hypot(w.sun[0], w.sun[1])
    const box = tiers.box as [number, number, number, number]
    const plate = under.image as unknown as { width: number; height: number }
    const uniforms: Record<string, THREE.IUniform> = {
        uWide: { value: wide }, uCore: { value: core }, uWisp: { value: wisp },
        uTiers: { value: mattes }, uUnder: { value: under }, uTierBox: { value: new THREE.Vector4(box[0], box[1], 1 / (box[2] - box[0]), 1 / (box[3] - box[1])) }, uUnderSize: { value: new THREE.Vector2(plate.width, plate.height) },
        uTierRise: { value: new THREE.Vector2().fromArray(tiers.rise) }, uTierLift: { value: new THREE.Vector2(tiers.layers[0]!.lift, tiers.layers[1]!.lift) }, uTierTaper: { value: new THREE.Vector4(...tiers.layers[0]!.taper, ...tiers.layers[1]!.taper) },
        uCanvas: { value: new THREE.Vector2().fromArray(meta.canvas) }, uOrigin: { value: new THREE.Vector2(ox, oy) }, uImage: { value: new THREE.Vector2(iw, ih) },
        uWideSize: { value: new THREE.Vector2().fromArray(sizes.wide) }, uCoreSize: { value: new THREE.Vector2().fromArray(sizes.core) },
        uFocal: { value: f }, uCentre: { value: centre }, uRadius: { value: meta.radius }, uEdge: { value: look.edgePixels },
        uS: { value: s }, uEx: { value: ex }, uEy: { value: ey }, uEn: { value: en },
        uVortex: { value: vortex }, uCollar: { value: new THREE.Vector3().fromArray(look.collar) },
        uTone: { value: new THREE.Vector3(look.tone[0], look.tone[1], look.tone[2]) }, uToneHigh: { value: new THREE.Vector3().fromArray(look.toneHigh) }, uToneRange: { value: new THREE.Vector2(look.tone[3], look.tone[4]) },
        uWispShape: { value: new THREE.Vector4(1 / w.tile, w.amount, w.shadow, w.shadowLength) },
        uWispMove: { value: new THREE.Vector4(0, 0, w.fade[0], w.fade[1]) },
        uWispSun: { value: new THREE.Vector4(w.sun[0] / sunLen, w.sun[1] / sunLen, w.fine, 0) },
        uFlash: { value: flash }, uFlashColor: { value: new THREE.Vector3().fromArray(look.flashColor) }, uFlashBody: { value: new THREE.Vector2().fromArray(look.flashBody) },
        uBeyond: { value: new THREE.Vector3().fromArray(look.beyond) }, uDetail: { value: new THREE.Vector4(look.detail[0], 1 / look.detail[1], look.detail[2], look.detail[3]) },
        uHaze: { value: new THREE.Vector4(0, 1 / look.haze.tile, look.haze.layer, THREE.MathUtils.degToRad(look.haze.height)) }, uHazeColor: { value: new THREE.Vector4(look.haze.color[0], look.haze.color[1], look.haze.color[2], THREE.MathUtils.degToRad(look.skyRimDeg)) }, uHazeTone: { value: new THREE.Vector4().fromArray(look.haze.tone) },
        uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform, uGrad: gradUniform,
        ...pall,
    }
    const materials = geometries.map((_, n) => new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      defines: { LAYER: n },
      uniforms,
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: n === 0 ? THREE.OneFactor : THREE.DstAlphaFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: true,
    }))
    return new Deck(look, geometries, materials)
  }

  update(dt: number, gain: number, vignette: number, view: RenderView, haze: number): void {
    const l = this.look
    const u = this.material.uniforms
    ;(u.uHaze!.value as THREE.Vector4).x = haze
    const calm = dt / Math.sqrt(1 + (dt / l.settle) * (dt / l.settle))
    for (let i = 0; i < VORTICES; i++) {
      const v = l.vortices[i]
      this.turn[i]!.set(v ? THREE.MathUtils.degToRad(v.degPerSecond) * calm : 0, v ? THREE.MathUtils.degToRad(v.wispDegPerSecond) * calm : 0)
    }
    const move = u.uWispMove!.value as THREE.Vector4
    move.x = l.wisp.drift[0] * dt
    move.y = l.wisp.drift[1] * dt
    const flashes = u.uFlash!.value as THREE.Vector4[]
    for (let i = 0; i < FLASHES; i++) {
      const fl = l.flashes[i]
      if (!fl) continue
      const x = ((((dt / fl.period + fl.phase) % 1) + 1) % 1) * fl.period
      const first = Math.exp(-x / 0.07) * (0.55 + 0.45 * Math.cos(70 * x)) ** 2
      const second = x > 0.19 ? 0.6 * Math.exp(-(x - 0.19) / 0.05) : 0
      flashes[i]!.w = fl.gain * (first + second)
    }
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = view.format.width / view.format.height
  }

  dispose(): void {
    for (const geometry of this.geometries) geometry.dispose()
    for (const material of this.materials) material.dispose()
  }
}
