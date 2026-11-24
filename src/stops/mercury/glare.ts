import * as THREE from 'three'

export type GlareSide = 'dive' | 'rise'

export interface GlareLook {
  peak: number
  fade: Record<GlareSide, [number, number]>
  height: number
  top: [number, number]
  keep: [number, number]
  color: [number, number, number]
  halo: [number, number]
  core: [number, number]
  rays: [number, number]
  bar: [number, number, number]
  turn: number
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
uniform float uBloom;
uniform float uGain;
uniform float uAspect;
uniform float uPhase;
uniform vec3 uColor;
uniform vec2 uHalo;
uniform vec2 uCore;
uniform vec2 uRays;
uniform vec3 uBar;
uniform int uDiag;
in vec2 vNdc;
out vec4 outColor;
void main() {
  vec2 p = vNdc * vec2(uAspect, 1.0);
  vec2 d = p - uSun;
  float r = length(d);
  float a = atan(d.y, d.x);
  float s1 = 0.5 + 0.5 * sin(a * 6.0 + uPhase);
  float s2 = 0.5 + 0.5 * sin(a * 14.0 - uPhase * 1.7 + 2.1);
  float s3 = 0.5 + 0.5 * sin(a * 31.0 + uPhase * 0.6 + 4.0);
  float rays = 0.6 * pow(s1, 6.0) + 0.9 * pow(s1 * s2, 4.0) + 0.5 * pow(s2 * s3, 5.0);
  float q = r / uHalo.x;
  float c = r / uCore.x;
  float h = 1.0 + q * q;
  float k = 1.0 + c * c;
  float x = d.x / uBar.x;
  float y = d.y / uBar.y;
  float bar = uBar.z / ((1.0 + x * x) * (1.0 + y * y) * (1.0 + y * y));
  float g = uHalo.y / (h * h) + uCore.y / (k * k * k) + uRays.y * rays / (1.0 + pow(r / uRays.x, 3.0)) + bar;
  outColor = vec4(mix(uColor, vec3(1.0), clamp(g * uBloom * 0.25, 0.0, 1.0)) * (uBloom * g * uGain), 0.0);
  if (uDiag >= 2) discard;
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
        uSun: { value: new THREE.Vector2() }, uBloom: { value: 0 }, uGain: { value: 1 }, uAspect: { value: 16 / 9 }, uPhase: { value: 0 }, uColor: { value: new THREE.Vector3().fromArray(look.color) },
        uHalo: { value: new THREE.Vector2().fromArray(look.halo) }, uCore: { value: new THREE.Vector2().fromArray(look.core) }, uRays: { value: new THREE.Vector2().fromArray(look.rays) }, uBar: { value: new THREE.Vector3().fromArray(look.bar) }, uDiag: diag,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 10
    this.mesh.visible = false
  }

  update(amount: number, sun: THREE.Vector3, camera: THREE.PerspectiveCamera, gain: number, aspect: number, time: number): void {
    const bloom = this.look.peak * amount
    const v = this.v.copy(sun).applyQuaternion(this.q.copy(camera.quaternion).invert())
    this.mesh.visible = bloom > 1e-4 && v.z < -0.05
    if (!this.mesh.visible) return
    const u = this.material.uniforms
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const x = v.x / -v.z / tan
    const y = v.y / -v.z / tan
    ;(u.uSun!.value as THREE.Vector2).set(x, y)
    u.uBloom!.value = bloom
    u.uGain!.value = gain
    u.uAspect!.value = aspect
    u.uPhase!.value = time * this.look.turn
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
