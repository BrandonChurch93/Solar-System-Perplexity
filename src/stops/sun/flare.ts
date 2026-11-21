import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

export interface FlareLook {
  hot: [number, number, number]
  warm: [number, number, number]
  core: { radius: [number, number]; gain: number }
  halo: { radius: [number, number]; gain: [number, number]; power: number }
  rays: { amount: number; reach: number; turn: number }
  streak: { amount: number; height: number; reach: number }
  before: number
  after: number
  powerIn: number
  powerOut: number
  surge: number
}

const VERT = /* glsl */ `
out vec2 vScreen;
void main() {
  vScreen = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
uniform int uDiag;
uniform vec2 uAt;
uniform float uAspect;
uniform float uGain;
uniform float uTime;
uniform vec3 uHot;
uniform vec3 uWarm;
uniform vec4 uSize;
uniform vec4 uLevel;
uniform vec3 uRays;
uniform vec3 uStreak;
in vec2 vScreen;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  vec2 p = (vScreen - uAt) * vec2(uAspect, 1.0);
  float r = length(p);
  float ang = atan(p.y, p.x);
  float core = exp(-r * r / (uSize.x * uSize.x));
  float halo = pow(1.0 / (1.0 + r * r / (uSize.y * uSize.y)), uSize.z);
  float turn = uTime * uRays.z;
  float n = 0.5 + 0.5 * (0.45 * sin(ang * 5.0 + 0.6 + turn) + 0.3 * sin(ang * 11.0 - 1.1 - turn * 1.7) + 0.25 * sin(ang * 23.0 + 2.3 + turn * 2.9));
  float fine = 0.5 + 0.5 * sin(ang * 61.0 + 0.9 - turn * 4.1);
  float ray = (pow(n, 3.0) * (0.75 + 0.25 * fine) - 0.2) * exp(-r / (uSize.y * uRays.y));
  float line = exp(-abs(p.y) / uStreak.y) / (1.0 + p.x * p.x / (uStreak.z * uStreak.z));
  vec3 tint = mix(uWarm, uHot, clamp(halo * halo + core, 0.0, 1.0));
  vec3 col = uHot * core * uLevel.x + tint * halo * uLevel.y * max(1.0 + uRays.x * ray, 0.0) + mix(uWarm, uHot, 0.5) * line * uStreak.x * uLevel.z;
  outColor = vec4(col * uGain, 0.0);
}`

export class Flare {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly look: FlareLook
  private readonly at = new THREE.Vector3()
  private readonly turn = new THREE.Quaternion()

  constructor(look: FlareLook) {
    this.look = look
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uDiag: diagUniform, uAt: { value: new THREE.Vector2() }, uAspect: { value: 16 / 9 }, uGain: { value: 1 }, uTime: { value: 0 },
        uHot: { value: new THREE.Vector3(...look.hot) }, uWarm: { value: new THREE.Vector3(...look.warm) },
        uSize: { value: new THREE.Vector4(0.01, 0.1, look.halo.power, 0) }, uLevel: { value: new THREE.Vector4() },
        uRays: { value: new THREE.Vector3(look.rays.amount, look.rays.reach, look.rays.turn) },
        uStreak: { value: new THREE.Vector3(look.streak.amount, look.streak.height, look.streak.reach) },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.renderOrder = 20
    this.mesh.frustumCulled = false
    this.mesh.visible = false
  }

  amount(sinceCover: number): number {
    const k = this.look
    if (sinceCover <= -k.before || sinceCover >= k.after) return 0
    return sinceCover < 0 ? Math.pow(1 + sinceCover / k.before, k.powerIn) : Math.pow(1 - sinceCover / k.after, k.powerOut)
  }

  update(anchor: THREE.Vector3, world: THREE.Object3D, camera: THREE.PerspectiveCamera, amount: number, time: number, gain: number, aspect: number): void {
    const at = this.at.copy(anchor).applyQuaternion(world.quaternion).add(world.position).applyQuaternion(this.turn.copy(camera.quaternion).invert())
    this.mesh.visible = amount > 0 && at.z < -1e-4
    if (!this.mesh.visible) return
    const k = this.look
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const u = this.material.uniforms
    ;(u.uAt!.value as THREE.Vector2).set(at.x / -at.z / (t * aspect), at.y / -at.z / t)
    u.uAspect!.value = aspect
    u.uGain!.value = gain
    u.uTime!.value = time
    const grow = amount * amount
    ;(u.uSize!.value as THREE.Vector4).set(k.core.radius[0] + (k.core.radius[1] - k.core.radius[0]) * amount, k.halo.radius[0] + (k.halo.radius[1] - k.halo.radius[0]) * grow, k.halo.power, 0)
    ;(u.uLevel!.value as THREE.Vector4).set(k.core.gain * amount, k.halo.gain[0] * Math.sqrt(amount) + (k.halo.gain[1] - k.halo.gain[0]) * grow, amount, 0)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
