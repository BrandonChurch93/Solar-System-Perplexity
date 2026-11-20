import * as THREE from 'three'

const VERT = /* glsl */ `
out vec3 vWorldN;
out vec3 vViewDir;
void main() {
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uSunDir;
uniform vec3 uColor;
uniform float uStrength;
uniform float uPower;
in vec3 vWorldN;
in vec3 vViewDir;
out vec4 outColor;
void main() {
  vec3 n = normalize(vWorldN);
  float rim = pow(clamp(1.0 - abs(dot(n, normalize(vViewDir))), 0.0, 1.0), uPower);
  float day = smoothstep(-0.25, 0.5, dot(n, uSunDir));
  outColor = vec4(uColor * rim * day * uStrength, 0.0);
}`

export interface AtmosphereOptions { radius?: number; color: THREE.Color; strength?: number; power?: number }

export class Atmosphere {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(o: AtmosphereOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uSunDir: { value: new THREE.Vector3(1, 0, 0) },
        uColor: { value: o.color },
        uStrength: { value: o.strength ?? 1 },
        uPower: { value: o.power ?? 3 },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(o.radius ?? 1.04, 128, 64), this.material)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
