import * as THREE from 'three'
import type { Line } from './ride'

export type GlareSide = 'dive' | 'enter' | 'leave' | 'rise'

export interface GlareLook {
  flood: { peak: number; width: Record<GlareSide, number>; shift: [number, number]; color: [number, number, number]; ground: number; soft: number; even: number; reach: number }
  bloom: { peak: number; fall: Record<GlareSide, number>; span: Record<GlareSide, number>; color: [number, number, number]; ground: number; wide: [number, number]; shrink: [number, number]; core: [number, number]; rays: [number, number]; turn: number }
  terrainSun: [number, number]
}

const VERT = /* glsl */ `
out vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uSun;
uniform float uFlood;
uniform float uBloom;
uniform float uGain;
uniform float uAspect;
uniform float uPhase;
uniform vec3 uFloodColor;
uniform vec3 uSunColor;
uniform vec2 uWide;
uniform vec2 uCore;
uniform vec2 uRays;
uniform vec2 uEven;
uniform vec4 uLine;
uniform vec3 uGround;
uniform int uDiag;
in vec2 vNdc;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  vec2 p = vNdc * vec2(uAspect, 1.0);
  vec2 d = p - uSun;
  float r = length(d);
  float a = atan(d.y, d.x);
  float s1 = 0.5 + 0.5 * sin(a * 6.0 + uPhase);
  float s2 = 0.5 + 0.5 * sin(a * 14.0 - uPhase * 1.7 + 2.1);
  float s3 = 0.5 + 0.5 * sin(a * 31.0 + uPhase * 0.6 + 4.0);
  float rays = 0.6 * pow(s1, 6.0) + 0.9 * pow(s1 * s2, 4.0) + 0.5 * pow(s2 * s3, 5.0);
  float q = r / uWide.x;
  float c = r / uCore.x;
  float g = uWide.y / (1.0 + q * q) + uCore.y / pow(1.0 + c * c, 1.5) + uRays.y * rays / (1.0 + pow(r / uRays.x, 1.5));
  float e = r / uEven.y;
  float w = 1.0 + e * e;
  float f = uFlood * (uEven.x + (1.0 - uEven.x) / w);
  vec2 centre = uLine.xy * (uLine.z - uLine.w);
  float up = smoothstep(-uGround.z, uGround.z, length(p - centre) - uLine.w);
  outColor = vec4((uFloodColor * f * mix(uGround.x, 1.0, up) + uSunColor * (uBloom * g) * mix(uGround.y, 1.0, up)) * uGain, 0.0);
}`

export class Glare {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly v = new THREE.Vector3()
  private readonly q = new THREE.Quaternion()

  constructor(private readonly look: GlareLook, diag: THREE.IUniform<number>) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uSun: { value: new THREE.Vector2() }, uFlood: { value: 0 }, uBloom: { value: 0 }, uGain: { value: 1 }, uAspect: { value: 16 / 9 }, uPhase: { value: 0 },
        uFloodColor: { value: new THREE.Vector3().fromArray(look.flood.color) }, uSunColor: { value: new THREE.Vector3().fromArray(look.bloom.color) },
        uWide: { value: new THREE.Vector2().fromArray(look.bloom.wide) }, uCore: { value: new THREE.Vector2().fromArray(look.bloom.core) }, uRays: { value: new THREE.Vector2().fromArray(look.bloom.rays) },
        uEven: { value: new THREE.Vector2(look.flood.even, look.flood.reach) }, uLine: { value: new THREE.Vector4(0, 1, 0, 50) }, uGround: { value: new THREE.Vector3(look.flood.ground, look.bloom.ground, look.flood.soft) }, uDiag: diag,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 10
    this.mesh.visible = false
  }

  flood(frames: number, side: GlareSide): number {
    const f = this.look.flood
    const m = (frames - f.shift[side === 'dive' || side === 'enter' ? 0 : 1]) / f.width[side]
    return f.peak * Math.exp(-0.5 * m * m)
  }

  bloom(frames: number, side: GlareSide): number {
    const b = this.look.bloom
    const end = Math.exp(-b.span[side] / b.fall[side])
    return Math.max((Math.exp(-Math.abs(frames) / b.fall[side]) - end) / (1 - end), 0)
  }

  update(frames: number, side: GlareSide, on: boolean, sun: THREE.Vector3, camera: THREE.PerspectiveCamera, line: Line, radius: number, gain: number, aspect: number, time: number): void {
    const flood = on ? this.flood(frames, side) : 0
    const bloom = on ? this.bloom(frames, side) : 0
    this.mesh.visible = flood > 1e-4 || bloom > 0
    if (!this.mesh.visible) return
    const u = this.material.uniforms
    const b = this.look.bloom
    const v = this.v.copy(sun).applyQuaternion(this.q.copy(camera.quaternion).invert())
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const z = Math.max(-v.z, 0.05)
    ;(u.uSun!.value as THREE.Vector2).set(v.x / z / tan, v.y / z / tan)
    u.uFlood!.value = flood
    u.uBloom!.value = b.peak * bloom
    ;(u.uWide!.value as THREE.Vector2).set(b.wide[0] * (b.shrink[0] + (1 - b.shrink[0]) * Math.pow(bloom, b.shrink[1])), b.wide[1])
    ;(u.uLine!.value as THREE.Vector4).set(line.nx, line.ny, line.at, radius)
    u.uGain!.value = gain
    u.uAspect!.value = aspect
    u.uPhase!.value = time * b.turn
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
