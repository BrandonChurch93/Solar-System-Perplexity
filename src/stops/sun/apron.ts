import * as THREE from 'three'
import data from './apron.json'
import { stage } from './stage'

const ty = Math.tan(THREE.MathUtils.degToRad(data.vfovDeg) / 2)
const tx = (ty * 16) / 9
const eye = new THREE.Vector3().fromArray(data.position)
const turn = new THREE.Quaternion().fromArray(data.quaternion)
const right = new THREE.Vector3(1, 0, 0).applyQuaternion(turn)
const up = new THREE.Vector3(0, 1, 0).applyQuaternion(turn)
const back = new THREE.Vector3(0, 0, 1).applyQuaternion(turn)
const stageUp = stage.down.clone().negate()
const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(stage.down, stage.down.z).normalize()
const side = fwd.clone().cross(stageUp).normalize()
const rel = eye.clone().sub(stage.down)

const f = (v: number): string => (Number.isInteger(v) ? v.toFixed(1) : String(v))
const v3 = (v: THREE.Vector3): string => 'vec3(' + f(v.x) + ', ' + f(v.y) + ', ' + f(v.z) + ')'

export const APRON_GLSL = /* glsl */ `
const vec3 AP_EYE = ${v3(eye)};
const vec3 AP_RIGHT = ${v3(right)};
const vec3 AP_UP = ${v3(up)};
const vec3 AP_BACK = ${v3(back)};
const vec2 AP_TAN = vec2(${f(tx)}, ${f(ty)});
const float AP_TOP = ${f(data.top)};
const vec2 AP_NEAR = vec2(${f(data.near[0]!)}, ${f(data.near[1]!)});
const float AP_FEATHER = ${f(data.feather)};
const vec2 AP_NADIR = vec2(${f(rel.dot(side))}, ${f(rel.dot(fwd))});
vec2 apImage(vec3 p) {
  vec3 r = p - AP_EYE;
  float z = max(-dot(r, AP_BACK), 0.02);
  return vec2(dot(r, AP_RIGHT) / z / (2.0 * AP_TAN.x) + 0.5, 0.5 - dot(r, AP_UP) / z / (2.0 * AP_TAN.y));
}
vec2 apUv(vec2 b) {
  return vec2(b.x, 1.0 - (b.y - AP_TOP) / (1.0 - AP_TOP));
}
float apWeight(vec3 p, vec2 b) {
  vec2 a = stImage(p);
  float inside = smoothstep(0.0, AP_FEATHER, a.x) * smoothstep(0.0, AP_FEATHER, 1.0 - a.x) * smoothstep(0.0, AP_FEATHER, 1.0 - a.y);
  vec3 r = p - ST_DOWN;
  float near = 1.0 - smoothstep(AP_NEAR.x, AP_NEAR.y, length(vec2(dot(r, ST_RIGHT), dot(r, ST_FWD)) - AP_NADIR));
  float beyond = max(max(-b.x, b.x - 1.0), b.y - 1.0);
  return (1.0 - inside) * near * (1.0 - smoothstep(0.08, 0.1, beyond));
}`
