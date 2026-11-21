import * as THREE from 'three'
import { implicitUniform } from '../core/texel'
import { EQUIRECT_GLSL } from '../space/sky'

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vWorldN;
out vec3 vView;
void main() {
  vLocal = position;
  vWorldN = normalize(mat3(modelMatrix) * position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uTerminator;
uniform float uNight;
uniform float uSpin;
in vec3 vLocal;
in vec3 vWorldN;
in vec3 vView;
out vec4 outColor;
${EQUIRECT_GLSL}
void main() {
  vec3 d = normalize(vLocal);
  float c = cos(uSpin), s = sin(uSpin);
  d = vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
  vec3 albedo = equirect(uMap, d).rgb;
  float ndl = dot(normalize(vWorldN), uSunDir);
  float lit = smoothstep(-uTerminator, uTerminator, ndl) * max(ndl * 0.5 + 0.5, 0.0);
  outColor = vec4(albedo * (uSunColor * lit + uNight), 1.0);
}`

export interface GlobeOptions { map: THREE.Texture; terminator?: number; night?: number; segments?: number }

export class Globe {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial

  constructor(o: GlobeOptions) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMap: { value: o.map }, uImplicit: implicitUniform,
        uSunDir: { value: new THREE.Vector3(1, 0, 0) },
        uSunColor: { value: new THREE.Color(1, 1, 1) },
        uTerminator: { value: o.terminator ?? 0.08 },
        uNight: { value: o.night ?? 0.004 },
        uSpin: { value: 0 },
      },
    })
    const seg = o.segments ?? 192
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), this.material)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
