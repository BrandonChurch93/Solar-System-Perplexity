import * as THREE from 'three'
import data from './terrain.json'

const ty = Math.tan(THREE.MathUtils.degToRad(data.vfovDeg) / 2)
const tx = (ty * 16) / 9
const down = new THREE.Vector3().fromArray(data.down).normalize()
const c = data.canvas

function ray(ax: number, ay: number): THREE.Vector3 {
  return new THREE.Vector3((ax - 0.5) * 2 * tx, (0.5 - ay) * 2 * ty, -1)
}

function groundDistance(ax: number, ay: number): number {
  const d = ray(ax, ay).normalize()
  const centre = down.clone().multiplyScalar(data.radius + 1)
  const b = d.dot(centre)
  const disc = b * b - (centre.lengthSq() - data.radius * data.radius)
  return disc >= 0 && b > 0 ? b - Math.sqrt(disc) : -1
}

function onGround(ax: number, ay: number): THREE.Vector3 {
  const d = ray(ax, ay).normalize()
  const t = groundDistance(ax, ay)
  return d.multiplyScalar(t > 0 ? t : Math.sqrt((data.radius + 1) ** 2 - data.radius ** 2))
}

export const stage = {
  tan: [tx, ty] as [number, number],
  down,
  alpha: THREE.MathUtils.degToRad(data.alphaDeg),
  radius: data.radius,
  centre: down.clone().multiplyScalar(data.radius + 1),
  canvas: c,
  plateRows: c.height - c.plateTop,
  loopsBox: data.loopsBox as [number, number, number, number],
  feet: data.feet as [number, number][],
  spot: data.spot as [number, number],
  umbra: data.umbra as [number, number],
  skyCentre: [((c.left + c.span / 2) - 0.5) * 2 * tx, (0.5 - (c.top + c.span / 2)) * 2 * ty] as [number, number],
  ray,
  onGround,
  groundDistance,
}

const f = (v: number): string => (Number.isInteger(v) ? v.toFixed(1) : String(v))
const v3 = (v: THREE.Vector3): string => 'vec3(' + f(v.x) + ', ' + f(v.y) + ', ' + f(v.z) + ')'

export const STAGE_GLSL = /* glsl */ `
const vec2 ST_TAN = vec2(${f(tx)}, ${f(ty)});
const vec3 ST_DOWN = ${v3(down)};
const vec3 ST_CENTRE = ${v3(stage.centre)};
const float ST_RADIUS = ${f(data.radius)};
const float ST_ALPHA = ${f(stage.alpha)};
const vec4 ST_CANVAS = vec4(${f(c.left)}, ${f(c.top)}, ${f(c.span)}, ${f(c.plateTop / c.height)});
const float ST_ROWS = ${f(stage.plateRows / c.height)};
vec2 stImage(vec3 p) {
  vec2 q = p.xy / max(-p.z, 0.02);
  return vec2(q.x / (2.0 * ST_TAN.x) + 0.5, 0.5 - q.y / (2.0 * ST_TAN.y));
}
vec2 stPlate(vec2 a) {
  vec2 k = (a - ST_CANVAS.xy) / ST_CANVAS.z;
  return vec2(k.x, 1.0 - (k.y - ST_CANVAS.w) / ST_ROWS);
}`
