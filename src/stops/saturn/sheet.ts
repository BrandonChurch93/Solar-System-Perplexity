import * as THREE from 'three'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { RING_FIELD_GLSL, type RingField } from './field'
import model from './ringfield.json'
import look from './sheet.json'

export const GLOBE_SHADOW_GLSL = /* glsl */ `
uniform vec4 uShadowFit;
uniform vec3 uShadowReach;
vec3 globeShadow(vec3 P, vec3 sunL, float polar) {
  vec3 ps = vec3(P.x, P.y / polar, P.z);
  vec3 ss = normalize(vec3(sunL.x, sunL.y / polar, sunL.z));
  float b = dot(ps, ss);
  float d = length(ps - ss * b);
  float w = uShadowFit.x + uShadowFit.y * max(-b, 0.0);
  vec3 lit = smoothstep(vec3(1.0) - w * uShadowReach, vec3(1.0 + w), vec3(d));
  return b < 0.0 ? lit : vec3(1.0);
}`

const VERT = /* glsl */ `
out vec3 vLocal;
out vec3 vView;
out vec3 vClip;
void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
in vec3 vLocal;
in vec3 vView;
in vec3 vClip;
uniform vec3 uCamL;
uniform vec3 uSunL;
uniform float uPolar;
uniform int uPass;
uniform float uGrad;
uniform float uGain;
uniform float uWeight;
uniform float uVignette;
uniform float uAspect;
uniform float uFinest;
uniform vec4 uShade;
uniform vec4 uViewFit;
uniform vec3 uPhase[${look.phase.deg.length}];
uniform float uSat;
uniform vec3 uFloor;
uniform vec3 uLayer;
out vec4 outColor;
${DIAG_GLSL}
${RING_FIELD_GLSL}
${GLOBE_SHADOW_GLSL}
// what the sheet returns at a phase angle over what it returns where the model was measured, for a dense
// sheet (x) and a thin one (y): straight lines between the knots, flat outside
vec2 phaseGain(float deg) {
  vec2 g = uPhase[0].yz;
  for (int k = 1; k < ${look.phase.deg.length}; k++) g = mix(g, uPhase[k].yz, clamp((deg - uPhase[k - 1].x) / (uPhase[k].x - uPhase[k - 1].x), 0.0, 1.0));
  return g;
}
void main() {
  vec2 q = vLocal.xz;
  float r = length(q);
  float fp = ringFootprint(length(vec2(dFdx(r), dFdy(r))), uGrad);
  float texels = diagTexels(q / uFinest);
  vec3 P = vec3(q.x, 0.0, q.y);
  vec3 ray = P - uCamL;
  vec3 cs = vec3(uCamL.x, uCamL.y / uPolar, uCamL.z);
  vec3 ds = vec3(ray.x, ray.y / uPolar, ray.z);
  bool front = -dot(cs, ds) > dot(ds, ds);
  bool mine = front == (uPass == 1);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  for (int k = 0; k < (mine ? 1 : 0); k++) {
    vec2 knots = ringKnots(r, fp);
    vec4 ink = ringInk(r);
    float thin = ringThin(r);
    float tau = knots.x;
    float lum = knots.y;
    vec3 tint;
    ringFine(r, fp, ink.a, thin, dot(q / r, normalize(uSunL.xz)), tau, lum, tint);
    float dist = length(ray);
    float mu = max(abs(ray.y) / dist, 1e-3);
    float mu0 = max(abs(uSunL.y), 0.02);
    bool same = uCamL.y * uSunL.y > 0.0;
    float seen = same ? ringSat(tau * (1.0 / mu0 + 1.0 / mu)) / max(ringSat(tau * uRfLight.x), 1e-6) : uShade.w * exp(-tau / mu0) * ringSat(tau / mu) / max(ringSat(tau * uRfLight.x), 1e-6);
    float deg = degrees(acos(clamp(dot(ray, uSunL) / -dist, -1.0, 1.0)));
    vec2 byPhase = phaseGain(deg);
    float law = pow(clamp((uRfLight.y + uRfLight.z) / (mu0 + mu), uViewFit.x, uViewFit.y), mix(uShade.x, uShade.y, thin)) * mix(byPhase.x, byPhase.y, thin);
    vec3 tone = mix(vec3(1.0), ink.rgb, uSat * mix(1.0, min(law, 1.0), thin * uViewFit.z)) * tint;
    vec3 lit = globeShadow(P, uSunL, uPolar);
    // stars do not show through any part of the sheet that holds ice; the globe shows through by the true depth
    float bn = dot(cs, ds) / length(ds);
    float behind = front ? 1.0 - smoothstep(0.97, 1.0, sqrt(max(dot(cs, cs) - bn * bn, 0.0))) : 0.0;
    alpha = 1.0 - exp(-tau / mu * mix(uViewFit.w, 1.0, behind));
    col = lum * tone * (seen * law * uShade.z) * mix(uFloor, vec3(1.0), lit);
  }
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain * uWeight / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  alpha *= uWeight;
  outColor = diagOut(vec4(col, alpha), texels, 1.0, uLayer, vec2(0.0), length(vView));
  if (mine == false || (uDiag >= 2 && alpha < 0.5)) discard;
}`

export class Sheet {
  readonly group = new THREE.Group()
  readonly materials: THREE.ShaderMaterial[] = []
  readonly uniforms: Record<string, THREE.IUniform>
  private readonly geometry: THREE.BufferGeometry

  constructor(field: RingField, polar: number) {
    const seg = look.segments
    const span = model.span as [number, number]
    const inner = span[0]
    const outer = span[1] / Math.cos(Math.PI / seg)
    const pos = new Float32Array((seg + 1) * 2 * 3)
    const index: number[] = []
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2
      pos.set([Math.cos(a) * inner, 0, Math.sin(a) * inner], i * 6)
      pos.set([Math.cos(a) * outer, 0, Math.sin(a) * outer], i * 6 + 3)
    }
    for (let i = 0; i < seg; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 2, i * 2 + 1, i * 2 + 3)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.geometry.setIndex(index)
    this.uniforms = {
      ...field.uniforms,
      uCamL: { value: new THREE.Vector3(0, 1, 3) }, uSunL: { value: new THREE.Vector3(1, 0.2, 0) }, uPolar: { value: polar },
      uGrad: gradUniform, uDiag: diagUniform, uGain: { value: 1 }, uWeight: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
      uFinest: { value: field.finest },
      uShade: { value: new THREE.Vector4(look.view.dense, look.view.thin, look.gain[0], look.unlit) },
      uViewFit: { value: new THREE.Vector4(look.view.clamp[0], look.view.clamp[1], look.grey, look.starCover) },
      uPhase: { value: look.phase.deg.map((deg, k) => new THREE.Vector3(deg, look.phase.dense[k], look.phase.thin[k])) },
      uSat: { value: 1 },
      uShadowFit: { value: new THREE.Vector4(look.shadow.soft[0], look.shadow.soft[1], 0, 0) },
      uShadowReach: { value: new THREE.Vector3().fromArray(look.shadow.reach) },
      uFloor: { value: new THREE.Vector3().fromArray(look.shadow.floor) },
      uLayer: { value: new THREE.Vector3().fromArray(look.layer) },
    }
    for (const pass of [0, 1]) {
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG,
        uniforms: { ...this.uniforms, uPass: { value: pass } },
        side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      })
      const mesh = new THREE.Mesh(this.geometry, material)
      mesh.frustumCulled = false
      mesh.renderOrder = pass === 0 ? 2 : 6
      this.materials.push(material)
      this.group.add(mesh)
    }
  }

  dispose(): void {
    this.geometry.dispose()
    for (const m of this.materials) m.dispose()
  }
}
