import * as THREE from 'three'
import { config } from '../../config'
import { diagUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'
import { formatUniform, setFormat } from './format'
import { stage } from './stage'
import data from './arcs.json'

/**
 * The arcade as bodies in space. Every strand is a fixed line in the stage with a place and a depth of its own: an
 * arch from one foot to the other in its own plane, a short arc thrown out of a foot, or a line that hangs from an
 * arch down to the ground. A strand is drawn as a band along its line that turns about the line to face the eye and
 * carries the light of a thin round tube; the ground in front of it hides it by depth.
 *
 * One law lights all of them: what a strand gives is its plasma (a fixed pattern along its length that is carried
 * along the line at the strand's steady speed, no period in it) times a share that grows toward the nearer foot of
 * the arcade, and its colour follows from how much it gives. Nothing of a strand comes or goes with the clock; the lines stand
 * still and only the plasma on them moves.
 *
 * A strand thinner than a pixel keeps a pixel's width and gives less light by the same share; the thinner it is, the
 * more its light lies as one soft bell over its band and the less as a line. So the arcade seen from far is the same
 * body with the same light, filtered: a glow in the shape of its lines, not a wire.
 *
 * MAIL 1463: the arches leave each foot as a fan (the high ones outward, the low ones inward over the hollow), they
 * run in ropes whose strands wind about each other and whose heights wave, so ropes cross and dark gaps stand between
 * them, and where a leg meets the ground it stands in a pool of white hot gas (POOL_FRAG) that lights the ground about
 * the foot. A foot throws a spray: most of its throws end in the air and fade toward that end, a few come down as
 * loops. All of it is fixed in the stage: the only thing that moves is the plasma along the strands.
 *
 * After the ruling on the first name of that mail: a leg is a broad sheet (feet.fan: the high arches stand further out
 * at a foot than the low ones), a strand is bright and wide by its distance from the nearer foot and not by its height
 * over the ground, the pool is drawn over the strands so that a leg comes out of its light, and a faint haze of the
 * same kind of gas (data.haze, balls along the middle arch, under the strands) stands about the arcade and in its
 * hollow. The light of a pool on what stands in it and behind it (data.lit, the same balls laid so that what is there
 * grows brighter by the ball's share): the ground about a foot is lit with its own cells and the strands of a leg are
 * white hot where they meet, by their own light, so the gas of the pool itself can be small and thin. None of it moves.
 *
 * The strands are drawn in two passes over the same lines. First the shade: each strand hides what stands behind the
 * whole arcade (sky, stars, ground, haze) and lays no light. Then the light: a strand hides the strands behind it only
 * by its own light's share of the most, so strands over each other add up to the most and a faint flank takes nothing
 * from a bright core behind it. The colour follows the light at each place across a tube: a pale core, cool flanks.
 */

const VERT = /* glsl */ `
precision highp float;
in vec3 aTan;
in vec4 aAcross;
in vec4 aStrand;
in vec2 aFlow;
uniform vec3 uCam;
uniform float uFormat;
uniform vec3 uLeast;
uniform vec2 uHalo;
uniform vec2 uWide;
out vec4 vAcross;
out vec4 vStrand;
out vec4 vFlow;
out vec3 vClip;
out vec3 vAt;
void main() {
  vec3 across = cross(aTan, uCam - position);
  across /= max(length(across), 1e-6);
  vec4 mid = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  // the half width in pixels of the buffer (uLeast.y: the rows of the master's frame)
  float scale = projectionMatrix[1][1] / max(mid.w, 1e-6) * 0.5 * uLeast.y * uFormat;
  // near a foot of the arcade the gas of a strand is dense and its tube wide (uWide.x times wider at the foot, falling
  // off over the distance uWide.y from the nearer foot), so where the strands of a leg meet at the foot they close
  // into one white hot body. It is the distance from the foot and not the height over the ground: a throw or a drip
  // that comes down somewhere else lands thin and dim
  float rad = aStrand.y * (1.0 + uWide.x * exp(-max(aAcross.z, 0.0) / uWide.y));
  float px = rad * length(mat3(modelViewMatrix) * across) * scale;
  // how many steps of the strand's own pattern along its length lie under one pixel: the length is seen short by the
  // angle between the strand and the look
  vec3 look = uCam - position;
  float seen = length(cross(aTan, look)) / max(length(look), 1e-6);
  float steps = 1.0 / max(seen * length(mat3(modelViewMatrix) * aTan) * scale * aFlow.x, 1e-6);
  // the band is as wide as the tube's thin sheath (uHalo.x times the tube's width) and never narrower on the screen
  // than its own least (uLeast.z, pixels). The least belongs to the band and not to the tube: a wider sheath does not
  // widen what a far strand is drawn with, so no light is laid where no gas is
  float band = max(px * uHalo.x, uLeast.z);
  vAt = position + across * (aAcross.x * rad * band / max(px, 1e-6));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vAt, 1.0);
  vAcross = aAcross;
  // y: the share of the drawn band that the true band has (the light falls by it); vFlow.z: the tube's true half
  // width against the width under which it is no line any more (uLeast.x); vFlow.w: the pattern's steps under a pixel
  vStrand = vec4(aStrand.x, px * uHalo.x / band, aStrand.z, aStrand.w);
  vFlow = vec4(aFlow, px / uLeast.x, steps);
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform int uDiag;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uKeep;
uniform float uTime;
uniform vec4 uPlasma;
uniform vec4 uPlasmaMore;
uniform vec4 uFoot;
uniform vec3 uCool;
uniform vec3 uHot;
uniform vec2 uThick;
uniform vec2 uTone;
uniform vec2 uHalo;
uniform vec2 uThin;
uniform vec4 uAlong;
uniform vec3 uCam;
uniform vec4 uBall;
uniform float uShade;
in vec4 vAcross;
in vec4 vStrand;
in vec4 vFlow;
in vec3 vClip;
in vec3 vAt;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
float ah(float n, float seed) {
  vec2 p = fract(vec2(n, seed * 419.2) * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}
// a fixed pattern along the strand: values at whole steps, smooth between, no period
float an(float x, float seed) {
  float i = floor(x);
  float f = x - i;
  f = f * f * (3.0 - 2.0 * f);
  return mix(ah(i, seed), ah(i + 1.0, seed), f);
}
// the colour of gas that gives g of the white: the cool colour where it gives little, toward the hot one as it gives
// more (uTone.x: the light at which it stands halfway between them; by the square of the light, so a faint strand
// keeps the cool colour whole and a strand near the white is gold)
vec3 heat(float g) {
  return mix(uCool, uHot, g * g / (g * g + uTone.x * uTone.x)) * g;
}
// no channel passes uTone.y of the white. A light over it keeps its own colour at that level and goes toward the hot
// colour by the share it stands over, so the brightest gas is pale gold and never the yellow of two channels at
// their limit with the third behind
vec3 limit(vec3 c) {
  float m = max(c.r, max(c.g, c.b));
  float over = 1.0 - min(uTone.y / max(m, 1e-6), 1.0);
  return mix(c * (1.0 - over), uHot * uTone.y, over);
}
void main() {
  if (uDiag >= 2) discard;
  // where the ball is not in the depth buffer (the far Sun's pass draws no depth): a strand behind the ball, as the
  // eye sees it, gives no light. uBall: the ball's centre and radius in the stage's frame, radius 0 for no test
  if (uBall.w > 0.0) {
    vec3 d = vAt - uCam;
    float far = length(d);
    vec3 dir = d / max(far, 1e-6);
    vec3 f = uCam - uBall.xyz;
    float along = -dot(f, dir);
    vec3 nearest = f + dir * along;
    float off = dot(nearest, nearest);
    if (along > 0.0 && off < uBall.w * uBall.w && along - sqrt(uBall.w * uBall.w - off) < far) discard;
  }
  // the light of a thin round tube across its width, and of the thin sheath around it
  float x = vAcross.x * uHalo.x;
  float sheath = 1.0 - vAcross.x * vAcross.x;
  // the plasma: the pattern is laid along the length and carried at the strand's own steady speed
  float q = (vAcross.y - vStrand.w * uTime) / vFlow.x + vStrand.x * 251.0;
  // a pattern finer along the strand than the pixels that draw it is not a row of points any more: over the range
  // uAlong.xy of its steps under one pixel it goes to its own mean (uAlong.z the blobs', uAlong.w the sparks'), so the
  // strand gives the same light at every distance and a far strand does not glitter as its plasma moves
  float blobs = mix(pow(an(q, vStrand.x), uPlasma.z), uAlong.z, smoothstep(uAlong.x, uAlong.y, vFlow.w));
  float sparks = mix(pow(an(q * uPlasmaMore.x + 17.0, vStrand.x + 0.37), uPlasmaMore.y), uAlong.w, smoothstep(uAlong.x, uAlong.y, vFlow.w * uPlasmaMore.x));
  float plasma = uPlasma.x + uPlasma.y * blobs + uPlasma.w * sparks;
  float low = 1.0 + uFoot.x * exp(-max(vAcross.z, 0.0) / uFoot.y);
  // (an open strand fades toward both its ends, vFlow.y 1, or toward its far end only, vFlow.y 2: a throw out of a
  // foot that ends in the air begins in the pool with its full light)
  float ends = mix(smoothstep(0.0, uFoot.z, vAcross.w), 1.0, step(1.5, vFlow.y)) * smoothstep(0.0, uFoot.z, 1.0 - vAcross.w);
  // what the strand gives on its middle line, in shares of the white
  float gives = vStrand.z * plasma * low * mix(1.0, ends, min(vFlow.y, 1.0)) * uPlasmaMore.z;
  // the sheath is the thin gas about the tube: it gives its share (uHalo.y) of what the tube's own gas gives at the most,
  // so a strand that is many times over the white in its core keeps a faint sheath and does not grow into a white post
  // (it is cooler than the tube: its colour is the cool end of the heat's, whatever the core's is)
  vec3 thin = uCool * (min(gives, uTone.y) * uHalo.y);
  // the tube's colour follows the light it gives at each place across its width: the core of a bright strand is
  // pale and its flanks are the cool colour. No channel stands over uTone.y of the white (limit), so a strand many
  // times over the white goes from the cool colour through gold to pale gold
  vec3 lit = inverseFilmic(limit(heat(gives * max(1.0 - x * x, 0.0)) + thin * (sheath * sheath)));
  // a strand thinner than a pixel is not a line any more: the light of its tube and sheath, summed across the band
  // in linear light (three points over the tube, two over the sheath beyond it), is laid as one bell over the whole
  // band. The sum across is the same as the tube's own, so the strand gives the pixel the share of it that its true
  // width covers and nothing more; many of them over each other are a glow in the shape of their lines
  float soft = 1.0 - smoothstep(uThin.x, uThin.y, vFlow.z);
  if (soft > 0.0) {
    float edge = 1.0 / uHalo.x;
    vec3 sum = vec3(0.0);
    for (int k = 0; k < 3; k++) {
      float a = edge * (k == 0 ? 0.1127017 : k == 1 ? 0.5 : 0.8872983);
      float s = 1.0 - a * a;
      float t = a * uHalo.x;
      sum += edge * (k == 1 ? 0.4444444 : 0.2777778) * inverseFilmic(limit(heat(gives * (1.0 - t * t)) + thin * (s * s)));
    }
    for (int k = 0; k < 2; k++) {
      float a = edge + (1.0 - edge) * (k == 0 ? 0.2113249 : 0.7886751);
      float s = 1.0 - a * a;
      sum += (1.0 - edge) * 0.5 * inverseFilmic(thin * (s * s));
    }
    lit = mix(lit, sum * (1.875 * sheath * sheath), soft);
  }
  vec3 col = lit * (vStrand.y * uKeep);
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  // the thick limit: gas that lies over gas does not add without end. Each layer of light covers the strands behind
  // it by the share its own light has of the most a body of this heat can give (uThick.x times the white of the heat's
  // curve), so strands that lie over each other add their light up to that white and no further, at every distance:
  // a leg where many meet burns white by their own light and the bloom has no more to spread
  float share = max(col.r, max(col.g, col.b)) / inverseFilmic(vec3(uTone.y)).r;
  float own = min(share / uThick.x, 1.0);
  // what stands behind the whole arcade (the sky and its stars, the ground, the haze) a strand hides by more than
  // that: by its share to the power uThick.y (under 1). It is gas that stands before the stars, and they do not show
  // through it as points on it. That is the shade, drawn for all strands before any gives its light (uShade 1: it
  // lays no light and hides by what is left of that after the light's own cover), so no strand's light is taken
  // away by the shade of another
  float all = max(min(pow(share, uThick.y) / uThick.x, 1.0), own);
  outColor = uShade > 0.5 ? vec4(0.0, 0.0, 0.0, (all - own) / max(1.0 - own, 1e-6)) : vec4(col, own);
}`

/**
 * The pool at a foot: where the strands of a leg meet the ground the gas is dense and white hot, a low ball of light
 * that stands on the ground at the foot, with a wide thin glow of the same gas about it. It is a body in space: its
 * light at a pixel is the gas the look passes through from the eye to the ground (or on into the sky), so the ground
 * before the foot lies under the pool's light, the ground behind it too, and the ball of the Sun hides a pool behind
 * it. Nothing in it moves or changes with the clock.
 */
const POOL_VERT = /* glsl */ `
precision highp float;
in vec3 aUp;
in vec4 aBall;
in vec2 aCorner;
uniform vec3 uCam;
out vec3 vAt;
out vec3 vMid;
out vec3 vUp;
out vec4 vBall;
out vec3 vClip;
void main() {
  vec3 f = normalize(uCam - position);
  vec3 r = normalize(cross(aUp, f));
  vec3 u = cross(f, r);
  // the card that carries it is wide enough for the ball's light down to nothing (aBall.z times its width)
  vAt = position + (r * aCorner.x + u * aCorner.y) * (aBall.x * aBall.z);
  vMid = position;
  vUp = aUp;
  vBall = aBall;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vAt, 1.0);
  vClip = gl_Position.xyw;
}`

const POOL_FRAG = /* glsl */ `
precision highp float;
uniform int uDiag;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform float uKeep;
uniform vec3 uCam;
uniform vec4 uGround;
uniform vec3 uCool;
uniform vec3 uHot;
uniform vec2 uThick;
uniform vec3 uPool;
uniform float uLit;
in vec3 vAt;
in vec3 vMid;
in vec3 vUp;
in vec4 vBall;
in vec3 vClip;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
float erfOf(float x) {
  float x2 = x * x;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2)));
}
void main() {
  if (uDiag >= 2) discard;
  vec3 d = normalize(vAt - uCam);
  // how far the look goes before the ground ends it (uGround: the ball's centre and radius in the stage's frame)
  vec3 g = uCam - uGround.xyz;
  float gb = dot(g, d);
  float disc = gb * gb - dot(g, g) + uGround.w * uGround.w;
  float reach = 1e9;
  if (disc > 0.0 && -gb - sqrt(disc) > 0.0) reach = -gb - sqrt(disc);
  // the ball is flat: as wide as vBall.x along the ground and vBall.y high. In the space where it is round the look
  // is a straight line still, and the gas along it is a bell about the point where it passes the middle nearest
  float k = vBall.x / vBall.y - 1.0;
  vec3 o = uCam - vMid;
  o += vUp * (dot(o, vUp) * k);
  vec3 e = d + vUp * (dot(d, vUp) * k);
  float a = dot(e, e);
  float t0 = -dot(o, e) / a;
  float off = max(dot(o, o) - a * t0 * t0, 0.0);
  float sa = sqrt(a) / vBall.x;
  float gives = vBall.w * exp(-off / (vBall.x * vBall.x)) / sqrt(a) * 0.5 * (erfOf((reach - t0) * sa) + erfOf(t0 * sa));
  // (uPool: the light at which the pool's gas stands halfway between the cool colour and the hot one, the most a
  // channel may hold, and the share of what is behind it that the pool at its fullest hides: it is thin gas that
  // lights the ground under it more than it hides it)
  // (uLit 1: this ball is not gas that gives light of its own but the light the pool throws on what stands in it
  // and behind it. What is there, the ground about the foot and the strands of the leg, is seen brighter by the
  // share the ball gives at this look, each by its own light, so the ground keeps its cells and the strands their
  // lines; where nothing is behind it but the sky it adds nothing)
  if (uLit > 0.5) {
    outColor = vec4(uHot * (gives * uKeep), 1.0);
    return;
  }
  vec3 base = mix(uCool, uHot, gives / (gives + uPool.x)) * gives;
  vec3 col = inverseFilmic(min(base, vec3(uPool.y))) * uKeep;
  vec2 vq = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  col *= uGain / mix(1.0, 1.0 / pow(1.0 + dot(vq, vq) * 0.9, 2.0), uVignette);
  float cover = uPool.z * min(pow(max(col.r, max(col.g, col.b)) / inverseFilmic(vec3(uPool.y)).r, uThick.y) / uThick.x, 1.0);
  outColor = vec4(col, cover);
}`

/** The mean along a strand of its pattern raised to a power: the pattern stands at whole steps on values spread evenly
 *  from 0 to 1 and runs smoothly between two of them (the shader's an()). Summed over a fixed grid, the same at every run. */
function patternMean(power: number): number {
  const n = 48
  let sum = 0
  for (let i = 0; i < n; i++) {
    const a = (i + 0.5) / n
    for (let j = 0; j < n; j++) {
      const b = (j + 0.5) / n
      for (let k = 0; k < n; k++) {
        const f = (k + 0.5) / n
        const w = f * f * (3 - 2 * f)
        sum += Math.pow(a + (b - a) * w, power)
      }
    }
  }
  return sum / (n * n * n)
}

/** A whole number and a slot give one fixed value from 0 to 1: the same at every run. */
function fixed(seed: number): (id: number, slot: number) => number {
  const mix = (a: number): number => {
    a = Math.imul(a ^ (a >>> 16), 0x7feb352d)
    a = Math.imul(a ^ (a >>> 15), 0x846ca68b)
    return (a ^ (a >>> 16)) >>> 0
  }
  return (id, slot) => mix((mix((id + seed) | 0) + Math.imul(slot + 1, 0x9e3779b9)) | 0) / 4294967296
}

interface Shape {
  sided: boolean
  bulge: number
  skew: number
  power: number
  wave: number[]
  /** How the strand winds about its arch (a rope's twist): how far off it stands at the top (stage units), where
   *  about it at the first foot (radians) and how far it goes about it from foot to foot (radians). */
  twist?: number[]
  /** How far out the arch stands among the arches of the arcade, 0 the lowest and 1 the highest (shape.outer). */
  out?: number
}

interface Strand {
  line: THREE.Vector3[]
  seed: number
  radius: number
  gain: number
  speed: number
  clump: number
  /** 1: the strand ends in the air and fades toward its ends; 2: it ends in the air at its far end only and fades
   *  toward that end; 0: both ends stand in the ground. */
  open: number
}

export class Arcade {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  /** The material of the pools at the feet (it shares the strands' eye, light and share). */
  readonly poolMaterial: THREE.ShaderMaterial
  private readonly litMaterial: THREE.ShaderMaterial
  private readonly shadeMaterial: THREE.ShaderMaterial
  private readonly shade: THREE.Mesh
  private readonly pool: THREE.Mesh
  private readonly lit: THREE.Mesh
  private readonly haze: THREE.Mesh
  /** The arcade's own place: the middle between its feet on the ground, in the stage's frame. */
  readonly place: THREE.Vector3
  /** How many strands stand. */
  readonly strands: number
  /** The arcade's greatest height over the ball, in stage units. */
  readonly tall: number
  /** How it leaves: by its own height in pixels of a frame of `lines` rows, gone under px[0], whole from px[1], a
   *  smooth step in the logarithm of that height between them. Under px[0] the strands are thinner than a pixel and
   *  the body is no longer loops to the eye but a few soft dots (MAIL 1421), so it gives no light from there on.
   *  under: how far under the ball's radius the ball stands that hides a strand where no depth is drawn (stage units). */
  readonly leave: { lines: number; px: number[]; under: number } = data.leave
  private readonly keep: THREE.IUniform<number> = { value: 1 }
  private readonly time: THREE.IUniform<number> = { value: 0 }
  private readonly ball: THREE.IUniform<THREE.Vector4> = { value: new THREE.Vector4() }
  private readonly seatQuat = new THREE.Quaternion()
  private readonly seatAt = new THREE.Vector3()
  private seatScale = 1
  private start = 0
  private readonly eye = new THREE.Vector3()
  private readonly back = new THREE.Matrix4()

  constructor() {
    const rnd = fixed(data.seed)
    const between = (r: number[], x: number): number => r[0]! + (r[1]! - r[0]!) * x
    const feet = stage.feet as [[number, number], [number, number]]
    const footA = stage.onGround(feet[0][0], feet[0][1])
    const footB = stage.onGround(feet[1][0], feet[1][1])
    this.place = footA.clone().add(footB).multiplyScalar(0.5)
    const up = this.place.clone().sub(stage.centre).normalize()
    const axis = footB.clone().sub(footA)
    axis.addScaledVector(up, -axis.dot(up)).normalize()
    // the two legs come down a little inside the two places of the ground (feet.in, stage units toward the other foot,
    // the first foot's and the second's): the place between them and the axis stay those of the ground
    footA.addScaledVector(axis, data.feet.in[0]!).sub(stage.centre).setLength(stage.radius).add(stage.centre)
    footB.addScaledVector(axis, -data.feet.in[1]!).sub(stage.centre).setLength(stage.radius).add(stage.centre)
    // toward the eye of the close view (the stage's origin)
    const toward = up.clone().cross(axis).normalize()
    if (toward.dot(this.place) > 0) toward.negate()
    const onBall = (p: THREE.Vector3, sink = 0): THREE.Vector3 => p.clone().sub(stage.centre).setLength(stage.radius - sink).add(stage.centre)
    const height = (p: THREE.Vector3): number => p.distanceTo(stage.centre) - stage.radius
    const s = data.shape

    /** An arch from a to b on the ground: h its height, lean how far its plane tips toward the eye, id its number. */
    const shapeOf = (id: number, sided = true): Shape => ({
      sided,
      bulge: between(s.bulge, rnd(id, 20)),
      skew: between(s.skew, rnd(id, 21)),
      power: between(s.power, rnd(id, 26)),
      wave: [rnd(id, 22) * 6.2831853, rnd(id, 23) * 6.2831853, 1.5 + 2 * rnd(id, 24), 4 + 4 * rnd(id, 25)],
    })
    const arch = (a: THREE.Vector3, b: THREE.Vector3, h: number, lean: number, segments: number, shape: Shape): THREE.Vector3[] => {
      const span = b.clone().sub(a)
      const length = span.length()
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const along = span.clone().normalize()
      const out = mid.clone().sub(stage.centre).normalize()
      const side = out.clone().cross(along).normalize()
      if (side.dot(toward) < 0) side.negate()
      const lift = out.clone().multiplyScalar(Math.cos(lean)).addScaledVector(side, Math.sin(lean))
      const off = along.clone().cross(lift).normalize()
      const { bulge, skew, power, wave } = shape
      const sided = shape.sided ? 1 : 0
      const rank = shape.out ?? 0
      const line: THREE.Vector3[] = []
      for (let i = 0; i <= segments; i++) {
        const th = (Math.PI * i) / segments
        const w = Math.max(Math.sin(th), 0)
        // the two sides of an arch are not alike (shape.side, the left foot's side and the right's): a side may be
        // broad at the shoulder (bulge, by the square of the height) or stand out beyond its foot low down (round,
        // most at half the height, nothing at the foot and at the top; shape.outer adds to it for the high arches,
        // so the outer ones leave a foot outward and the inner ones inward: a fan from the foot)
        const k = th < Math.PI / 2 ? 0 : 1
        const low = 4 * w * (1 - w)
        const x = -Math.cos(th) * 0.5 * length * (1 + (bulge + sided * s.side.bulge[k]!) * w * w + sided * (s.side.round[k]! + s.outer[k]! * rank) * low) + skew * h * w * w
        // (shape.ripple: no strand is a clean arc. Its height goes up and down a little along it, by two slow waves of
        // its own, in shares of its height, nothing at the feet: so strands of one rope cross and part again)
        const y = h * (Math.pow(w, power) + w * (s.ripple[0]! * Math.sin(wave[2]! * th + wave[1]!) + s.ripple[1]! * Math.sin(wave[3]! * th + wave[0]!))) - s.sink * (1 - w)
        const z = w * (s.wave[0]! * Math.sin(wave[2]! * th + wave[0]!) + s.wave[1]! * Math.sin(wave[3]! * th + wave[1]!)) * Math.min(h / s.height, 1)
        // the twist: the strand goes about its arch as it runs along it, nothing at the feet and the most at the top
        const about = shape.twist ? shape.twist[1]! + shape.twist[2]! * (i / segments) : 0
        const far = shape.twist ? shape.twist[0]! * w : 0
        line.push(mid.clone().addScaledVector(along, x).addScaledVector(lift, y + far * Math.cos(about)).addScaledVector(off, z + far * Math.sin(about)))
      }
      return line
    }
    const foot = (base: THREE.Vector3, id: number, slot: number, wide: number[], scale = 1): THREE.Vector3 => {
      const r = Math.sqrt(rnd(id, slot))
      const a = rnd(id, slot + 1) * 6.2831853
      return onBall(base.clone().addScaledVector(axis, wide[0]! * scale * r * Math.cos(a)).addScaledVector(toward, wide[1]! * scale * r * Math.sin(a)))
    }

    const all: Strand[] = []
    const m = data.main
    const deg = THREE.MathUtils.degToRad
    // an arch of the arcade: its height (many near the outer shell), its lean and where its two feet stand
    // (shape.inner: a low arch has its top nearer the second foot than a high one, by so much of its height at the
    // lowest, so the arches leave the first foot as a fan and the inner ones lean in over the hollow)
    const mainArch = (id: number, heights: number[]): { h: number; lean: number; a: THREE.Vector3; b: THREE.Vector3; shape: Shape } => {
      const high = 1 - Math.pow(rnd(id, 0), 1 / m.shell)
      const shape = shapeOf(id)
      shape.skew += s.inner * (1 - high)
      shape.out = high
      // (feet.fan: a high arch stands further out at a foot than a low one, by so many stage units at the highest, the
      // first foot's and the second's, so a leg is a broad sheet that opens outward and not one rope)
      const fanA = footA.clone().addScaledVector(axis, -data.feet.fan[0]! * high)
      const fanB = footB.clone().addScaledVector(axis, data.feet.fan[1]! * high)
      return { h: s.height * between(heights, high), lean: deg(between(m.leanDeg, rnd(id, 1))), a: foot(fanA, id, 2, m.feet), b: foot(fanB, id, 4, m.feet), shape }
    }
    for (let k = 0; k < m.count; k++) {
      const id = 1000 + k
      let p = mainArch(id, m.loose.heights)
      const bundled = rnd(id, 6) < m.inBundle
      const rope = Math.min(Math.floor(Math.pow(rnd(id, 7), m.unlike) * m.bundles), m.bundles - 1)
      if (bundled) {
        // a strand of a bundle: the bundle's arch, a little off it, with the bundle's own form (its bulge, its skew,
        // its roundness and its waves), so the strands of one rope run side by side and two ropes cross. The bundles
        // are of unlike size: the first ones hold the most strands, and a bundle of many strands is wider than one of few
        const n = rope
        const g = mainArch(100 + n, m.heights)
        const wide = between(m.spread.wide, n / Math.max(m.bundles - 1, 1))
        const off = wide * m.spread.shape
        // (main.low.spread: a low rope is looser than a high one, its strands so many times further apart in height
        // and in lean at the lowest, so under the band stands a fan of single lines and not one more rope with an edge)
        const loosen = 1 + m.low.spread * (1 - THREE.MathUtils.smoothstep(g.h / s.height, m.low.heights[0]!, m.low.heights[1]!))
        p = {
          h: g.h * (1 + wide * m.spread.height * loosen * (2 * rnd(id, 8) - 1)),
          lean: g.lean + deg(wide * m.spread.leanDeg * loosen) * (2 * rnd(id, 9) - 1),
          a: foot(g.a, id, 10, [wide * m.spread.feet, wide * m.spread.feet]),
          b: foot(g.b, id, 12, [wide * m.spread.feet, wide * m.spread.feet]),
          shape: {
            sided: true,
            out: g.shape.out,
            bulge: g.shape.bulge + off * (s.bulge[1]! - s.bulge[0]!) * (2 * rnd(id, 27) - 1),
            skew: g.shape.skew + off * (s.skew[1]! - s.skew[0]!) * (2 * rnd(id, 28) - 1),
            power: g.shape.power + off * (s.power[1]! - s.power[0]!) * (2 * rnd(id, 29) - 1),
            wave: [g.shape.wave[0]! + off * 6.2831853 * (2 * rnd(id, 30) - 1), g.shape.wave[1]! + off * 6.2831853 * (2 * rnd(id, 31) - 1), g.shape.wave[2]!, g.shape.wave[3]!],
            // the strands of one rope wind about it the same way (the rope's own turn, one way or the other), each at
            // its own distance from the middle and from its own side
            twist: [wide * m.spread.twist[0]! * Math.sqrt(rnd(id, 32)), 6.2831853 * rnd(id, 33), 6.2831853 * m.spread.twist[1]! * (rnd(100 + n, 34) < 0.5 ? -1 : 1) * (0.6 + 0.8 * rnd(100 + n, 35))],
          },
        }
      }
      const thick = Math.pow(rnd(id, 14), 2)
      // (main.low: the low arches, the ones under the band and over the hollow, are thinner and dimmer than the high
      // ones, so the band has no hard inner edge and the inner ones are a fan of fine lines)
      const rank = THREE.MathUtils.smoothstep(p.h / s.height, m.low.heights[0]!, m.low.heights[1]!)
      const lowGain = m.low.gain + (1 - m.low.gain) * rank
      const lowRadius = m.low.radius + (1 - m.low.radius) * rank
      all.push({
        line: arch(p.a, p.b, p.h, p.lean, m.segments, p.shape),
        seed: rnd(id, 15),
        // a strand of no bundle is thinner and dimmer than one of a rope
        radius: between(m.radius, thick) * (bundled ? 1 : m.loose.radius) * lowRadius,
        // (spread.gain: the ropes are not alike in light: each has a level of its own, so a few burn and others are dim)
        gain: between(m.gain, Math.pow(rnd(id, 16), m.dim)) * (m.thinGain + (1 - m.thinGain) * thick) * (bundled ? between(m.spread.gain, rnd(100 + rope, 36)) : m.loose.gain) * lowGain,
        speed: between(m.speed, rnd(id, 17)) * (rnd(id, 18) < m.back ? -1 : 1),
        clump: between(m.clump, rnd(id, 19)),
        open: 0,
      })
    }
    // lines that hang from an arch down to the ground: each starts on an arch of its own, leaves along it and falls
    const d = data.drips
    for (let k = 0; k < d.count; k++) {
      const id = 5000 + k
      const h = s.height * between(d.heights, rnd(id, 0))
      const over = arch(foot(footA, id, 2, m.feet), foot(footB, id, 4, m.feet), h, deg(between(d.leanDeg, rnd(id, 1))), m.segments, shapeOf(id))
      const at = Math.round(between(d.from, rnd(id, 6)) * m.segments)
      const from = over[at]!
      const downhill = at < m.segments / 2 ? -1 : 1
      const tangent = over[at + downhill]!.clone().sub(from).normalize()
      const under = onBall(from.clone().lerp(this.place, d.inward * rnd(id, 7)), s.sink)
      const fall = from.distanceTo(under)
      const c1 = from.clone().addScaledVector(tangent, d.hook * fall)
      const c2 = under.clone().addScaledVector(under.clone().sub(stage.centre).normalize(), 0.45 * fall)
      const curve = new THREE.CubicBezierCurve3(from, c1, c2, under)
      // the rain is a spray of short falls: each is drawn over a share of the way down (fall) that begins somewhere
      // below the arch (begin), and dies at both ends by the law of an open end
      const begin = between(d.begin, rnd(id, 9))
      const share = Math.min(between(d.fall, rnd(id, 8)), 1 - begin)
      const rain: THREE.Vector3[] = []
      for (let i = 0; i <= d.segments; i++) rain.push(curve.getPoint(begin + (i / d.segments) * share))
      all.push({
        line: rain,
        seed: rnd(id, 15),
        radius: between(d.radius, rnd(id, 14)),
        gain: between(d.gain, rnd(id, 16)),
        speed: between(d.speed, rnd(id, 17)),
        clump: between(d.clump, rnd(id, 19)),
        open: 1,
      })
    }
    // short arcs thrown out of a foot and falling back to the ground near it
    data.fountains.forEach((f, n) => {
      const base = f.foot === 0 ? footA : footB
      const outward = f.foot === 0 ? axis.clone().negate() : axis.clone()
      const round = base.clone().sub(stage.centre).normalize()
      const sideways = round.clone().cross(outward).normalize()
      for (let k = 0; k < f.count; k++) {
        const id = 8000 + 1000 * n + k
        const turn = deg(between(f.turnDeg, rnd(id, 0)))
        const reach = between(f.reach, Math.pow(rnd(id, 1), 1.6))
        const a = foot(base, id, 2, [f.feet, f.feet])
        // turn 0: along the axis, away from the other foot
        const dir = outward.clone().multiplyScalar(Math.cos(turn)).addScaledVector(sideways, Math.sin(turn))
        const b = onBall(a.clone().addScaledVector(dir, reach))
        const h = Math.min(reach * between(f.tall, rnd(id, 4)), f.most)
        // a fountain is a throw: its top stands nearer the foot than the place it falls to (skew) and it is no
        // half circle (power)
        // (spray: a share of the throws does not come down as a whole loop: the line ends in the air after a part of
        // its way, with an open end, so the foot throws a spray and only a few loops close. A throw of the spray flies
        // out as it rises, spray.skew, where a loop stands up over its foot first)
        const spray = rnd(id, 37) < f.spray.share
        const thrown = arch(a, b, h, deg(f.leanDeg * (2 * rnd(id, 5) - 1)), f.segments, { ...shapeOf(id, false), power: between(f.power, rnd(id, 26)), skew: between(spray ? f.spray.skew : f.skew, rnd(id, 21)) })
        const kept = spray ? Math.max(Math.round(between(f.spray.part, rnd(id, 38)) * f.segments), 3) : f.segments
        all.push({
          line: thrown.slice(0, kept + 1),
          seed: rnd(id, 15),
          radius: between(f.radius, Math.pow(rnd(id, 14), 2)),
          gain: between(f.gain, rnd(id, 16)),
          speed: between(f.speed, rnd(id, 17)),
          clump: between(f.clump, rnd(id, 19)),
          open: spray ? 2 : 0,
        })
      }
    })
    // the far strands first: a strand covers what is behind it (the thick limit), so the order of the drawing is the
    // order of the depth as the close view sees it, the distance of a strand's middle from the stage's origin, fixed
    // once and the same at every frame
    const far = (st: Strand): number => { const c = new THREE.Vector3(); for (const p of st.line) c.add(p); return c.multiplyScalar(1 / st.line.length).length() }
    const depth = new Map<Strand, number>(all.map((st) => [st, far(st)]))
    all.sort((a, b) => depth.get(b)! - depth.get(a)!)
    this.strands = all.length
    let tall = 0
    for (const st of all) for (const p of st.line) tall = Math.max(tall, height(p))
    this.tall = tall

    let points = 0
    for (const st of all) points += st.line.length
    const position = new Float32Array(points * 2 * 3)
    const tan = new Float32Array(points * 2 * 3)
    const across = new Float32Array(points * 2 * 4)
    const strand = new Float32Array(points * 2 * 4)
    const flow = new Float32Array(points * 2 * 2)
    const index: number[] = []
    let v = 0
    const t = new THREE.Vector3()
    for (const st of all) {
      const n = st.line.length
      let run = 0
      for (let i = 0; i < n; i++) {
        const p = st.line[i]!
        if (i > 0) run += p.distanceTo(st.line[i - 1]!)
        t.copy(st.line[Math.min(i + 1, n - 1)]!).sub(st.line[Math.max(i - 1, 0)]!).normalize()
        for (let e = 0; e < 2; e++) {
          p.toArray(position, v * 3)
          t.toArray(tan, v * 3)
          across.set([e === 0 ? -1 : 1, run, Math.min(p.distanceTo(footA), p.distanceTo(footB)), i / (n - 1)], v * 4)
          strand.set([st.seed, st.radius, st.gain, st.speed], v * 4)
          flow.set([st.clump, st.open], v * 2)
          v++
        }
        if (i < n - 1) index.push(v - 2, v - 1, v, v - 1, v + 1, v)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('aTan', new THREE.BufferAttribute(tan, 3))
    geometry.setAttribute('aAcross', new THREE.BufferAttribute(across, 4))
    geometry.setAttribute('aStrand', new THREE.BufferAttribute(strand, 4))
    geometry.setAttribute('aFlow', new THREE.BufferAttribute(flow, 2))
    geometry.setIndex(index)
    const l = data.light
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uDiag: diagUniform, uFormat: formatUniform,
        uCam: { value: new THREE.Vector3() }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 },
        uKeep: this.keep, uTime: this.time, uBall: this.ball,
        uLeast: { value: new THREE.Vector3(data.least, config.raw.formats.master.height, data.band) },
        uHalo: { value: new THREE.Vector2(l.sheath[0]!, l.sheath[1]!) },
        uWide: { value: new THREE.Vector2(l.wide[0]!, l.wide[1]!) },
        uThin: { value: new THREE.Vector2(data.thin[0]!, data.thin[1]!) },
        uAlong: { value: new THREE.Vector4(data.along[0]!, data.along[1]!, patternMean(l.blobs[1]!), patternMean(l.sparks[1]!)) },
        uPlasma: { value: new THREE.Vector4(l.floor, l.blobs[0]!, l.blobs[1]!, l.sparks[0]!) },
        uPlasmaMore: { value: new THREE.Vector4(l.fine, l.sparks[1]!, l.level, 0) },
        uFoot: { value: new THREE.Vector4(l.foot[0]!, l.foot[1]!, l.ends, 0) },
        uCool: { value: new THREE.Vector3().fromArray(l.cool) },
        uHot: { value: new THREE.Vector3().fromArray(l.hot) },
        uTone: { value: new THREE.Vector2(l.knee, l.most) },
        uThick: { value: new THREE.Vector2(l.thick, l.cover) },
        uShade: { value: 0 },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = 5
    this.mesh.frustumCulled = false
    // the shade of the strands on what is behind the arcade (see FRAG): the same lines and the same shader, drawn
    // after the haze and before the strands' own light
    this.shadeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { ...this.material.uniforms, uShade: { value: 1 } },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    this.shade = new THREE.Mesh(geometry, this.shadeMaterial)
    this.shade.renderOrder = 4.8
    this.shade.frustumCulled = false
    this.mesh.add(this.shade)

    // the pools at the feet and the haze about the arcade: each a card that faces the eye about the ball's middle (see
    // POOL_FRAG). A pool stands at a foot (shift: so many stage units further out along the axis than the foot).
    // The haze (data.haze) is the thin gas the strands stand in, a row of round balls along the middle arch from
    // foot to foot, each wide enough to run into the next, so the arcade has a faint body of light about it and in
    // the hollow under it. It is under the strands and the pools over them
    type Ball = { mid: THREE.Vector3; out: THREE.Vector3; size: number[]; card: number; level: number }
    const cards = (balls: Ball[], order: number, material: THREE.ShaderMaterial): THREE.Mesh => {
      const at = new Float32Array(balls.length * 4 * 3)
      const upward = new Float32Array(balls.length * 4 * 3)
      const ballOf = new Float32Array(balls.length * 4 * 4)
      const corner = new Float32Array(balls.length * 4 * 2)
      const quads: number[] = []
      balls.forEach((ball, n) => {
        for (let c = 0; c < 4; c++) {
          ball.mid.toArray(at, (n * 4 + c) * 3)
          ball.out.toArray(upward, (n * 4 + c) * 3)
          ballOf.set([ball.size[0]!, ball.size[1]!, ball.card, ball.level], (n * 4 + c) * 4)
          corner.set([c % 2 === 0 ? -1 : 1, c < 2 ? -1 : 1], (n * 4 + c) * 2)
        }
        quads.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4 + 1, n * 4 + 3, n * 4 + 2)
      })
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(at, 3))
      g.setAttribute('aUp', new THREE.BufferAttribute(upward, 3))
      g.setAttribute('aBall', new THREE.BufferAttribute(ballOf, 4))
      g.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2))
      g.setIndex(quads)
      const mesh = new THREE.Mesh(g, material)
      mesh.renderOrder = order
      mesh.frustumCulled = false
      return mesh
    }
    const atFoot = (pool: { foot: number; size: number[]; lift: number; card: number; level: number; shift: number }): Ball => {
      const base = (pool.foot === 0 ? footA : footB).clone().addScaledVector(axis, (pool.foot === 0 ? -1 : 1) * pool.shift)
      const out = base.clone().sub(stage.centre).normalize()
      return { mid: onBall(base).addScaledVector(out, pool.lift), out, size: pool.size, card: pool.card, level: pool.level }
    }
    const pools: Ball[] = data.pools.map(atFoot)
    const lights: Ball[] = data.lit.map(atFoot)
    const hz = data.haze
    const haze: Ball[] = []
    const middle = footA.clone().add(footB).multiplyScalar(0.5)
    const outward = middle.clone().sub(stage.centre).normalize()
    const span = footA.distanceTo(footB)
    for (let k = 0; k < hz.count; k++) {
      const th = (Math.PI * (k + 0.5)) / hz.count
      const w = Math.sin(th)
      const mid = middle.clone().addScaledVector(axis, -Math.cos(th) * 0.5 * span + hz.skew * hz.height * w * w).addScaledVector(outward, hz.height * w)
      haze.push({ mid, out: outward, size: [hz.size, hz.size], card: hz.card, level: hz.level })
    }
    const mu = this.material.uniforms
    this.poolMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: POOL_VERT,
      fragmentShader: POOL_FRAG,
      uniforms: {
        uDiag: diagUniform, uCam: mu.uCam!, uGain: mu.uGain!, uVignette: mu.uVignette!, uAspect: mu.uAspect!, uKeep: this.keep,
        uGround: { value: new THREE.Vector4(stage.centre.x, stage.centre.y, stage.centre.z, stage.radius - s.sink) },
        uCool: mu.uCool!, uHot: mu.uHot!, uPool: { value: new THREE.Vector3(l.pool[0]!, l.pool[1]!, l.pool[2]!) }, uThick: mu.uThick!,
        uLit: { value: 0 },
      },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    // the light of the pools on what is behind them (data.lit): the same balls and the same shader, laid on the
    // picture so that what is there grows brighter by the ball's share (what is there times the share, added to it)
    this.litMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: POOL_VERT,
      fragmentShader: POOL_FRAG,
      uniforms: { ...this.poolMaterial.uniforms, uLit: { value: 1 } },
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.DstColorFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    // over the strands: the pool is the gas they stand in, and the look passes through it before it comes to them, so
    // the lowest part of a leg stands inside the pool's light and the strands come out of it above
    this.lit = cards(lights, 5.4, this.litMaterial)
    this.mesh.add(this.lit)
    this.pool = cards(pools, 5.5, this.poolMaterial)
    this.mesh.add(this.pool)
    this.haze = cards(haze, 4.5, this.poolMaterial)
    this.mesh.add(this.haze)
  }

  /** What the arcade throws on the ground under its feet: a steady share, no event in it. */
  get ground(): number {
    return data.ground.beat
  }

  /** time: the stop's clock in seconds (it only carries the plasma along the lines). eye: the eye in the stage's
   *  frame. keep: the share of the picture the stop holds (1 while the stop is the picture). */
  update(time: number, eye: THREE.Vector3, keep: number, gain: number, vignette: number, aspect: number, ball = false): void {
    const u = this.material.uniforms
    this.time.value = time
    this.keep.value = keep
    this.ball.value.set(stage.centre.x, stage.centre.y, stage.centre.z, ball ? stage.radius - data.leave.under : 0)
    ;(u.uCam!.value as THREE.Vector3).copy(eye)
    u.uGain!.value = gain
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
    this.mesh.visible = keep > 0
  }

  /** Where the stage stands in the body's own frame at spin 0 (origin the ball's centre, unit its radius), and the
   *  film's time at which the stop's clock starts. Told once by the set. */
  body(quaternion: THREE.Quaternion, at: THREE.Vector3, scale: number, start: number): void {
    this.seatQuat.copy(quaternion)
    this.seatAt.copy(at)
    this.seatScale = scale
    this.start = start
  }

  /** The mesh's own seat under whoever holds it: in the body's frame at spin 0 (under the far Sun's group, which
   *  stands at the ball's centre and turns with it), or none (under the stop's own group, which seats it itself). */
  seat(onBody: boolean): void {
    if (onBody) {
      this.mesh.quaternion.copy(this.seatQuat)
      this.mesh.position.copy(this.seatAt)
      this.mesh.scale.setScalar(this.seatScale)
    } else {
      this.mesh.quaternion.identity()
      this.mesh.position.set(0, 0, 0)
      this.mesh.scale.setScalar(1)
    }
  }

  /** Drawn by the far Sun (MAIL 1070 point 2, FarSunHold gas.arcade): the mesh hangs in the far Sun's group in the
   *  body's frame. The eye is read from the camera through the mesh's world matrix, the leaving by size is applied
   *  here, the light is the arcade's own times `wear` (the weight the far Sun gives all it wears of the stop), and a
   *  strand behind the ball gives no light (that pass draws no depth). time: the film's time in seconds. */
  draw(view: { time: number; camera: THREE.PerspectiveCamera; gain: number; vignette: number; aspect: number; height: number; wear: number }): void {
    // whoever draws it here holds it on the body: the seat is taken here, so a holder that draws after the stop's own
    // update has put the mesh back into the stop's group (the sky's pass of the travel out) finds it seated
    this.seat(true)
    setFormat()
    // the holder's world matrix is taken as the holder left it (no parent is updated from here)
    this.mesh.updateMatrix()
    if (this.mesh.parent) this.mesh.matrixWorld.multiplyMatrices(this.mesh.parent.matrixWorld, this.mesh.matrix)
    else this.mesh.matrixWorld.copy(this.mesh.matrix)
    const eye = view.camera.getWorldPosition(this.eye).applyMatrix4(this.back.copy(this.mesh.matrixWorld).invert())
    this.update(view.time - this.start, eye, view.wear * this.sized(eye, view.camera.fov), view.gain, view.vignette, view.aspect, true)
  }

  /** The share left by the arcade's own size: its height in pixels of a frame of leave.lines rows as the eye (in the
   *  stage's frame) sees it under the field given; gone under leave.px[0], whole from leave.px[1], even steps in the
   *  logarithm between them and no slope at either end. */
  sized(eye: THREE.Vector3, vfovDeg: number): number {
    const px = this.tall / Math.max(eye.distanceTo(this.place), 1e-6) * this.leave.lines / (2 * Math.tan(THREE.MathUtils.degToRad(vfovDeg) / 2))
    return THREE.MathUtils.smoothstep(Math.log(Math.max(px, 1e-6)), Math.log(this.leave.px[0]!), Math.log(this.leave.px[1]!))
  }

  dispose(): void {
    this.mesh.removeFromParent()
    this.mesh.geometry.dispose()
    this.material.dispose()
    this.pool.geometry.dispose()
    this.haze.geometry.dispose()
    this.lit.geometry.dispose()
    this.poolMaterial.dispose()
    this.litMaterial.dispose()
    this.shadeMaterial.dispose()
  }
}
