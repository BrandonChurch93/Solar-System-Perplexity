import * as THREE from 'three'
import { HAZE_GLSL } from '../../bodies/haze'

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
}

export interface AirParams {
  layers: AirLayer[]
  line: AirLine
  forward: number
  forwardPower: number
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
uniform vec2 uAirForward;
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
  float r1 = uLineShape.x;
  float r2 = uLineShape.y;
  if (b > 0.0 && rt2 < r2 * r2 && r > r2) {
    float far = sqrt(r2 * r2 - rt2);
    float near = sqrt(max(r1 * r1 - rt2, 0.0));
    float path = (far - near) * (ground ? 1.0 : 2.0);
    float tau = uLineShape.z * path;
    sum += airLight(uLineDay, uLineTwilight, uLineNight, uLineEdge, uLineSun, at, fwd) * (1.0 - exp(-tau)) * uLineShape.w;
  }
  return vec4(sum, total);
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
out vec4 outColor;
${AIR_GLSL}
void main() {
  if (uDiag >= 2) discard;
  vec3 dir = normalize(vPos);
  float r = length(uCam);
  float b = -dot(uCam, dir);
  if (b > 0.0 && r * r - b * b < 0.99) discard;
  outColor = vec4(air(dir, false).rgb * uGain, 0.0);
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
    uAirForward: { value: new THREE.Vector2(p.forward, p.forwardPower) },
  }
}

export class Air {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly aims: THREE.Vector3[]
  private readonly lineAim: THREE.Vector3
  private readonly users: Record<string, THREE.IUniform>[] = []
  private readonly work = new THREE.Vector3()

  constructor(readonly params: AirParams, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { ...airUniforms(params), uGain: { value: 1 }, uDiag: diag },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(params.top, 192, 96), this.material)
    this.mesh.renderOrder = 5
    this.aims = params.layers.map((l) => vec(l.aim))
    this.lineAim = vec(params.line.aim)
    this.users.push(this.material.uniforms)
  }

  share(uniforms: Record<string, THREE.IUniform>): void {
    this.users.push(uniforms)
  }

  update(camera: THREE.Vector3, light: THREE.Vector3, rotation: THREE.Quaternion, home: number, line: number, gain: number): void {
    for (const u of this.users) {
      ;(u.uCam!.value as THREE.Vector3).copy(camera)
      ;(u.uSunW!.value as THREE.Vector3).copy(light)
      const suns = u.uAirSun!.value as THREE.Vector3[]
      for (let i = 0; i < AIR_LAYERS; i++) suns[i]!.copy(this.work.copy(this.aims[i]!).applyQuaternion(rotation).multiplyScalar(home).add(light).normalize())
      ;(u.uLineSun!.value as THREE.Vector3).copy(this.work.copy(this.lineAim).applyQuaternion(rotation).multiplyScalar(home).add(light).normalize())
      const shapes = u.uAirShape!.value as THREE.Vector4[]
      const days = u.uAirDay!.value as THREE.Vector3[]
      for (let i = 0; i < AIR_LAYERS; i++) {
        const l = this.params.layers[i]!
        shapes[i]!.z = l.away[0] + (l.dayFrom - l.away[0]) * home
        shapes[i]!.w = l.away[1] + (l.dayTo - l.away[1]) * home
        days[i]!.fromArray(l.day).multiplyScalar(l.away[2] + (1 - l.away[2]) * home)
      }
      const ln = this.params.line
      ;(u.uLineEdge!.value as THREE.Vector2).set(ln.away[0] + (ln.dayFrom - ln.away[0]) * home, ln.away[1] + (ln.dayTo - ln.away[1]) * home)
      ;(u.uLineDay!.value as THREE.Vector3).fromArray(ln.day).multiplyScalar(ln.away[2] + (1 - ln.away[2]) * home)
      ;(u.uLineShape!.value as THREE.Vector4).w = line
    }
    this.material.uniforms.uGain!.value = gain
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
