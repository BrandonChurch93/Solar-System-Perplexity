import * as THREE from 'three'

// The glow of the stop's own air over the sky. Where the lens is low over the ring plane, the fine dust that
// floats over and under the plane, lit by the Sun and by the globe, lays a faint blue light under the stars; it
// is a little brighter along the plane, where the line of sight runs through more of it, and the dust throws
// the light of the lit globe forward, so a wide soft halo stands round the lit limb and falls with the angle
// of the ray from it; the dark limb has none. It is drawn first, so the globe, the rings and the moon cover it
// and it shows only where the sky shows. How much of it there is follows the height of the lens alone
// (model.ts), the same going down and coming up, and it is a function of the ray and of where the lens is: no
// picture. Numbers: skim.json sky.glow.
const VERT = /* glsl */ `
out vec3 vRay;
void main() {
  vec4 far = inverse(projectionMatrix) * vec4(position.xy, 1.0, 1.0);
  vRay = far.xyz / far.w;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = /* glsl */ `
precision highp float;
in vec3 vRay;
uniform mat3 uLens;
uniform vec3 uGlow;
uniform vec2 uPlane;
uniform vec3 uHalo;
uniform vec3 uHaloShape;
uniform vec3 uEye;
uniform vec3 uSun;
uniform float uPolar;
out highp vec4 outColor;
void main() {
  vec3 ray = normalize(uLens * vRay);
  vec3 air = uGlow * (1.0 + uPlane.x * exp(-abs(ray.y) / uPlane.y));
  // the globe as the unit sphere: the angle of the ray outside its limb, and whether the limb nearest to the ray is lit
  vec3 d = normalize(vec3(ray.x, ray.y / uPolar, ray.z));
  float far = length(uEye);
  float along = -dot(uEye, d);
  vec3 nearest = uEye + d * along;
  float miss = length(nearest);
  float off = asin(min(miss / far, 1.0));
  float angle = (along > 0.0 ? off : 3.14159265 - off) - asin(min(1.0 / far, 1.0));
  float lit = smoothstep(uHaloShape.y, uHaloShape.z, dot(nearest / max(miss, 1e-6), uSun));
  outColor = vec4(air + uHalo * lit * exp(-max(angle, 0.0) / uHaloShape.x), 0.0);
}`

export interface VeilLook { color: number[]; plane: number; fall: number; halo: { color: number[]; fallDeg: number; lit: number[] } }

export class Veil {
  readonly mesh: THREE.Mesh
  private readonly material: THREE.ShaderMaterial
  private readonly color: THREE.Vector3
  private readonly halo: THREE.Vector3
  private readonly turn = new THREE.Matrix4()

  constructor(look: VeilLook, polar: number) {
    this.color = new THREE.Vector3().fromArray(look.color)
    this.halo = new THREE.Vector3().fromArray(look.halo.color)
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
      uniforms: {
        uLens: { value: new THREE.Matrix3() }, uGlow: { value: new THREE.Vector3() }, uPlane: { value: new THREE.Vector2(look.plane, look.fall) },
        uHalo: { value: new THREE.Vector3() }, uHaloShape: { value: new THREE.Vector3(THREE.MathUtils.degToRad(look.halo.fallDeg), look.halo.lit[0]!, look.halo.lit[1]!) },
        uEye: { value: new THREE.Vector3() }, uSun: { value: new THREE.Vector3() }, uPolar: { value: polar },
      },
      blending: THREE.AdditiveBlending, premultipliedAlpha: true, transparent: true, depthWrite: false, depthTest: false,
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 0
  }

  // lens: the turn from the camera to the frame of the rings (its y is the normal of the ring plane); eye and sun: the
  // place of the lens and the direction of the Sun in that frame with the globe as the unit sphere; amount: how much of
  // the glow shows, times the gain of the frame.
  set(lens: THREE.Quaternion, eye: THREE.Vector3, sun: THREE.Vector3, amount: number): void {
    const u = this.material.uniforms
    this.mesh.visible = amount > 0
    ;(u.uLens!.value as THREE.Matrix3).setFromMatrix4(this.turn.makeRotationFromQuaternion(lens))
    ;(u.uGlow!.value as THREE.Vector3).copy(this.color).multiplyScalar(amount)
    ;(u.uHalo!.value as THREE.Vector3).copy(this.halo).multiplyScalar(amount)
    ;(u.uEye!.value as THREE.Vector3).copy(eye)
    ;(u.uSun!.value as THREE.Vector3).copy(sun)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
