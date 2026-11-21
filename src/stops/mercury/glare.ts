import * as THREE from 'three'

export type GlareSide = 'dive' | 'enter' | 'leave' | 'rise'

export interface GlareLook {
  plateau: number
  sides: Record<GlareSide, { ramp: number; reach: [number, number] }>
  floor: { peak: number; curve: number; color: [number, number, number]; even: number }
  sun: { peak: number; curve: number; lead: number; color: [number, number, number]; wide: [number, number]; core: [number, number]; rays: [number, number]; turn: number }
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
uniform float uFloor;
uniform float uAmount;
uniform float uGain;
uniform float uAspect;
uniform float uPhase;
uniform vec3 uFloorColor;
uniform vec3 uSunColor;
uniform vec2 uWide;
uniform vec2 uCore;
uniform vec2 uRays;
uniform vec2 uEven;
uniform int uDiag;
in vec2 vNdc;
out vec4 outColor;
void main() {
  if (uDiag >= 2) discard;
  vec2 d = vNdc * vec2(uAspect, 1.0) - uSun;
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
  float f = uFloor * (uEven.x + (1.0 - uEven.x) / (w * w));
  outColor = vec4((uFloorColor * f + uSunColor * (uAmount * g)) * uGain, 0.0);
}`

function steep(s: number, k: number): number {
  return (Math.exp(k * s) - 1) / (Math.exp(k) - 1)
}

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
        uSun: { value: new THREE.Vector2() }, uFloor: { value: 0 }, uAmount: { value: 0 }, uGain: { value: 1 }, uAspect: { value: 16 / 9 }, uPhase: { value: 0 },
        uFloorColor: { value: new THREE.Vector3().fromArray(look.floor.color) }, uSunColor: { value: new THREE.Vector3().fromArray(look.sun.color) },
        uWide: { value: new THREE.Vector2().fromArray(look.sun.wide) }, uCore: { value: new THREE.Vector2().fromArray(look.sun.core) }, uRays: { value: new THREE.Vector2().fromArray(look.sun.rays) }, uEven: { value: new THREE.Vector2(look.floor.even, 1) }, uDiag: diag,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 10
    this.mesh.visible = false
  }

  strength(frames: number, side: GlareSide): number {
    return 1 - THREE.MathUtils.clamp((Math.abs(frames) - this.look.plateau) / this.look.sides[side].ramp, 0, 1)
  }

  update(s: number, sun: THREE.Vector3, camera: THREE.PerspectiveCamera, gain: number, aspect: number, time: number, side: GlareSide): void {
    this.mesh.visible = s > 0
    if (s <= 0) return
    const u = this.material.uniforms
    const v = this.v.copy(sun).applyQuaternion(this.q.copy(camera.quaternion).invert())
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const z = Math.max(-v.z, 0.05)
    ;(u.uSun!.value as THREE.Vector2).set(v.x / z / tan, v.y / z / tan)
    u.uFloor!.value = this.look.floor.peak * steep(s, this.look.floor.curve)
    u.uAmount!.value = this.look.sun.peak * (steep(s, this.look.sun.curve) + this.look.sun.lead * s * s)
    u.uGain!.value = gain
    u.uAspect!.value = aspect
    u.uPhase!.value = time * this.look.sun.turn
    const reach = this.look.sides[side].reach
    ;(u.uEven!.value as THREE.Vector2).set(this.look.floor.even, reach[0] * Math.exp(-reach[1] * (1 - s)))
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
