import * as THREE from 'three'

export interface LensLook {
  ghost: { at: number; tiltDeg: number; size: [number, number]; core: [number, number, number]; tail: [number, number, number]; fringe: [number, number, number]; halo: [number, number, number]; haloSize: number }
  fade: [number, number]
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
uniform float uAmount;
uniform float uGain;
uniform float uAspect;
uniform float uVignette;
uniform float uAt;
uniform vec2 uSize;
uniform vec3 uCore;
uniform vec3 uTail;
uniform vec3 uFringe;
uniform vec3 uHalo;
uniform float uHaloSize;
uniform vec2 uTilt;
uniform int uDiag;
in vec2 vNdc;
out vec4 outColor;
void main() {
  if (uDiag >= 2 || uAmount <= 0.0) discard;
  vec2 p = vNdc * vec2(uAspect, 1.0);
  float far = length(uSun);
  vec2 a = far > 1e-4 ? uSun / far : vec2(1.0, 0.0);
  a = vec2(a.x * uTilt.x - a.y * uTilt.y, a.x * uTilt.y + a.y * uTilt.x);
  vec2 b = vec2(-a.y, a.x);
  vec2 q = p + uSun * uAt;
  vec2 e = vec2(dot(q, a) / uSize.x, dot(q, b) / uSize.y);
  float r = length(e);
  float body = 1.0 - smoothstep(0.55, 1.2, r);
  float along = smoothstep(-0.5, 0.75, e.x);
  vec3 col = mix(uCore, uTail, along) * body;
  col += uFringe * smoothstep(0.2, 1.0, e.x) * (1.0 - smoothstep(0.9, 1.7, r)) * smoothstep(0.5, 1.0, r);
  col += uHalo * exp(-length(q) / uHaloSize);
  vec2 v = vNdc * 0.5 * vec2(uAspect, 1.0);
  float k = uGain * uAmount / mix(1.0, 1.0 / pow(1.0 + dot(v, v) * 0.9, 2.0), uVignette);
  outColor = vec4(col * k, 0.0);
}`

export class Lens {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly v = new THREE.Vector3()
  private readonly q = new THREE.Quaternion()
  private readonly fade: [number, number]

  constructor(l: LensLook, diag: THREE.IUniform<number>) {
    this.fade = l.fade
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uSun: { value: new THREE.Vector2() }, uAmount: { value: 0 }, uGain: { value: 1 }, uAspect: { value: 16 / 9 }, uVignette: { value: 0 },
        uAt: { value: l.ghost.at }, uSize: { value: new THREE.Vector2().fromArray(l.ghost.size) }, uCore: { value: new THREE.Vector3().fromArray(l.ghost.core) }, uTail: { value: new THREE.Vector3().fromArray(l.ghost.tail) },
        uFringe: { value: new THREE.Vector3().fromArray(l.ghost.fringe) }, uHalo: { value: new THREE.Vector3().fromArray(l.ghost.halo) }, uHaloSize: { value: l.ghost.haloSize },
        uTilt: { value: new THREE.Vector2(Math.cos(THREE.MathUtils.degToRad(l.ghost.tiltDeg)), Math.sin(THREE.MathUtils.degToRad(l.ghost.tiltDeg))) }, uDiag: diag,
      },
    })
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.mesh.frustumCulled = false
  }

  update(sun: THREE.Vector3, camera: THREE.PerspectiveCamera, amount: number, gain: number, vignette: number, aspect: number): void {
    const u = this.material.uniforms
    const v = this.v.copy(sun).applyQuaternion(this.q.copy(camera.quaternion).invert())
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    let seen = 0
    if (v.z < -1e-3) {
      const x = v.x / -v.z / tan
      const y = v.y / -v.z / tan
      ;(u.uSun!.value as THREE.Vector2).set(x, y)
      const out = Math.max(Math.abs(x) / aspect, Math.abs(y))
      seen = 1 - THREE.MathUtils.smoothstep(out, this.fade[0], this.fade[1])
    }
    u.uAmount!.value = amount * seen
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.visible = amount * seen > 0
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
