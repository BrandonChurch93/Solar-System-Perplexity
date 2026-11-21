import * as THREE from 'three'
import { diagUniform } from '../../diagnostics/diag'

export interface FlareLook {
  hot: [number, number, number]
  warm: [number, number, number]
  core: { radius: [number, number]; gain: number; power: number }
  halo: { radius: [number, number]; gain: number; power: number }
  veil: number
  cover: { rise: [number, number]; fall: [number, number]; power: number }
  before: number
  after: number
  powerIn: number
  powerOut: number
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
uniform vec3 uHot;
uniform vec3 uWarm;
uniform vec4 uSize;
uniform vec4 uLevel;
in vec2 vScreen;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  vec2 p = (vScreen - uAt) * vec2(uAspect, 1.0);
  float rr = dot(p, p);
  float core = pow(1.0 / (1.0 + rr / (uSize.x * uSize.x)), uSize.z);
  float halo = pow(1.0 / (1.0 + rr / (uSize.y * uSize.y)), uSize.w);
  float cover = clamp(uLevel.w * (uLevel.w + (2.0 - uLevel.w) * halo), 0.0, 1.0);
  vec3 col = uWarm * (uLevel.z * cover + uLevel.y * halo) + uHot * (uLevel.x * core);
  outColor = vec4(col * uGain, cover);
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
        uDiag: diagUniform, uAt: { value: new THREE.Vector2() }, uAspect: { value: 16 / 9 }, uGain: { value: 1 },
        uHot: { value: new THREE.Vector3(...look.hot) }, uWarm: { value: new THREE.Vector3(...look.warm) },
        uSize: { value: new THREE.Vector4(0.01, 0.1, look.core.power, look.halo.power) }, uLevel: { value: new THREE.Vector4() },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
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

  amount(since: number): number {
    const k = this.look
    if (since <= -k.before || since >= k.after) return 0
    const x = since < 0 ? 1 + since / k.before : 1 - since / k.after
    const s = x * x * x * (x * (x * 6 - 15) + 10)
    return Math.pow(s, since < 0 ? k.powerIn : k.powerOut)
  }

  cover(since: number): number {
    const k = this.look.cover
    const share = (a: number, b: number): number => Math.pow(Math.min(Math.max((since - a) / (b - a), 0), 1), k.power)
    return share(k.rise[0], k.rise[1]) * share(k.fall[1], k.fall[0])
  }

  update(anchor: THREE.Vector3, world: THREE.Object3D, camera: THREE.PerspectiveCamera, amount: number, cover: number, gain: number, aspect: number): void {
    const at = this.at.copy(anchor).applyQuaternion(world.quaternion).add(world.position).applyQuaternion(this.turn.copy(camera.quaternion).invert())
    this.mesh.visible = amount > 0 && at.z < -1e-4
    if (!this.mesh.visible) return
    const k = this.look
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const u = this.material.uniforms
    ;(u.uAt!.value as THREE.Vector2).set(at.x / -at.z / (t * aspect), at.y / -at.z / t)
    u.uAspect!.value = aspect
    u.uGain!.value = gain
    const grow = amount * amount * amount
    ;(u.uSize!.value as THREE.Vector4).set(k.core.radius[0] + (k.core.radius[1] - k.core.radius[0]) * grow, k.halo.radius[0] + (k.halo.radius[1] - k.halo.radius[0]) * grow, k.core.power, k.halo.power)
    ;(u.uLevel!.value as THREE.Vector4).set(k.core.gain * grow, k.halo.gain * amount, k.veil, cover)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
