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

const FOLD_BELOW_LIMB_DEG = 2.6
const up = down.clone().negate()
const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(down, down.z).normalize()
const right = fwd.clone().cross(up).normalize()

function flat(p: THREE.Vector3): [number, number] {
  const rel = p.clone().sub(down)
  return [rel.dot(right), rel.dot(fwd)]
}

function fold(): { near: number; apex: [number, number]; phi: [number, number]; far: number } {
  const margin = 0.03
  const bottom = c.top + c.span - margin
  const sides = [c.left + margin, c.left + c.span - margin]
  let near = 0
  for (let i = 0; i <= 16; i++) near = Math.max(near, flat(onGround(sides[0]! + ((sides[1]! - sides[0]!) * i) / 16, bottom))[1])
  const below = new THREE.Vector3(0, -1, 0)
  const centre = down.clone().multiplyScalar(data.radius + 1)
  const b = below.dot(centre)
  const apex = flat(below.clone().multiplyScalar(b - Math.sqrt(b * b - (centre.lengthSq() - data.radius * data.radius))))
  const phi: [number, number] = [-Math.PI, Math.PI]
  for (let i = 0; i <= 48; i++) {
    const ay = bottom - (bottom - 0.4) * (i / 48)
    for (let k = 0; k < 2; k++) {
      if (groundDistance(sides[k]!, ay) < 0) continue
      const g = flat(onGround(sides[k]!, ay))
      const a = Math.atan2(g[0] - apex[0], g[1] - apex[1])
      if (k === 0) phi[0] = Math.max(phi[0], a)
      else phi[1] = Math.min(phi[1], a)
    }
  }
  const gamma = THREE.MathUtils.degToRad(data.alphaDeg - FOLD_BELOW_LIMB_DEG)
  const dir = down.clone().multiplyScalar(Math.cos(gamma)).addScaledVector(fwd, Math.sin(gamma))
  const bd = dir.dot(centre)
  const far = flat(dir.multiplyScalar(bd - Math.sqrt(bd * bd - (centre.lengthSq() - data.radius * data.radius))))
  return { near, apex, phi, far: Math.hypot(far[0], far[1]) }
}

const folded = fold()

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
  fold: folded,
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
const vec3 ST_RIGHT = ${v3(right)};
const vec3 ST_FWD = ${v3(fwd)};
const vec4 ST_FOLD = vec4(${f(folded.near)}, ${f(folded.apex[0])}, ${f(folded.apex[1])}, ${f(folded.far)});
const vec2 ST_PHI = vec2(${f(folded.phi[0])}, ${f(folded.phi[1])});
vec3 stFold(vec3 p) {
  vec3 rel = p - ST_DOWN;
  vec2 g = vec2(dot(rel, ST_RIGHT), dot(rel, ST_FWD));
  float r = length(g);
  g *= abs(ST_FOLD.w - abs(r - ST_FOLD.w)) / max(r, 1e-4);
  for (int i = 0; i < 2; i++) {
    g.y = ST_FOLD.x + abs(g.y - ST_FOLD.x);
    vec2 q = g - ST_FOLD.yz;
    float phi = atan(q.x, q.y);
    phi = phi > ST_PHI.y ? 2.0 * ST_PHI.y - phi : (phi < ST_PHI.x ? 2.0 * ST_PHI.x - phi : phi);
    g = ST_FOLD.yz + length(q) * vec2(sin(phi), cos(phi));
  }
  float y = sqrt(max(ST_RADIUS * ST_RADIUS - dot(g, g), 0.0)) - ST_RADIUS;
  return ST_DOWN + ST_RIGHT * g.x + ST_FWD * g.y - ST_DOWN * y;
}
float stLimb(float mu) {
  float m = max(mu, 0.1) - 0.1;
  return 0.15 + 0.12 * exp(-m / 0.35) + 0.25 * exp(-m / 0.05);
}
vec3 stLimbDir(vec3 d, vec3 c1, float el) {
  vec3 ref = vec3(0.0, 0.0, -1.0);
  vec3 e1 = normalize(ref - c1 * dot(ref, c1));
  vec3 e2 = cross(c1, e1);
  float az = atan(dot(d, e2), dot(d, e1));
  float g0 = ST_ALPHA + el;
  return ST_DOWN * cos(g0) + sin(g0) * (ST_FWD * cos(az) + cross(ST_DOWN, ST_FWD) * sin(az));
}
vec2 stImage(vec3 p) {
  vec2 q = p.xy / max(-p.z, 0.02);
  return vec2(q.x / (2.0 * ST_TAN.x) + 0.5, 0.5 - q.y / (2.0 * ST_TAN.y));
}
vec2 stPlate(vec2 a) {
  vec2 k = (a - ST_CANVAS.xy) / ST_CANVAS.z;
  return vec2(k.x, 1.0 - (k.y - ST_CANVAS.w) / ST_ROWS);
}`
