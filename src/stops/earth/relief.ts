import * as THREE from 'three'
import { frameUniform } from '../../core/frame'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, biasUniform, diagUniform, fineUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { NOISE_GLSL } from '../../terrain/relief'
import { SHARE_GLSL, VEIL_GLSL } from './globe'

type Box = [number, number, number, number]

export interface GroundDef {
  imageSize: [number, number]
  vfovDeg: number
  nadir: [number, number, number]
  radius: number
  ground: { file: string; box: Box; top: number; fade: number; under?: number; skip?: number; horizon: number[]; horizonSpan: [number, number] }
  towers?: { file: string; dist: string; body?: string; edge?: number[]; cut?: number; range?: number; stretch?: number; lit?: number[]; face?: number[]; thin?: number; box: Box; distSize: [number, number] }
  masks?: { file: string; box: Box }
  low?: { file: string }
}

export interface GroundLook {
  mesh: number
  towerMesh: number
  drift: [number, number]
  fold: number
  shimmer: [number, number, number, number]
  lock: [number, number]
  bloom: number
  plain: [number, number]
}

export interface GroundOnGlobe { farDeg: number[]; rim: number[]; rimNear: number[]; arrive: number[]; share: number[]; level: number[]; toneTimes: number; light: Record<string, THREE.IUniform>; veil: { map: THREE.Texture; plane: THREE.Matrix3; fromDeg: number[] } }

function unpack(buffer: ArrayBuffer, size: number, file: string): Float32Array {
  const count = new Uint32Array(buffer, 0, 1)[0]!
  const runs = new Uint32Array(buffer, 4, 2 * count)
  const values = new Float32Array(buffer, 4 + 8 * count)
  const out = new Float32Array(size)
  let at = 0
  for (let i = 0; i < count; i++) {
    const start = runs[2 * i]!
    const length = runs[2 * i + 1]!
    if (start + length > size || at + length > values.length) throw new Error('relief field size mismatch: ' + file)
    out.set(values.subarray(at, at + length), start)
    at += length
  }
  if (at !== values.length) throw new Error('relief field size mismatch: ' + file)
  return out
}

const VERT = /* glsl */ `
uniform vec3 uEye;
uniform vec4 uSea;
uniform vec2 uLock;
uniform vec4 uShow;
in vec2 aImage;
out vec2 vImage;
out vec2 vUv;
out vec3 vView;
out vec3 vClip;
out vec3 vLocal;
out vec3 vNormal;
in float aHalf;
out float vHalf;
vec3 place(vec3 p) {
  float reach = length(p);
  vec3 d = p / reach;
  float c0 = length(uSea.xyz);
  vec3 n0 = uSea.xyz / c0;
  float up0 = acos(clamp(dot(d, n0), -1.0, 1.0));
  float lift = up0 - asin(uSea.w / c0);
  vec3 to = uSea.xyz - uEye;
  float c1 = length(to);
  vec3 n1 = to / c1;
  vec3 v = d * max(reach, sqrt(c0 * c0 - uSea.w * uSea.w)) - uEye;
  float far = length(v);
  vec3 w = v / far;
  float along = clamp(dot(w, n1), -1.0, 1.0);
  float turn = asin(min(uSea.w / c1, 1.0)) - asin(uSea.w / c0) + up0 - acos(along);
  vec3 side = normalize(w * along - n1);
  vec3 q = uEye + (cos(turn) * w + sin(turn) * side) * far;
  return mix(p, q, uShow.w * smoothstep(uLock.x, uLock.y, lift));
}
void main() {
  vImage = aImage;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(place(position), 1.0);
  vView = mv.xyz;
  vLocal = position;
  vNormal = normal;
  vHalf = aHalf;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const HEAD = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uMasks;
uniform sampler2D uLow;
uniform float uBloom;
uniform vec2 uPlain;
uniform vec2 uSize;
uniform vec4 uBox;
uniform vec4 uMaskBox;
uniform vec2 uImage;
uniform vec2 uDrift;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uOwnLens;
uniform vec4 uFrame;
uniform vec3 uLayer;
uniform float uGrad;
uniform float uFine;
uniform float uPerLine;
uniform float uBias;
uniform vec3 uEye;
uniform vec4 uSea;
uniform vec4 uShow;
uniform vec4 uReach;
uniform vec2 uRimNear;
uniform vec4 uCanvas;
uniform sampler2D uVeil;
uniform mat3 uVeilPlane;
uniform vec2 uVeilFrom;
uniform vec4 uArrive;
uniform vec3 uShare;
uniform vec2 uCome;
uniform vec3 uLevel;
uniform sampler2D uTone;
uniform float uToneK;
uniform vec2 uToneCloud;
uniform vec2 uToneGrey;
uniform vec3 uSunAt;
uniform vec3 uCurve[33];
uniform vec3 uTwilight;
uniform vec2 uTwilightAt;
uniform vec3 uTint;
uniform vec3 uPlaceGain;
uniform vec2 uPlaceDay;
in vec2 vImage;
in vec2 vUv;
in vec3 vView;
in vec3 vClip;
in vec3 vLocal;
in vec3 vNormal;
in float vHalf;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
${NOISE_GLSL}
${VEIL_GLSL}
${SHARE_GLSL}
vec3 seaAt() {
  vec3 ray = normalize(vLocal);
  float along = dot(ray, uSea.xyz);
  float reach = dot(uSea.xyz, uSea.xyz) - uSea.w * uSea.w;
  float under = along * along - reach;
  return ray * (under > 0.0 ? along - sqrt(under) : sqrt(reach));
}
float shareAt(vec3 at) {
  vec3 up = normalize(at - uSea.xyz);
  vec3 to = uEye - at;
  float near = come(length(to) / uSea.w);
  float share = 0.0;
  for (int k = 0; k < (near > 0.0 ? 1 : 0); k++) share = near * pathShare(dot(up, normalize(to)), dot(up, normalize(-at)));
  return share;
}
vec4 thin(vec4 c) {
  if (uShow.x <= 0.0 || c.a <= 0.0) return c;
  vec3 at = seaAt();
  vec3 up = normalize(at - uSea.xyz);
  vec3 q = uVeilPlane * up;
  vec2 on = q.xy / max(q.z, 0.05);
  float less = 1.0 - shareAt(at);
  vec3 code = max(toCode(c.rgb / c.a) - less * (1.0 - smoothstep(uVeilFrom.x, uVeilFrom.y, dot(up, normalize(-uSea.xyz)))) * textureLod(uVeil, on + 0.5, 0.0).rgb, 0.0);
  float top = max(code.r, max(code.g, code.b));
  float least = min(code.r, min(code.g, code.b));
  float sea = (1.0 - smoothstep(uToneCloud.x, uToneCloud.y, least)) * smoothstep(uToneGrey.x, uToneGrey.y, (top - least) / max(top, 1e-3));
  code = max(code - less * sea * textureLod(uTone, on * uToneK + 0.5, 0.0).rgb, 0.0);
  return vec4(fromCode(code) * c.a, c.a);
}
vec3 lightOn() {
  if (uShow.x <= 0.0) return vec3(1.0);
  vec3 at = seaAt();
  vec3 up = normalize(at - uSea.xyz);
  vec3 q = uVeilPlane * up;
  float ndl = dot(up, uSunAt);
  float own = shareAt(at) * textureLod(uTone, q.xy / max(q.z, 0.05) * uToneK + 0.5, 0.0).a * smoothstep(uPlaceDay.x, uPlaceDay.y, ndl);
  float band = (ndl - uTwilightAt.x) / uTwilightAt.y;
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  vec3 shade = mix(uCurve[i], uCurve[i + 1], x - float(i)) * (1.0 + uTwilight * exp(-band * band)) * uTint;
  return mix(shade, uPlaceGain, own) / uPlaceGain;
}
float shown() {
  if (uShow.x <= 0.0) return 1.0;
  vec3 up = vLocal - uSea.xyz;
  float far = dot(up, uEye - vLocal) <= 0.0 ? 0.0 : smoothstep(uReach.x, uReach.y, dot(normalize(up), normalize(-uSea.xyz)));
  vec2 q = (vImage - uCanvas.xy) / uCanvas.zw;
  vec2 feather = mix(uReach.zw, uRimNear, uShow.w);
  float rim = smoothstep(0.0, feather.x, min(q.x, 1.0 - q.x)) * smoothstep(0.0, feather.y, 1.0 - q.y);
  vec3 at = seaAt();
  float reach = length(uEye - at);
  float level = smoothstep(0.0, 1.0, log(uLevel.x * length(at) * uLevel.z / max(reach * uArrive.z, 1e-9)) * uLevel.y);
  return mix(arrived(reach / uSea.w) * level * far, 1.0, uShow.w) * rim;
}
vec3 masks() {
  vec2 mq = (vImage - uMaskBox.xy) / uMaskBox.zw;
  return texture(uMasks, vec2(mq.x, 1.0 - mq.y), uBias).rgb;
}
float lens() {
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  return 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
}
vec3 clear(vec3 col, vec3 soft, float share) {
  vec2 q = clamp(vImage / uImage, 0.0, 1.0);
  vec3 low = inverseFilmic(textureLod(uLow, vec2(q.x, 1.0 - q.y), 0.0).rgb) * uGain;
  if (uOwnLens > 0.0) {
    vec2 f = (vClip.xy / vClip.z * 0.5 * uFrame.xy + uFrame.zw) * vec2(uAspect, 1.0);
    low *= mix(1.0, 1.0 / pow(1.0 + dot(f, f) * 0.9, 2.0), uOwnLens);
  }
  return max(col - uBloom * (share * low + uPlain.x * (col - soft)), 0.0) / (1.0 - uBloom);
}`

const GROUND_FRAG = /* glsl */ `
${HEAD}
uniform float uHorizon[9];
uniform vec2 uHorizonSpan;
uniform vec2 uTop;
uniform float uFold;
uniform float uUnder;
uniform vec4 uShimmer;
uniform float uDim;
void main() {
  float hx = (vImage.x - uHorizonSpan.x) / uHorizonSpan.y;
  float hy = uHorizon[8];
  for (int i = 7; i >= 0; i--) hy = hy * hx + uHorizon[i];
  float ground = smoothstep(-1.0, 1.0, vImage.y - hy);
  vec3 m = masks();
  vec2 shift = uDrift * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) / uBox.zw;
  uv.y += 2.0 * max(vImage.y - uUnder, 0.0) / uBox.w;
  float over = max(uTop.x - vImage.y, 0.0);
  float fold = uFold * (1.0 - exp(-over / uFold));
  vec2 at = uv - vec2(0.0, (over + fold) / uBox.w);
  vec2 run = vec2(min(0.3 * over, 40.0) / uBox.z, 0.0);
  vec3 texel = thin(vec4(textureGrad(uColor, at, dFdx(vUv) * uGrad + run, dFdy(vUv) * uGrad).rgb, 1.0)).rgb;
  vec3 wide = thin(vec4(textureGrad(uColor, at, dFdx(vUv) * (uPlain.y * uFine) + run, dFdy(vUv) * (uPlain.y * uFine)).rgb, 1.0)).rgb;
  float fall = exp(min(vImage.y - uTop.x, 0.0) / uTop.y);
  vec3 light = lightOn() * fall;
  vec3 col = inverseFilmic(texel) * light;
  vec3 soft = inverseFilmic(wide) * light;
  vec2 g = vLocal.xz * uShimmer.y;
  float fine = 1.0 - smoothstep(0.35, 1.0, max(fwidth(g.x), fwidth(g.y)) * uFine * uPerLine);
  float sparkle = 0.6 * (vnoise(vec3(g, uShimmer.z + 7.3)) - vnoise(vec3(g, 7.3))) + 0.4 * (vnoise(vec3(g * 2.3 + 4.1, uShimmer.z * 1.7 + 3.1)) - vnoise(vec3(g * 2.3 + 4.1, 3.1)));
  float glint = 1.0 + uShimmer.x * m.r * fine * sparkle * 2.0;
  col = clear(col * glint * uGain * lens(), soft * glint * uGain * lens(), 1.0);
  float on = shown();
  outColor = diagOut(vec4(col * on, ground), diagTexels(uv * uSize), step(0.5, ground * on), uLayer, shift / uImage * 60.0, length(vView));
  if (uDim > 0.5) outColor = vec4(0.0, 0.0, 0.0, uDiag >= 2 ? 1.0 : ground * on);
  if (on <= 0.0 || (uDiag >= 2 && ground * on < 0.5)) discard;
}`

const TOWER_FRAG = /* glsl */ `
${HEAD}
uniform vec2 uEdge;
uniform vec3 uBody;
uniform vec3 uSun;
uniform vec4 uLit;
uniform vec2 uFace;
uniform float uThin;
void main() {
  vec3 m = masks();
  vec2 shift = uDrift * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) / uBox.zw;
  vec2 gx = dFdx(vUv) * uGrad;
  vec2 gy = dFdy(vUv) * uGrad;
  if (uBody.z > 0.0) {
    vec2 u = gx * uSize;
    vec2 v = gy * uSize;
    float a = u.x * u.x + v.x * v.x;
    float b = u.x * u.y + v.x * v.y;
    float c = u.y * u.y + v.y * v.y;
    float mid = 0.5 * (a + c);
    float off = sqrt(0.25 * (a - c) * (a - c) + b * b);
    float major = sqrt(mid + off);
    float minor = sqrt(max(mid - off, 0.0));
    if (major > uBody.z * minor) {
      vec2 e = normalize(a >= c ? vec2(mid + off - c, b) : vec2(b, mid + off - a));
      gx = e * (uBody.z * minor) / uSize;
      gy = vec2(-e.y, e.x) * minor / uSize;
    }
  }
  vec4 texel = thin(textureGrad(uColor, uv, gx, gy));
  vec4 wide = thin(textureGrad(uColor, uv, dFdx(vUv) * (uPlain.y * uFine), dFdy(vUv) * (uPlain.y * uFine)));
  if (uEdge.y > uEdge.x) texel *= smoothstep(uEdge.x, uEdge.y, texel.a) / max(texel.a, 1e-4) * (uThin > 0.0 ? 1.0 - exp(-vHalf / uThin) : 1.0);
  float sun = 0.0;
  if (uLit.a > 0.0) {
    float len = length(vNormal);
    float facing = len > 0.0 ? dot(vNormal, uSun) / len * (dot(vNormal, vLocal) < 0.0 ? -1.0 : 1.0) : 0.0;
    sun = uLit.a * smoothstep(uFace.x, uFace.y, facing);
    texel.rgb = mix(texel.rgb, uLit.rgb * texel.a, sun);
  }
  vec3 light = lightOn() * uGain * lens();
  vec3 lit = inverseFilmic(texel.rgb) * light;
  vec3 col = clear(lit, mix(lit, inverseFilmic(wide.rgb) * light, smoothstep(0.8, 1.0, wide.a) * (1.0 - sun)), texel.a);
  float on = shown();
  outColor = diagOut(vec4(col * on, texel.a), diagTexels(uv * uSize), 1.0, uLayer, shift / uImage * 60.0, length(vView));
  gl_FragDepth = gl_FragCoord.z * uBody.y;
  if (texel.a * on < 0.004 || texel.a < uBody.x || (uDiag >= 2 && texel.a * on < 0.5)) discard;
}`

type Kind = 'sea' | 'dim' | 'body' | 'depth'
interface Pass { kind: Kind; order: [number, number]; test: boolean; func: THREE.DepthModes; write: boolean }
interface Layer { mesh: THREE.Mesh; material: THREE.ShaderMaterial; kind: Kind; order: [number, number] }

export class Ground {
  readonly group = new THREE.Group()
  private readonly layers: Layer[] = []
  private readonly look: GroundLook
  private readonly blank: THREE.DataTexture
  private low = false

  private constructor(look: GroundLook) {
    this.look = look
    this.blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
    this.blank.needsUpdate = true
  }

  static async load(ctx: SetContext, base: string, def: GroundDef, look: GroundLook, globe: GroundOnGlobe): Promise<Ground> {
    const r = new Ground(look)
    const [W, H] = def.imageSize
    const th = Math.tan(THREE.MathUtils.degToRad(def.vfovDeg) / 2)
    const cos = (deg: number): number => Math.cos(THREE.MathUtils.degToRad(deg))
    const aspect = W / H
    const centre = new THREE.Vector3().fromArray(def.nadir).normalize().multiplyScalar(def.radius + 1)
    const tangent = Math.sqrt(centre.lengthSq() - def.radius * def.radius)
    const ray = (x: number, y: number): THREE.Vector3 => new THREE.Vector3((2 * x / W - 1) * th * aspect, (1 - 2 * y / H) * th, -1).normalize()
    const sea = (d: THREE.Vector3): number => {
      const b = d.dot(centre)
      const disc = b * b - tangent * tangent
      return disc > 0 && b > 0 ? b - Math.sqrt(disc) : tangent
    }
    const masks = def.masks ? await ctx.texture(base + def.masks.file, { srgb: false, mips: false }) : r.blank
    const maskBox = def.masks?.box ?? [0, 0, W, H]
    const low = def.low ? await ctx.texture(base + def.low.file, { srgb: true, mips: false }) : r.blank
    r.low = def.low !== undefined

    const build = (box: Box, top: number, under: number, cells: number, distance: (x: number, y: number, d: THREE.Vector3) => number): THREE.BufferGeometry => {
      const [x0, y0, bw, bh] = box
      const nx = Math.max(2, Math.round(cells))
      const ny = Math.max(2, Math.round((cells * (bh + top + under)) / bw))
      const cols = nx + 1
      const rows = ny + 1
      const position = new Float32Array(cols * rows * 3)
      const uv = new Float32Array(cols * rows * 2)
      const image = new Float32Array(cols * rows * 2)
      let n = 0
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = x0 + (i / nx) * bw
          const y = y0 - top + (j / ny) * (bh + top + under)
          const d = ray(x, y)
          const t = distance(x, y, d)
          position[n * 3] = d.x * t
          position[n * 3 + 1] = d.y * t
          position[n * 3 + 2] = d.z * t
          uv[n * 2] = (x - x0) / bw
          uv[n * 2 + 1] = 1 - (y - y0) / bh
          image[n * 2] = x
          image[n * 2 + 1] = y
          n++
        }
      }
      const index = new Uint32Array(nx * ny * 6)
      let m = 0
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * cols + i
          const b = a + 1
          const c = a + cols
          const e = c + 1
          index[m++] = a; index[m++] = c; index[m++] = b
          index[m++] = b; index[m++] = c; index[m++] = e
        }
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      geo.setAttribute('aImage', new THREE.BufferAttribute(image, 2))
      geo.setIndex(new THREE.BufferAttribute(index, 1))
      geo.computeVertexNormals()
      return geo
    }

    const add = (geo: THREE.BufferGeometry, color: THREE.Texture, box: Box, fragment: string, tint: [number, number, number], pass: Pass, extra: Record<string, THREE.IUniform>): void => {
      const size = color.image as unknown as { width: number; height: number }
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: fragment,
        uniforms: {
          uColor: { value: color }, uMasks: { value: masks }, uLow: { value: low }, uBloom: { value: 0 }, uPlain: { value: new THREE.Vector2(look.plain[0], look.plain[1]) }, uSize: { value: new THREE.Vector2(size.width, size.height) },
          uBox: { value: new THREE.Vector4().fromArray(box) }, uMaskBox: { value: new THREE.Vector4().fromArray(maskBox) }, uImage: { value: new THREE.Vector2(W, H) },
          uDrift: { value: new THREE.Vector2() }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uOwnLens: { value: 0 }, uFrame: { value: new THREE.Vector4(1, 1, 0, 0) },
          uLayer: { value: new THREE.Vector3().fromArray(tint) }, uDiag: diagUniform, uGrad: gradUniform, uFine: fineUniform, uPerLine: frameUniform, uBias: biasUniform,
          uEye: { value: new THREE.Vector3() }, uSea: { value: new THREE.Vector4(centre.x, centre.y, centre.z, def.radius) }, uLock: { value: new THREE.Vector2().fromArray(look.lock) },
          uShow: { value: new THREE.Vector4(0, 0, 1, 1) }, uReach: { value: new THREE.Vector4(cos(globe.farDeg[1]!), cos(globe.farDeg[0]!), globe.rim[0]!, globe.rim[1]!) }, uRimNear: { value: new THREE.Vector2(globe.rimNear[0]!, globe.rimNear[1]!) }, uCanvas: { value: new THREE.Vector4().fromArray(def.ground.box) },
          uVeil: { value: globe.veil.map }, uVeilPlane: { value: globe.veil.plane }, uVeilFrom: { value: new THREE.Vector2(cos(globe.veil.fromDeg[1]!), cos(globe.veil.fromDeg[0]!)) }, uArrive: { value: new THREE.Vector4(globe.arrive[0]!, 1 / Math.log(globe.arrive[0]! / globe.arrive[1]!), 1, 1) }, uShare: { value: new THREE.Vector3().fromArray(globe.share) }, uCome: { value: new THREE.Vector2(globe.share[3]!, globe.share[4]!) }, uLevel: { value: new THREE.Vector3(globe.level[0]!, 1 / Math.log(globe.level[0]! / globe.level[1]!), globe.level[2]!) }, uToneK: { value: globe.toneTimes }, uSunAt: { value: new THREE.Vector3(0, 1, 0) }, ...globe.light, ...extra,
        },
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: pass.kind === 'dim' ? THREE.ZeroFactor : THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: pass.kind === 'dim' ? THREE.ZeroFactor : THREE.OneFactor,
        blendDstAlpha: pass.kind === 'dim' ? THREE.ZeroFactor : THREE.OneMinusSrcAlphaFactor,
        side: THREE.DoubleSide,
        depthTest: pass.test,
        depthFunc: pass.func,
        depthWrite: pass.write,
        colorWrite: pass.kind !== 'depth',
      })
      const mesh = new THREE.Mesh(geo, material)
      mesh.frustumCulled = false
      mesh.renderOrder = pass.order[0]
      r.group.add(mesh)
      r.layers.push({ mesh, material, kind: pass.kind, order: pass.order })
    }

    const g = def.ground
    const groundMap = await ctx.texture(base + g.file, { srgb: true, anisotropy: 8 })
    const seaSheet = build(g.box, g.top, g.under ?? 0, look.mesh, (_x, _y, d) => sea(d))
    for (const kind of ['dim', 'sea'] as const) {
      add(seaSheet, groundMap, g.box, GROUND_FRAG, [0.25, 0.45, 0.85], { kind, order: kind === 'dim' ? [2, 2] : [2, 4.5], test: kind === 'sea', func: THREE.LessEqualDepth, write: kind === 'sea' }, {
        uHorizon: { value: g.horizon.slice(0, 9) }, uHorizonSpan: { value: new THREE.Vector2().fromArray(g.horizonSpan) },
        uTop: { value: new THREE.Vector2(g.box[1], g.fade) }, uFold: { value: look.fold }, uUnder: { value: g.box[1] + g.box[3] - (g.skip ?? 0) }, uShimmer: { value: new THREE.Vector4(look.shimmer[0], look.shimmer[1], 0, 0) },
        uDim: { value: kind === 'dim' ? 1 : 0 },
      })
    }

    const t = def.towers
    if (t) {
      const map = await ctx.texture(base + t.file, { srgb: true, anisotropy: 8 })
      const [dw, dh] = t.distSize
      const [x0, y0, bw, bh] = t.box
      const grid = async (file: string): Promise<Float32Array> => unpack(await ctx.buffer(base + file), dw * dh, file)
      const least = (data: Float32Array, rx: number, ry: number) => (x: number, y: number): number => {
        const i0 = Math.max(Math.floor(((x - rx - x0) / bw) * dw - 0.5), 0)
        const i1 = Math.min(Math.ceil(((x + rx - x0) / bw) * dw - 0.5), dw - 1)
        const j0 = Math.max(Math.floor(((y - ry - y0) / bh) * dh - 0.5), 0)
        const j1 = Math.min(Math.ceil(((y + ry - y0) / bh) * dh - 0.5), dh - 1)
        let v = Infinity
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) v = Math.min(v, data[j * dw + i]!)
        return v === Infinity ? 0 : v
      }
      const field = (data: Float32Array) => (x: number, y: number): number => {
        const px = Math.min(Math.max(((x - x0) / bw) * dw - 0.5, 0), dw - 1)
        const py = Math.min(Math.max(((y - y0) / bh) * dh - 0.5, 0), dh - 1)
        const ix = Math.min(Math.floor(px), dw - 2)
        const iy = Math.min(Math.floor(py), dh - 2)
        const tx = px - ix
        const ty = py - iy
        const a = data[iy * dw + ix]!
        const b = data[iy * dw + ix + 1]!
        const c = data[(iy + 1) * dw + ix]!
        const e = data[(iy + 1) * dw + ix + 1]!
        return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty
      }
      const lift = field(await grid(t.dist))
      const cells = Math.max(2, Math.round(look.towerMesh))
      const half = t.body ? least(await grid(t.body), bw / cells, bh / Math.max(2, Math.round((cells * bh) / bw))) : (): number => 0
      const sheet = (side: number): THREE.BufferGeometry => {
        const deep: number[] = []
        const geo = build(t.box, 0, 0, look.towerMesh, (x, y, d) => {
          const h = half(x, y)
          deep.push(h)
          return sea(d) * Math.min((1 - lift(x, y)) * (1 + side * h), 1)
        })
        geo.setAttribute('aHalf', new THREE.BufferAttribute(new Float32Array(deep), 1))
        return geo
      }
      const tint: [number, number, number] = [0.95, 0.9, 0.8]
      const tone = new THREE.Color().setRGB(t.lit?.[0] ?? 0, t.lit?.[1] ?? 0, t.lit?.[2] ?? 0, THREE.SRGBColorSpace)
      const body = (cut: number, edge: number[], far = false): Record<string, THREE.IUniform> => ({
        uEdge: { value: new THREE.Vector2().fromArray(edge) },
        uBody: { value: t.body ? new THREE.Vector3(cut, t.range ?? 0.5, t.stretch ?? 8) : new THREE.Vector3(0, 1, 0) },
        uSun: { value: new THREE.Vector3(0, 1, 0) },
        uLit: { value: new THREE.Vector4(tone.r, tone.g, tone.b, far && t.lit ? 1 : 0) },
        uFace: { value: new THREE.Vector2().fromArray(t.face ?? [0, 1]) },
        uThin: { value: t.thin ?? 0 },
      })
      const solid = t.body !== undefined
      const front = sheet(solid ? -1 : 0)
      if (solid) {
        const back = sheet(1)
        const narrow = t.edge ?? [0, 1]
        add(front, map, t.box, TOWER_FRAG, tint, { kind: 'depth', order: [3, 3], test: true, func: THREE.LessEqualDepth, write: true }, body(t.cut ?? 0.5, [0, 0]))
        add(back, map, t.box, TOWER_FRAG, tint, { kind: 'depth', order: [3.2, 3.2], test: true, func: THREE.LessEqualDepth, write: true }, body(t.cut ?? 0.5, narrow))
        add(back, map, t.box, TOWER_FRAG, tint, { kind: 'body', order: [3.5, 4], test: true, func: THREE.LessEqualDepth, write: false }, body(0, narrow, true))
      }
      add(front, map, t.box, TOWER_FRAG, tint, { kind: 'body', order: [4, 3.5], test: solid, func: THREE.LessEqualDepth, write: false }, body(0, [0, 0]))
    }
    return r
  }

  update(dt: number, gain: number, vignette: number, bloom: number, view: RenderView, eye: THREE.Vector3, sun: THREE.Vector3, under: number, onGlobe: number | null, whole = 0): void {
    const k = this.look
    const part = view.camera.view
    const cut = under > 0 && part !== null && part.enabled
    for (const l of this.layers) {
      const u = l.material.uniforms
      const show = u.uShow!.value as THREE.Vector4
      show.x = onGlobe === null ? 0 : 1
      ;(u.uArrive!.value as THREE.Vector4).z = onGlobe ?? 1
      show.w = onGlobe === null ? 1 : whole
      const globe = onGlobe !== null
      const m = l.material
      l.mesh.renderOrder = l.order[globe ? 1 : 0]
      if (l.kind === 'dim') l.mesh.visible = globe
      if (l.kind === 'sea') {
        m.depthTest = !globe
        m.depthWrite = !globe
      }
      if (l.kind === 'sea' || l.kind === 'body') {
        m.blendSrc = m.blendSrcAlpha = globe ? THREE.OneMinusDstAlphaFactor : THREE.OneFactor
        m.blendDst = m.blendDstAlpha = globe ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor
      }
      ;(u.uEye!.value as THREE.Vector3).copy(eye)
      if (u.uSun) (u.uSun.value as THREE.Vector3).copy(sun)
      ;(u.uSunAt!.value as THREE.Vector3).copy(sun)
      ;(u.uDrift!.value as THREE.Vector2).set(k.drift[0] * dt, k.drift[1] * dt)
      if (u.uShimmer) (u.uShimmer.value as THREE.Vector4).z = k.shimmer[2] * dt
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uBloom!.value = this.low ? bloom * k.bloom : 0
      u.uAspect!.value = view.format.width / view.format.height
      u.uOwnLens!.value = under
      if (cut) (u.uFrame!.value as THREE.Vector4).set(part.width / part.fullWidth, part.height / part.fullHeight, (part.offsetX + 0.5 * part.width) / part.fullWidth - 0.5, 0.5 - (part.offsetY + 0.5 * part.height) / part.fullHeight)
      else (u.uFrame!.value as THREE.Vector4).set(1, 1, 0, 0)
    }
  }

  dispose(): void {
    this.blank.dispose()
    for (const l of this.layers) {
      l.mesh.geometry.dispose()
      l.material.dispose()
    }
  }
}
