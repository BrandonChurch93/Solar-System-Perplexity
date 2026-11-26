// The cap's detail from code, by place: rock under the plates of the place wherever one texel of the finest plate drawn is wider than
// a pixel of the master (the hook cap.detail of src/bodies/planet.ts). A plate seen from nearer than it was made for is a soft sheet;
// this text gives the ground under it its own forms, from the place and the cap's own heights alone: the layers of a wall by the
// height, the stones of the scree at its feet and of the plain by the place. Each comes as a factor on the ground's colour and as a
// height the cap's light reads, so the Sun models it. Nothing reads the time or the eye's height: texelPx is the size of the plate's
// texel on the screen, and every count leaves by the size of its own cell on the screen. At or under on[0] the factor is exactly 1
// and the height exactly 0 (a product with a smoothstep that is exactly 0 there). The numbers stand in detail.json.
import * as THREE from 'three'
import detailJson from './detail.json'

const RADIUS_KM = 3389.5

export const groundDetailText = `
uniform vec3 uDetailSpot;
uniform vec4 uDetailOn;
uniform vec4 uDetailStrata;
uniform vec4 uDetailWander;
uniform vec4 uDetailSlope;
uniform vec4 uDetailGrain;
float detailHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float detailNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(detailHash(i), detailHash(i + vec2(1.0, 0.0)), f.x), mix(detailHash(i + vec2(0.0, 1.0)), detailHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float detailLayer(float c, float row) {
  float i = floor(c);
  float f = fract(c);
  f = f * f * (3.0 - 2.0 * f);
  return mix(detailHash(vec2(i, row)), detailHash(vec2(i + 1.0, row)), f) - 0.5;
}
float detailSeen(float cellsAPixel) {
  return 1.0 - smoothstep(uDetailOn.z, uDetailOn.w, cellsAPixel);
}
vec4 groundDetail(vec3 dir, float height, vec3 normal, float texelPx) {
  float on = smoothstep(uDetailOn.x, uDetailOn.y, texelPx);
  vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), uDetailSpot));
  vec3 north = cross(uDetailSpot, east);
  vec2 km = vec2(dot(dir, east), dot(dir, north)) * ${RADIUS_KM.toFixed(1)};
  float up = clamp(dot(normal, dir), 0.0, 1.0);
  float steep = sqrt(1.0 - up * up);
  float wall = smoothstep(uDetailSlope.x, uDetailSlope.y, steep);
  float talus = smoothstep(uDetailSlope.z, uDetailSlope.w, steep) * (1.0 - wall);
  float level = height * ${RADIUS_KM.toFixed(1)} + (detailNoise(km / uDetailWander.y) - 0.5) * uDetailWander.x;
  float c1 = level / uDetailStrata.x;
  float c2 = level / uDetailStrata.y;
  float strata = wall * (detailLayer(c1, 7.0) * detailSeen(fwidth(c1)) + 0.5 * detailLayer(c2, 19.0) * detailSeen(fwidth(c2)));
  float grain = 0.0;
  float share = 1.0;
  vec2 q = km / uDetailGrain.x;
  for (int k = 0; k < 3; k++) {
    grain += share * (detailNoise(q + 17.0 * float(k)) - 0.5) * detailSeen(max(fwidth(q.x), fwidth(q.y)));
    q *= uDetailGrain.w;
    share *= 0.5;
  }
  grain *= (1.0 - wall) * (1.0 + uDetailWander.z * talus);
  float colour = 1.0 + on * (uDetailStrata.z * strata + uDetailGrain.y * grain);
  return vec4(vec3(colour), on * (uDetailStrata.w * strata + uDetailGrain.z * grain));
}
`

// spot: the place of the cap as a unit direction in the map's frame (the cap's centre)
export function groundDetailUniforms(spot: THREE.Vector3): Record<string, THREE.IUniform> {
  const d = detailJson
  return {
    uDetailSpot: { value: spot.clone().normalize() },
    uDetailOn: { value: new THREE.Vector4(d.on[0]!, d.on[1]!, d.finest[0]!, d.finest[1]!) },
    uDetailStrata: { value: new THREE.Vector4(d.strata.bandsKm[0]!, d.strata.bandsKm[1]!, d.strata.swing, d.strata.ledgeM / 1000 / RADIUS_KM) },
    uDetailWander: { value: new THREE.Vector4(d.strata.wanderKm, d.strata.wanderCellKm, d.grain.talusShare, 0) },
    uDetailSlope: { value: new THREE.Vector4(d.wall[0]!, d.wall[1]!, d.talus[0]!, d.talus[1]!) },
    uDetailGrain: { value: new THREE.Vector4(d.grain.cellKm, d.grain.swing, d.grain.heightM / 1000 / RADIUS_KM, d.grain.ratio) },
  }
}
