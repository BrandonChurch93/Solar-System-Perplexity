import * as THREE from 'three'
import { HAZE_GLSL } from '../../bodies/haze'
import type { Ending } from './ending'
import { ownTrig } from './trig'

export const AIR_LAYERS = 3

export interface AirLayer {
  scaleHeight: number
  depth: number
  day: [number, number, number]
  twilight: [number, number, number]
  night: [number, number, number]
  dayFrom: number
  dayTo: number
  aim: [number, number, number]
  away: [number, number, number]
}

export interface AirLine {
  inner: number
  outer: number
  density: number
  day: [number, number, number]
  twilight: [number, number, number]
  night: [number, number, number]
  dayFrom: number
  dayTo: number
  aim: [number, number, number]
  away: [number, number, number]
  bulge: [number, number, number, number]
  lift: number
  tail: [number, number, number]
  tailEdge: [number, number]
  fade: [number, number, number]
  crest: { width: number; density: number; glow: number; share: number; light: [number, number, number]; aim: [number, number, number]; edge: [number, number]; bulge: [number, number]; lift: number; fall: [number, number]; gap: number; head: [number, number, number, number]; headEdge: [number, number]; spread: number }
}

export interface AirMoves {
  line: number[]
  layers: number[][]
  dim: number
}

export interface AirParams {
  layers: AirLayer[]
  line: AirLine
  forward: number
  forwardPower: number
  near: number[]
  extinction: number
  top: number
}

export const AIR_GLSL = /* glsl */ `
${HAZE_GLSL}
uniform vec4 uAirShape[${AIR_LAYERS}];
uniform vec3 uAirDay[${AIR_LAYERS}];
uniform vec3 uAirTwilight[${AIR_LAYERS}];
uniform vec3 uAirNight[${AIR_LAYERS}];
uniform vec3 uAirSun[${AIR_LAYERS}];
uniform vec4 uLineShape;
uniform vec3 uLineDay;
uniform vec3 uLineTwilight;
uniform vec3 uLineNight;
uniform vec3 uLineSun;
uniform vec2 uLineEdge;
uniform vec4 uLineBulge;
uniform float uLineLift;
uniform vec3 uLineTail;
uniform vec2 uLineTailEdge;
uniform vec3 uLineFade;
uniform vec4 uCrest;
uniform vec3 uCrestLight;
uniform vec3 uCrestAim;
uniform vec4 uCrestEdge;
uniform vec3 uCrestFall;
uniform float uCrestGap;
uniform vec4 uCrestHead;
uniform vec3 uCrestHeadEdge;
uniform vec2 uAirForward;
uniform vec4 uAirNear;
uniform float uAirDim;
vec3 airLight(vec3 day, vec3 twilight, vec3 night, vec2 edge, vec3 sun, vec3 at, float fwd) {
  float s = smoothstep(edge.x, edge.y, dot(at, sun));
  float ndl = dot(at, uSunW);
  float tw = smoothstep(-0.42, -0.04, ndl) * (1.0 - smoothstep(-0.04, 0.36, ndl));
  return (day * s * s + twilight * tw) * fwd + night;
}
vec4 air(vec3 dir, bool ground) {
  float fwd = 1.0 + uAirForward.x * pow(max(dot(dir, uSunW), 0.0), uAirForward.y);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  vec3 at;
  for (int i = 0; i < ${AIR_LAYERS}; i++) {
    float tau = uAirShape[i].y * hazeDepthAt(dir, ground, uAirShape[i].x, at);
    sum += airLight(uAirDay[i], uAirTwilight[i], uAirNight[i], uAirShape[i].zw, uAirSun[i], at, fwd) * (1.0 - exp(-tau));
    total += tau;
  }
  float r = length(uCam);
  float b = -dot(uCam, dir);
  float rt2 = r * r - b * b;
  vec3 tp = normalize(uCam + dir * b);
  float sector = smoothstep(uCrestEdge.z, uCrestEdge.w, dot(tp, uLineBulge.xyz));
  float bulge = uLineBulge.w * sector;
  float on = smoothstep(uCrestEdge.x, uCrestEdge.y, dot(tp, uCrestAim)) * step(1e-5, uCrestLight.b);
  float rc = 1.0 + uCrestFall.x * step(1e-5, uCrestLight.b) + bulge;
  float rt = sqrt(max(rt2, 0.0));
  sum *= 1.0 - (ground ? 0.0 : uCrestGap) * on * (1.0 - smoothstep(rc - 0.003, rc + 0.001, rt));
  float r1 = uLineShape.x + bulge + uLineLift * smoothstep(0.0, 0.4, dot(tp, uSunW));
  float r2 = uLineShape.y + bulge;
  if (b > 0.0 && rt2 < r2 * r2 && r > r2) {
    float far = sqrt(r2 * r2 - rt2);
    float near = sqrt(max(r1 * r1 - rt2, 0.0));
    float path = (far - near) * (ground ? 1.0 : 2.0);
    float tau = uLineShape.z * path;
    sum += (airLight(uLineDay, uLineTwilight, uLineNight, uLineEdge, uLineSun, at, fwd) + uLineTail * smoothstep(uLineTailEdge.x, uLineTailEdge.y, dot(tp, uSunW))) * (1.0 - exp(-tau)) * uLineShape.w * (1.0 - uLineFade.z * smoothstep(uLineFade.x, uLineFade.y, dot(tp, uSunW))) * (1.0 - on);
  }
  float crest = on * (1.0 - uCrestFall.y * pow(abs(sector), uCrestFall.z)) * (1.0 + uCrestHead.w * smoothstep(uCrestHeadEdge.x, uCrestHeadEdge.y, dot(tp, uCrestHead.xyz)));
  for (int k = 0; k < (crest > 0.0 && b > 0.0 ? 1 : 0); k++) {
    float ro = rc + uCrest.x;
    float thin = (sqrt(max(ro * ro - rt2, 0.0)) - sqrt(max(rc * rc - rt2, 0.0))) * (ground ? 1.0 : 2.0);
    float x = rt - rc;
    float glow = x > 0.0 ? exp(-x / uCrest.z) : 0.5 * exp(x / (0.35 * uCrest.z));
    sum += uCrestLight * (crest * (1.0 - exp(-uCrest.y * thin * smoothstep(-0.9 * uCrest.z, -0.25 * uCrest.z, x))) + mix(crest, on, uCrestHeadEdge.z) * uCrest.w * glow);
  }
  return vec4(sum * mix(vec3(1.0), uAirNear.rgb, uAirNear.w), total);
}`

const VERT = /* glsl */ `
out vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vPos;
uniform float uGain;
uniform int uDiag;
uniform vec3 uRingN;
uniform vec3 uRingC;
uniform vec2 uRingRange;
out vec4 outColor;
${AIR_GLSL}
void main() {
  vec3 dir = normalize(vPos);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  bool hidden = uDiag >= 2 || (b > 0.0 && r * r - b * b < 0.99);
  vec3 col = vec3(0.0);
  float behind = 0.0;
  for (int k = 0; k < (hidden ? 0 : 1); k++) {
    vec4 lit = air(dir, false);
    col = lit.rgb * uGain;
    for (int j = 0; j < (uAirDim > 0.0 ? 1 : 0); j++) {
      behind = 1.0 - exp(-uAirDim * lit.a);
      float tr = dot(uRingC - uCam, uRingN) / dot(dir, uRingN);
      float rr = length(uCam + dir * tr - uRingC);
      behind *= 1.0 - step(0.0, tr) * step(tr, b) * smoothstep(uRingRange.x, uRingRange.x + 0.03, rr) * (1.0 - smoothstep(uRingRange.y - 0.03, uRingRange.y, rr));
    }
  }
  outColor = vec4(col, behind);
  if (hidden) discard;
}`

function vec(a: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3().fromArray(a)
}

export function airUniforms(p: AirParams): Record<string, THREE.IUniform> {
  if (p.layers.length !== AIR_LAYERS) throw new Error('air needs ' + AIR_LAYERS + ' layers')
  return {
    uCam: { value: new THREE.Vector3(0, 0, 3) },
    uSunW: { value: new THREE.Vector3(1, 0, 0) },
    uHazeTau: { value: 1 },
    uAirShape: { value: p.layers.map((l) => new THREE.Vector4(l.scaleHeight, l.depth, l.dayFrom, l.dayTo)) },
    uAirDay: { value: p.layers.map((l) => vec(l.day)) },
    uAirTwilight: { value: p.layers.map((l) => vec(l.twilight)) },
    uAirNight: { value: p.layers.map((l) => vec(l.night)) },
    uAirSun: { value: p.layers.map(() => new THREE.Vector3(1, 0, 0)) },
    uLineShape: { value: new THREE.Vector4(p.line.inner, p.line.outer, p.line.density, 1) },
    uLineDay: { value: vec(p.line.day) },
    uLineTwilight: { value: vec(p.line.twilight) },
    uLineNight: { value: vec(p.line.night) },
    uLineSun: { value: new THREE.Vector3(1, 0, 0) },
    uLineEdge: { value: new THREE.Vector2(p.line.dayFrom, p.line.dayTo) },
    uLineBulge: { value: new THREE.Vector4(1, 0, 0, 0) },
    uLineLift: { value: p.line.lift },
    uLineTail: { value: new THREE.Vector3() },
    uLineTailEdge: { value: new THREE.Vector2(p.line.tailEdge[0], p.line.tailEdge[1]) },
    uLineFade: { value: new THREE.Vector3(p.line.fade[0], p.line.fade[1], 0) },
    uCrest: { value: new THREE.Vector4(p.line.crest.width, p.line.crest.density, p.line.crest.glow, p.line.crest.share) },
    uCrestLight: { value: new THREE.Vector3() },
    uCrestAim: { value: new THREE.Vector3(1, 0, 0) },
    uCrestFall: { value: new THREE.Vector3(p.line.crest.lift, p.line.crest.fall[0], p.line.crest.fall[1]) },
    uCrestGap: { value: 0 },
    uCrestHead: { value: new THREE.Vector4(1, 0, 0, p.line.crest.head[3]) },
    uCrestHeadEdge: { value: new THREE.Vector3(p.line.crest.headEdge[0], p.line.crest.headEdge[1], p.line.crest.spread) },
    uCrestEdge: { value: new THREE.Vector4(p.line.crest.edge[0], p.line.crest.edge[1], p.line.crest.bulge[0], p.line.crest.bulge[1]) },
    uAirForward: { value: new THREE.Vector2(p.forward, p.forwardPower) },
    uAirNear: { value: new THREE.Vector4(p.near[0], p.near[1], p.near[2], 0) },
    uAirDim: { value: 0 },
  }
}

export class Air {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly aims: THREE.Vector3[]
  private readonly lineAim: THREE.Vector3
  private readonly users: Record<string, THREE.IUniform>[] = []
  private readonly work = new THREE.Vector3()
  private thin = 1

  constructor(readonly params: AirParams, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { ...airUniforms(params), uGain: { value: 1 }, uDiag: diag, uRingN: { value: new THREE.Vector3(0, 1, 0) }, uRingC: { value: new THREE.Vector3() }, uRingRange: { value: new THREE.Vector2(-2, -1) } },
      side: THREE.BackSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
    })
    ownTrig(this.material)
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(params.top, 192, 96), this.material)
    this.mesh.renderOrder = 5
    this.aims = params.layers.map((l) => vec(l.aim))
    this.lineAim = vec(params.line.aim)
    this.users.push(this.material.uniforms)
  }

  share(uniforms: Record<string, THREE.IUniform>): void {
    this.users.push(uniforms)
  }

  ring(normal: THREE.Vector3, centre: THREE.Vector3, inner: number, outer: number): void {
    const u = this.material.uniforms
    ;(u.uRingN!.value as THREE.Vector3).copy(normal)
    ;(u.uRingC!.value as THREE.Vector3).copy(centre)
    ;(u.uRingRange!.value as THREE.Vector2).set(inner, outer)
  }

  update(camera: THREE.Vector3, light: THREE.Vector3, rotation: THREE.Quaternion, home: number, line: number, gain: number, near = 0, tint?: number[], seat = 1, thin = 1, amount = 1, moving = 0, moves?: AirMoves, dimming = 1): void {
    this.thin = thin
    for (const u of this.users) {
      const hue = u.uAirNear!.value as THREE.Vector4
      if (tint) hue.set(tint[0]!, tint[1]!, tint[2]!, near)
      else hue.w = near
      ;(u.uCam!.value as THREE.Vector3).copy(camera)
      ;(u.uSunW!.value as THREE.Vector3).copy(light)
      const suns = u.uAirSun!.value as THREE.Vector3[]
      for (let i = 0; i < AIR_LAYERS; i++) suns[i]!.copy(this.work.copy(this.aims[i]!).applyQuaternion(rotation).multiplyScalar(home).add(light).normalize())
      ;(u.uLineSun!.value as THREE.Vector3).copy(this.work.copy(this.lineAim).applyQuaternion(rotation).multiplyScalar(home).add(light).normalize())
      const shapes = u.uAirShape!.value as THREE.Vector4[]
      const days = u.uAirDay!.value as THREE.Vector3[]
      for (let i = 0; i < AIR_LAYERS; i++) {
        const l = this.params.layers[i]!
        shapes[i]!.x = l.scaleHeight * thin
        const away = moves && moving > 0 ? l.away.map((v, k) => v + (moves.layers[i]![k]! - v) * moving) : l.away
        shapes[i]!.z = away[0]! + (l.dayFrom - away[0]!) * home
        shapes[i]!.w = away[1]! + (l.dayTo - away[1]!) * home
        days[i]!.fromArray(l.day).multiplyScalar(away[2]! + (1 - away[2]!) * home)
      }
      const ln = this.params.line
      const away = moves && moving > 0 ? ln.away.map((v, k) => v + (moves.line[k]! - v) * moving) : ln.away
      ;(u.uLineEdge!.value as THREE.Vector2).set(away[0]! + (ln.dayFrom - away[0]!) * home, away[1]! + (ln.dayTo - away[1]!) * home)
      ;(u.uLineDay!.value as THREE.Vector3).fromArray(ln.day).multiplyScalar(away[2]! + (1 - away[2]!) * home)
      u.uAirDim!.value = moves ? moves.dim * moving * (1 - home) * dimming : 0
      ;(u.uLineShape!.value as THREE.Vector4).w = line
      ;(u.uLineTail!.value as THREE.Vector3).fromArray(ln.tail).multiplyScalar(home)
      ;(u.uLineFade!.value as THREE.Vector3).z = ln.fade[2] * home
      this.work.set(ln.bulge[0], ln.bulge[1], ln.bulge[2]).applyQuaternion(rotation).normalize()
      ;(u.uLineBulge!.value as THREE.Vector4).set(this.work.x, this.work.y, this.work.z, ln.bulge[3] * home * seat)
      ;(u.uCrestLight!.value as THREE.Vector3).fromArray(ln.crest.light).multiplyScalar(home)
      u.uCrestGap!.value = ln.crest.gap * home
      this.work.set(ln.crest.head[0], ln.crest.head[1], ln.crest.head[2]).applyQuaternion(rotation).normalize()
      ;(u.uCrestHead!.value as THREE.Vector4).set(this.work.x, this.work.y, this.work.z, ln.crest.head[3])
      ;(u.uCrestAim!.value as THREE.Vector3).fromArray(ln.crest.aim).applyQuaternion(rotation).normalize()
    }
    this.material.uniforms.uGain!.value = gain * amount
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }

  ending(end: number, top: number, e: Ending['air'], shift = 0): void {
    const span = 0.5 * (top + Math.sqrt(top * top + 4 * e.span * e.span))
    const from = top - span * (1 + e.past)
    for (const u of this.users) {
      const shapes = u.uAirShape!.value as THREE.Vector4[]
      const days = u.uAirDay!.value as THREE.Vector3[]
      const nights = u.uAirNight!.value as THREE.Vector3[]
      for (let i = 0; i < AIR_LAYERS; i++) {
        const l = this.params.layers[i]!
        const deep = l.scaleHeight * this.thin
        shapes[i]!.x = deep + (e.scaleHeight[i]! - deep) * end
        shapes[i]!.z += (from - shift - shapes[i]!.z) * end
        shapes[i]!.w += (top - shift - shapes[i]!.w) * end
        days[i]!.lerp(this.work.fromArray(e.day[i]!), end)
        nights[i]!.fromArray(l.night).multiplyScalar(1 - end)
      }
      ;(u.uLineShape!.value as THREE.Vector4).w *= 1 - end
      ;(u.uLineNight!.value as THREE.Vector3).fromArray(this.params.line.night).multiplyScalar(1 - end)
    }
  }
}
