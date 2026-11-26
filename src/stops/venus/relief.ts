import * as THREE from 'three'
import type { RenderView, SetContext } from '../../core/types'
import { DIAG_GLSL, diagUniform, gradUniform } from '../../diagnostics/diag'
import { INVERSE_FILMIC_GLSL } from '../../post/chain'

export interface CloudLayerDef {
  color: string
  alpha?: string
  dist: string
  box: [number, number, number, number]
  distSize: [number, number]
  tint: [number, number, number]
  edge?: [number, number]
  under?: boolean
}

export interface CloudReliefDef {
  imageSize: [number, number]
  // The full set's texels a texel of this set (1 in the full set): a mip level named for the full set's picture is read this many
  // levels lower in log2 (plates.json, texelsNote).
  perFull: number
  vfovDeg: number
  up: [number, number, number]
  radius: number
  sun: [number, number]
  layers: CloudLayerDef[]
  masks: string
  maskBox: [number, number, number, number]
  air: string
  // The air picture in two parts for the globe side (assets-src/venus/place/airsun.py): the Sun's own light and the rest.
  airSun: { file: string; limbFile: string; atDeg: [number, number]; boxDeg: [number, number, number]; exactCoreDeg: [number, number]; exactUnderDeg: number }
}

export interface CloudMotion {
  cell: number
  hazeDir: [number, number]
  hazeSpeed: number; flowSeconds: number
  swayRad: number
  swayPerSecond: number
  edgeDeg: number
  air: { azDeg: number; elevDeg: number; power: number; below: [number, number, number]; belowDeg: number; holdDeg: number; sunHideDeg: [number, number, number]; cut: [number, number, number]; gain: number; deck: [number, number, number][]; deckSpanDeg: number; deckHigh: [number, number]; rimDeg: number }
}

const AIR_VERT = /* glsl */ `
uniform vec3 uUp;
uniform float uRadius;
out vec3 vDir;
out vec3 vClip;
out vec3 vUp;
out vec3 vWorld;
out float vDip;
out float vHigh;
void main() {
  vDir = position;
  vWorld = mat3(modelMatrix) * position;
  vec3 eye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz + uUp * (uRadius + 1.0);
  float r = max(length(eye), uRadius + 0.02);
  vUp = eye / r;
  vDip = acos(uRadius / r);
  vHigh = r - uRadius - 1.0;
  gl_Position = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
  vClip = gl_Position.xyw;
  gl_Position.z = gl_Position.w * 0.9999;
}`

const AIR_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uAir;
uniform vec3 uUp;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uSpan;
uniform vec4 uBelow;
uniform float uHold;
uniform vec3 uSun;
uniform vec3 uSunHide;
uniform vec3 uCut;
uniform float uGain;
uniform float uThrough;
uniform vec3 uDeck[10];
uniform vec3 uDeckFit;
uniform float uVignette;
uniform float uAspect;
uniform int uDiag;
in vec3 vDir;
in vec3 vClip;
in vec3 vUp;
in vec3 vWorld;
in float vDip;
in float vHigh;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
void main() {
  vec3 d = normalize(vDir);
  vec3 up = normalize(vUp);
  float s = clamp(dot(d, up), -1.0, 1.0);
  float elev = asin(s) + vDip;
  vec3 level = d - up * s;
  float az = atan(dot(level, uRight), dot(level, uFwd));
  vec2 uv = vec2(clamp(az / uSpan.x * 0.5 + 0.5, 0.0, 1.0), pow(clamp(elev / uSpan.y, 0.0, 1.0), uSpan.z));
  vec3 glow = inverseFilmic(textureLod(uAir, uv, 0.0).rgb);
  float cut = uCut.z * smoothstep(uCut.x, uCut.y, dot(glow, vec3(0.3, 0.5, 0.2)));
  float off = acos(clamp(dot(normalize(vWorld), uSun), -1.0, 1.0));
  cut = max(cut, 1.0 - smoothstep(uSunHide.x, uSunHide.y, off));
  cut = max(cut, (1.0 - uThrough) * (1.0 - smoothstep(uSunHide.y, uSunHide.z, off)));
  cut = mix(cut, 1.0, smoothstep(0.0, -0.003, elev));
  glow *= pow(vec3(uThrough), vec3(1.0, 1.5, 2.4));
  float far = smoothstep(uDeckFit.y, uDeckFit.z, vHigh) * smoothstep(0.0004, -0.0004, elev);
  for (int k = 0; k < (far > 0.0 ? 1 : 0); k++) {
    float at = (1.0 - abs(mod(az / uDeckFit.x * 0.5 + 0.5, 2.0) - 1.0)) * 9.0;
    int i = int(min(floor(at), 8.0));
    glow = mix(glow, inverseFilmic(mix(uDeck[i], uDeck[i + 1], at - float(i))), far);
  }
  glow = mix(glow, uBelow.rgb, smoothstep(-uHold, -uHold - uBelow.w, elev));
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  outColor = vec4(glow * uGain * vig, cut);
  if (uDiag >= 2) discard;
}`

// The same air on the globe side (the handover): the dome hangs in the globe's scene at the globe's scale, so the eye
// is given (the globe camera brought into this scene by the similarity of the plan) and not read from the camera.
// The air picture comes in two parts there. The rest of it (uAir) is laid from the limb upward as on the close side and
// has its weight by place (airField, below): the place is the ground point of the line of sight, or the limb point under it where it passes over the limb. The Sun's own light (uSunMap) is laid from the limb as it
// stands at T (uUpT, uDipT): the Sun is at infinity and keeps its direction while the limb sinks under a climbing
// camera. It comes in with uSunWeight, and with it the engine's Sun is hidden as on the close side. The two parts are a
// smooth split (airsun.py) and their sum is not the air picture just over the limb beside the Sun, where the Sun's part
// holds the halo made whole. So near T both parts are taken exactly (uExact, by the height of the camera). Away from the
// Sun the rest is the whole air picture (uWhole) less the Sun's part read from the limb as it stands now. In the Sun's
// core (sunCore, a window by the angle from the Sun, uExactCore) both files stand at the top of their range and their
// difference is the rounding of two files, so there nothing is taken as a difference of the two: the rest stays the
// smooth rest, and the Sun's light is the whole air picture read through the limb as it stood at T, less that smooth
// rest at the same place. That is the read the close side makes of its Sun, so the core is one picture read one way on
// both sides. With the same window on both parts the sum at T is the whole air picture at every weight of the window:
// (1 - w)(whole - sun) + w rest + (1 - w) sun + w (whole - rest). At T both weights and uExact are 1 and the sum is the
// close side's dome; above, the smooth split takes over while the Sun leaves the limb. Under the limb as it stood at T
// the air picture holds nothing: there the window closes over uExactUnder and the Sun's file, with its halo made
// whole, stands. The fragment shader is the close side's own with these swaps.
const AIR_VERT_GLOBE = /* glsl */ `
uniform vec3 uEye;
uniform float uRadius;
out vec3 vDir;
out vec3 vClip;
out vec3 vUp;
out vec3 vWorld;
out float vDip;
out float vHigh;
void main() {
  vDir = position;
  vWorld = mat3(modelMatrix) * position;
  float r = max(length(uEye), uRadius + 0.02);
  vUp = uEye / r;
  vDip = acos(uRadius / r);
  vHigh = r - uRadius - 1.0;
  gl_Position = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
  vClip = gl_Position.xyw;
  gl_Position.z = gl_Position.w * 0.9999;
}`

const swapOnce = (text: string, from: string, to: string): string => {
  if (text.split(from).length !== 2) throw new Error('the air shader of the globe side: no single place for ' + from)
  return text.replace(from, to)
}

const GLOBE_SWAPS: [string, string][] = [
  ['uniform float uGain;', 'uniform float uGain;\nuniform float uWeight;\nuniform float uSunWeight;\nuniform sampler2D uSunMap;\nuniform sampler2D uWhole;\nuniform float uExact;\nuniform vec4 uExactCore;\nuniform float uExactUnder;\nuniform vec3 uUpT;\nuniform float uDipT;\nuniform vec4 uSunBox;\nuniform vec2 uBand;\nuniform vec2 uField;\nfloat airField(vec3 d, vec3 up, float dip) {\n  float s = clamp(dot(d, up), -1.0, 1.0);\n  vec3 level = d - up * s;\n  float side = length(level);\n  float rim = cos(dip);\n  float arc = s < 0.0 && side < rim ? asin(side / rim) - acos(-s) : dip;\n  vec3 q = up * cos(arc) + level * (sin(arc) / max(side, 1e-6));\n  float x = clamp((acos(clamp(dot(q, uUpT), -1.0, 1.0)) - uField.x) / (uField.y - uField.x), 0.0, 1.0);\n  return 1.0 - x * x * x * (x * (x * 6.0 - 15.0) + 10.0);\n}\nfloat sunCore(vec2 at) {\n  vec2 off = vec2((at.x - uExactCore.x) * cos(uExactCore.y), at.y - uExactCore.y);\n  return (1.0 - smoothstep(uExactCore.z, uExactCore.w, length(off))) * smoothstep(-uExactUnder, 0.0, at.y);\n}'],
  [
    '  vec3 glow = inverseFilmic(textureLod(uAir, uv, 0.0).rgb);',
    `  vec3 glow = inverseFilmic(textureLod(uAir, uv, 0.0).rgb);
  float sT = clamp(dot(d, uUpT), -1.0, 1.0);
  vec3 levelT = d - uUpT * sT;
  vec2 atT = vec2(atan(dot(levelT, uRight), dot(levelT, uFwd)), asin(sT) + uDipT);
  vec2 uvT = vec2(clamp(atT.x / uSpan.x * 0.5 + 0.5, 0.0, 1.0), pow(clamp(atT.y / uSpan.y, 0.0, 1.0), uSpan.z));
  vec3 sunGlow = inverseFilmic(textureLod(uSunMap, clamp((atT - uSunBox.xy) / uSunBox.zw, 0.0, 1.0), 0.0).rgb);
  vec3 sunHeld = inverseFilmic(textureLod(uSunMap, clamp((vec2(az, elev) - uSunBox.xy) / uSunBox.zw, 0.0, 1.0), 0.0).rgb);
  vec3 whole = inverseFilmic(textureLod(uWhole, uv, 0.0).rgb);
  vec3 wholeT = inverseFilmic(textureLod(uWhole, uvT, 0.0).rgb);
  vec3 restT = inverseFilmic(textureLod(uAir, uvT, 0.0).rgb);
  glow = mix(glow, mix(whole - sunHeld, glow, sunCore(vec2(az, elev))), uExact);
  sunGlow = mix(sunGlow, mix(sunGlow, wholeT - restT, sunCore(atT)), uExact);`,
  ],
  ['  vec3 up = normalize(vUp);', '  vec3 up = normalize(vUp);\n  float weight = uWeight * airField(d, up, vDip);'],
  ['dot(glow, vec3(0.3, 0.5, 0.2))', 'dot(glow * weight + sunGlow * uSunWeight, vec3(0.3, 0.5, 0.2))'],
  ['cut = max(cut, 1.0 - smoothstep(uSunHide.x, uSunHide.y, off));', 'cut = max(cut, (1.0 - smoothstep(uSunHide.x, uSunHide.y, off)) * uSunWeight);'],
  ['cut = mix(cut, 1.0, smoothstep(0.0, -0.003, elev));', 'cut = mix(cut, 1.0, smoothstep(0.0, -0.003, elev) * weight);'],
  ['outColor = vec4(glow * uGain * vig, cut);', 'outColor = vec4(max(glow * weight + sunGlow * uSunWeight, 0.0) * uGain * vig, cut) * (1.0 - smoothstep(uBand.x, uBand.y, -elev));'],
]
const AIR_FRAG_GLOBE = GLOBE_SWAPS.reduce((text, [from, to]) => swapOnce(text, from, to), AIR_FRAG)

const VERT = /* glsl */ `
in vec2 aImage;
uniform vec3 uUp;
uniform vec4 uRim;
out vec2 vImage;
out vec2 vUv;
out vec3 vView;
out vec3 vClip;
out float vRim;
void main() {
  vec3 eye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz + uUp * (uRim.x + 1.0);
  vRim = uRim.w * smoothstep(uRim.y, uRim.z, length(eye) - uRim.x - 1.0);
  vImage = aImage;
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
  vClip = gl_Position.xyw;
}`

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uAlpha;
uniform sampler2D uMasks;
uniform float uHasAlpha;
uniform vec2 uSize;
uniform vec4 uMaskBox;
uniform vec2 uToLayer;
uniform vec2 uEdge;
uniform vec2 uHaze;
uniform vec4 uSway;
uniform vec4 uLens;
uniform vec3 uUp;
uniform float uGain;
uniform float uVignette;
uniform float uAspect;
uniform vec3 uLayer;
uniform float uGrad;
in vec2 vImage;
in vec2 vUv;
in vec3 vView;
in vec3 vClip;
in float vRim;
out vec4 outColor;
${INVERSE_FILMIC_GLSL}
${DIAG_GLSL}
void main() {
  vec2 mq = (vImage - uMaskBox.xy) / uMaskBox.zw;
  vec3 m = texture(uMasks, vec2(mq.x, 1.0 - mq.y)).rgb;
  vec2 arm = (vImage - uSway.xy) * vec2(uSway.z, 1.0);
  vec2 shift = uHaze * m.r + vec2(-arm.y / uSway.z, arm.x) * uSway.w * m.g;
  vec2 uv = vUv - vec2(shift.x, -shift.y) * uToLayer;
  vec4 texel = textureGrad(uColor, uv, dFdx(vUv) * uGrad, dFdy(vUv) * uGrad);
  float alpha = texture(uAlpha, vUv).r;
  if (uHasAlpha < 0.5) {
    vec3 ray = normalize(vec3((2.0 * vImage.x - 1.0) * uLens.x, (1.0 - 2.0 * vImage.y) * uLens.y, -1.0));
    alpha = smoothstep(0.0, -uLens.w - vRim, asin(clamp(dot(ray, uUp), -1.0, 1.0)) + uLens.z);
  }
  alpha *= smoothstep(0.0, uEdge.x, vUv.x) * smoothstep(0.0, uEdge.y, 1.0 - vUv.x);
  float texels = diagTexels(uv * uSize);
  vec2 q = vClip.xy / vClip.z * 0.5 * vec2(uAspect, 1.0);
  float vig = 1.0 / mix(1.0, 1.0 / pow(1.0 + dot(q, q) * 0.9, 2.0), uVignette);
  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;
  outColor = diagOut(vec4(col * alpha, alpha), texels, 1.0, uLayer, shift * 60.0, length(vView));
  if (alpha < 0.004 || (uDiag >= 2 && alpha < 0.5)) discard;
}`

// The same ground on the globe side (plan F: one scene through the change of view). The meshes of the close side hang in the globe's
// scene at the globe's scale, by the similarity of the plan, so from the camera of the handover they are the close side's picture, point for
// point, and from any other eye they are the same towers seen from there. Swaps against the close side's own shaders: the eye is given
// (as for the dome); the weight (by the height of the camera, set.ts) scales the alpha. The picture of the close view lies on these meshes
// as the close view's own camera saw it, so from another eye a part of it is drawn larger than it was seen. The ground is drawn only where
// it is true from this eye, by angle and distance alone, no clock:
// - uTrue, the deck: the smaller scale of the picture of the close view against the frame at this point (frame heights of the close image
//   to a frame height of this view, along the direction in which the picture is stretched most; 1 from the close view's own camera), taken
//   for a face that lies in the deck. Above the deck (uTall, units of the close scene over the deck sphere) the face is taken as turned to
//   the close view's camera, as the flank of a tower is. Under uTrue.y the ground thins out, under uTrue.x it is gone and the plates show.
//   It is worked out from the two eyes and the point, not from the mesh's faces, so it has no step from face to face.
// - uSkin, the skins: the same scale measured on the face itself (the derivatives of the image place across the frame). It takes out the
//   faces that span from the top of a tower to the deck behind it, which the close view saw edge on.
// - uOutline and uMatte, the border: the outline of all layers in the close image (left, right, lower edge) is three planes through the
//   close view's camera. Toward them the ground gives way to the plates over uMatte.x units of the close scene (the distance of the point
//   from the nearest plane, so the border is as wide on the ground at every edge), sooner where the picture is dark and later where it
//   is bright (its own cloud forms at a coarse level of the picture, uMatte.z; uMatte.y is how far the forms move the border, uMatte.w
//   scales the display value), so the border is no straight line. It stands still in space: nothing of it moves by the height of the camera.
// - uAxesT, uLensT, uFrustum.xy, the frame of T: the camera of the handover (its eye uEyeT, its axes, the tangents of half its field) sees
//   the surface view itself, every part of its picture, also near its outline and where another eye sees it larger than it was stored.
//   So inside that frame (inT: 1 inside, fading out over uFrustum.xy half frames outside it, sooner where the picture is dark and later
//   where it is bright, by the share uLet.y, so its edge is no straight line) the ground has no border, and uTrue and uSkin
//   are let go there by the height of the camera (uLet.x, set.ts: 1 above the heights of release, none at T). Outside the frame of T
//   nothing is let go, and the ground near the camera of T (uFrustum.zw) gives way to the plates over a wider margin (to uLet.z half
//   frames outside, by its forms as well) or over the border of the outline, whichever leaves more of it.
// - uKeep, the near ground: where the camera of T sees a point of the ground from above, at a sine of its elevation over uKeep.y, uTrue
//   and uSkin take nothing out, at any height of the camera and on both sides of the frame of T; under uKeep.x they hold as told above.
//   It is the ground that keeps its relief (uFlat), so its crests do not go out by height while the flat plate under it stands.
// - uFrustum.zw, the far ground outside the frame of T: from above the far deck is drawn larger than it was stored, so uTrue would take it
//   out and bring it back as the eye moves. Outside the frame of T it is left to the plates for good: the ground is whole where the camera
//   of T sees a point from above at a sine of elevation over uFrustum.w and gone under uFrustum.z (its forms move the limit by uLet.y).
// The depth is written on its own scale in the near half of the buffer, so the layers hide one another as on the close side and none of
// them is cut by the globe's sphere, which runs through the towers.
// The measures of the close view at a point of its scene (its camera at the origin), for the ground on the globe side.
// closeScale: the smaller scale of the picture of the close view against the frame at the point p, for a face with the normal face seen
// from eye: frame heights of the close image a frame height of the frame, so it does not depend on the size of the frame in pixels.
// lensY is the tangent of half the close view's field, proj the frame's projectionMatrix[1][1].
// closeInside: the distance of p, in units of the close scene, inside the outline of all layers of the close image (left and right edge
// in image widths, lower edge in image heights), which is three planes through the close view's camera. lens: the tangents of half its field.
const CLOSE_GLSL = /* glsl */ `
float closeScale(vec3 p, vec3 eye, vec3 face, float lensY, float proj) {
  float dC = length(p);
  vec3 vC = -p / dC;
  vec3 toE = eye - p;
  float dE = length(toE);
  vec3 vE = toE / dE;
  float cC = max(dot(face, vC), 0.0);
  float cE = dot(face, vE);
  vec3 tC = vC - face * dot(face, vC);
  vec3 tE = vE - face * cE;
  float lC = length(tC);
  float lE = length(tE);
  float cosPhi = lC > 1e-4 && lE > 1e-4 ? dot(tC, tE) / (lC * lE) : 1.0;
  float sin2 = 1.0 - cosPhi * cosPhi;
  float bE = 1.0 / max(cE, 1e-3);
  float tr = cosPhi * cosPhi + sin2 * bE * bE + cC * cC * (sin2 + cosPhi * cosPhi * bE * bE);
  float det = cC * bE;
  return cE > 0.0 ? det / sqrt(max(0.5 * (tr + sqrt(max(tr * tr - 4.0 * det * det, 0.0))), 1e-12)) * dE / (dC * lensY * proj) : 0.0;
}
float closeInside(vec3 p, vec3 outline, vec2 lens) {
  vec3 edge = vec3((2.0 * outline.x - 1.0) * lens.x, (2.0 * outline.y - 1.0) * lens.x, (1.0 - 2.0 * outline.z) * lens.y);
  return min(min((p.x + edge.x * p.z) / sqrt(1.0 + edge.x * edge.x), (-edge.y * p.z - p.x) / sqrt(1.0 + edge.y * edge.y)), (p.y + edge.z * p.z) / sqrt(1.0 + edge.z * edge.z));
}
`
// The far ground lies flat (uFlat): the picture of the close view is true from the camera of T, and the plates under the ground hold that
// same picture laid on the deck along the lines of sight of T (assets-src/venus/place/tlay.py). Where the camera of T sees the deck at a low
// angle the ground gives way to those plates as the eye moves (uTrue), so there its points lie where the plates have them: each vertex
// moves along the line of sight of T through it to where that line meets the deck sphere. From T nothing moves, and what gives way and
// what takes its place are one picture in one place. The share is whole where the sine of the elevation of the camera of T over the point
// of landing is under uFlat.x and none over uFlat.y, so the ground near the camera keeps its relief; toward the horizon of T it goes out
// again (between uFlat.w and uFlat.z), since a line of sight near the horizon lands far behind the tower it passes through.
const VERT_GLOBE = ([
  ['uniform vec3 uUp;', 'uniform vec3 uEye;\nuniform vec3 uUp;\nuniform vec3 uEyeT;\nuniform vec4 uFlat;'],
  ['  vec3 eye = -transpose(mat3(modelViewMatrix)) * modelViewMatrix[3].xyz + uUp * (uRim.x + 1.0);', '  vec3 eye = uEye;'],
  ['out float vRim;', 'out float vRim;\nout vec3 vModel;\nout float vFlat;'],
  ['  vec4 mv = modelViewMatrix * vec4(position, 1.0);', `  vec3 centreT = -uUp * (uRim.x + 1.0);
  vec3 ray = normalize(position - uEyeT - centreT);
  float along = dot(uEyeT, ray);
  float disc = along * along - dot(uEyeT, uEyeT) + uRim.x * uRim.x;
  vec3 moved = position;
  vFlat = 0.0;
  if (disc > 0.0 && along < 0.0) {
    vec3 land = uEyeT + ray * (-along - sqrt(disc));
    float sinT = dot(-ray, normalize(land));
    vFlat = (1.0 - smoothstep(uFlat.x, uFlat.y, sinT)) * smoothstep(uFlat.w, uFlat.z, sinT);
    moved = mix(position, land + centreT, vFlat);
  }
  vModel = moved;
  vec4 mv = modelViewMatrix * vec4(moved, 1.0);`],
] as [string, string][]).reduce((text, [from, to]) => swapOnce(text, from, to), VERT)
const TRUE_GLSL = /* glsl */ `
  vec3 centre = -uUp * (uRim.x + 1.0);
  vec3 radial = vModel - centre;
  float tall = smoothstep(uTall.x, uTall.y, length(radial) - uRim.x);
  vec3 face = normalize(mix(normalize(radial), -normalize(vModel), tall * (1.0 - vFlat)));
  vec3 fromT = vModel - uEyeT - centre;
  vec3 seenT = fromT * uAxesT;
  vec2 frameT = seenT.xy / (max(-seenT.z, 1e-6) * uLensT);
  float form = clamp(dot(textureLod(uColor, vUv, uMatte.z).rgb, vec3(0.3, 0.5, 0.2)) * uMatte.w, 0.0, 1.0);
  float outT = (max(abs(frameT.x), abs(frameT.y)) - 1.0) * (1.0 + uLet.y * (1.0 - 2.0 * form));
  float inT = seenT.z < 0.0 ? 1.0 - smoothstep(uFrustum.x, uFrustum.y, outT) : 0.0;
  float aroundT = seenT.z < 0.0 ? 1.0 - smoothstep(uFrustum.x, uLet.z, outT) : 0.0;
  float keeps = smoothstep(uKeep.x, uKeep.y, dot(-normalize(fromT), normalize(radial)));
  float let = max(mix(1.0, uLet.x, inT) * (1.0 - keeps), 1e-6);
  float deck = smoothstep(uTrue.x * let, uTrue.y * let, closeScale(vModel, uEye + centre, face, uLens.y, projectionMatrix[1][1]));
  vec2 at = vImage * vec2(uSway.z, 1.0);
  float perHeight = 2.0 / max(abs(dFdy(vClip.y / vClip.z)), 1e-9);
  vec2 jx = dFdx(at) * perHeight;
  vec2 jy = dFdy(at) * perHeight;
  float ft = dot(jx, jx) + dot(jy, jy);
  float fd = abs(jx.x * jy.y - jx.y * jy.x);
  float skin = smoothstep(uSkin.x * let, uSkin.y * let, fd / sqrt(max(0.5 * (ft + sqrt(max(ft * ft - 4.0 * fd * fd, 0.0))), 1e-12)));
  float inside = closeInside(vModel, uOutline, uLens.xy);
  float border = smoothstep(0.0, 1.0, inside / max(uMatte.x, 1e-6) * (1.0 + uMatte.y) - uMatte.y * (1.0 - form));
  float near = smoothstep(uFrustum.z, uFrustum.w, dot(-normalize(fromT), normalize(radial)) * (1.0 + uLet.y * (form - 0.5)));
  alpha *= uWeight * deck * skin * max(inT, max(aroundT, border) * near);
  gl_FragDepth = 0.5 * clamp(log(length(vView) / uDepth.x) * uDepth.y, 0.0, 1.0);
`
// The tones of the ground on the globe side, by the law of the plates (globe.ts): the tones of the close view (the far deck pale under
// its haze, the near towers dark against the Sun) belong to the line of sight of T. They show by the share same: the angle between the
// line of sight of this eye and the one of T at the point (uToneLook.zw, to the power uToneLive.x), the height of the camera
// (uToneLook.y, set.ts) and the air on the line of sight (the sines of the two elevations over the deck, to the power uToneLook.x).
// Seen from elsewhere the ground gives its forms alone over the globe's colour at the place (uToneUnder.rgb, scene light, plates.json):
// its light over its own light at a coarse level of the picture of the close view (uBroad at the level uToneLive.y, taken at the place
// in the image, uBroadBox), the luminance to the power uToneLive.w within 1 / uToneLive.z and uToneLive.z, the colour to the power
// uToneUnder.w. At T the share is 1 and the ground is the close side's.
const TONE_GLSL = /* glsl */ `
  vec3 toT = normalize(uEyeT + centre - vModel);
  vec3 toEye = normalize(uEye + centre - vModel);
  vec3 out3 = normalize(radial);
  float sT = max(dot(toT, out3), 0.02);
  float sE = max(dot(toEye, out3), 0.02);
  float same = pow(clamp((dot(toEye, toT) - uToneLook.z) / (uToneLook.w - uToneLook.z), 0.0, 1.0), uToneLive.x) * uToneLook.y * pow(clamp(sT / sE, 0.0, 1.0), uToneLook.x);
  for (int t = 0; t < (same < 1.0 ? 1 : 0); t++) {
    vec2 bq = (vImage - uBroadBox.xy) / uBroadBox.zw;
    vec3 own = inverseFilmic(texel.rgb);
    vec3 low = inverseFilmic(textureLod(uBroad, vec2(bq.x, 1.0 - bq.y), uToneLive.y).rgb);
    float lowLum = max(dot(low, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
    float ownLum = max(dot(own, vec3(0.2126, 0.7152, 0.0722)), 1e-5);
    vec3 hue = clamp((own / ownLum) / max(low / lowLum, vec3(1e-3)), vec3(0.25), vec3(4.0));
    col = mix(uToneUnder.rgb * pow(clamp(ownLum / lowLum, 1.0 / uToneLive.z, uToneLive.z), uToneLive.w) * pow(hue, vec3(uToneUnder.w)) * uGain * vig, col, same);
  }
`
const FRAG_GLOBE = ([
  ['uniform float uGain;', 'uniform float uGain;\nuniform float uWeight;\nuniform vec2 uDepth;\nuniform vec2 uTrue;\nuniform vec2 uSkin;\nuniform vec2 uTall;\nuniform vec3 uOutline;\nuniform vec4 uMatte;\nuniform vec3 uEye;\nuniform vec3 uEyeT;\nuniform mat3 uAxesT;\nuniform vec2 uLensT;\nuniform vec4 uFrustum;\nuniform vec3 uLet;\nuniform vec2 uKeep;\nuniform vec4 uToneLook;\nuniform vec4 uToneLive;\nuniform vec4 uToneUnder;\nuniform sampler2D uBroad;\nuniform vec4 uBroadBox;\nuniform vec4 uRim;\nuniform mat4 projectionMatrix;' + CLOSE_GLSL],
  ['in float vRim;', 'in float vRim;\nin vec3 vModel;\nin float vFlat;'],
  ['  float texels = diagTexels(uv * uSize);', TRUE_GLSL + '  float texels = diagTexels(uv * uSize);'],
  ['  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;', '  vec3 col = inverseFilmic(texel.rgb) * uGain * vig;' + TONE_GLSL],
] as [string, string][]).reduce((text, [from, to]) => swapOnce(text, from, to), FRAG)

interface Layer { mesh: THREE.Mesh; material: THREE.ShaderMaterial }

// A mesh drawn dry: its program is linked and its buffers are made, and no pixel is touched (a scissor of no size, set and taken back
// around the one draw). What a dive, a surface view or a rise shows first is drawn dry from the first frame of the hold on, so no picture
// of a move has anything left to make (plan H): mesh.userData.dry says when.
const NO_BOX = new THREE.Vector4(0, 0, 0, 0)
function dryable(mesh: THREE.Mesh): void {
  const box = new THREE.Vector4()
  let test = false
  mesh.onBeforeRender = (renderer) => {
    if (mesh.userData.dry !== true) return
    const gl = renderer.getContext()
    const was = gl.getParameter(gl.SCISSOR_BOX) as Int32Array
    box.set(was[0]!, was[1]!, was[2]!, was[3]!)
    test = gl.isEnabled(gl.SCISSOR_TEST)
    renderer.state.scissor(NO_BOX)
    renderer.state.setScissorTest(true)
  }
  mesh.onAfterRender = (renderer) => {
    if (mesh.userData.dry !== true) return
    renderer.state.scissor(box)
    renderer.state.setScissorTest(test)
  }
}

const rad = THREE.MathUtils.degToRad

// The distances, in units of the close scene, between which the ground of the globe side writes its depth (in the logarithm).
const GLOBE_DEPTH: [number, number] = [0.02, 4000]

// The ground on the globe side as set.ts asks for it. weight: its share (by the height of the camera). under: the share of the air under
// the horizon (by the height of the camera too, on heights of its own: it is the air as the close view sees it from the deck). band: the
// angles under the horizon (radians) between which that air gives way to the plates; the far deck fades into that air, the ground nearer
// by covers it. true, skin, tall, matte: where the ground is true from the eye and how its border gives way (uTrue, uSkin, uTall, uMatte above).
// held: the share of true and skin that holds inside the frame of T at this height (uLet.x). atT: the axes of the camera of T in the close
// scene and the tangent of half its field. frustum: the margin of that frame (uFrustum.xy) and the wider one of the near ground (uLet.z). near: the far limit outside it and the share of
// the forms (uFrustum.zw, uLet.y). flat: where the ground lies flat on the deck (uFlat). keep: the near ground that true and skin leave whole (uKeep).
export interface GroundShare { weight: number; under: number; band: [number, number]; true: [number, number]; skin: [number, number]; tall: [number, number]; held: number; keep: [number, number]; atT: { axes: THREE.Matrix3; tan: number }; frustum: [number, number, number]; near: [number, number, number]; flat: [number, number, number, number]; matte: [number, number, number, number]; tone: { look: [number, number, number, number]; power: number; broad: number; most: number; contrast: number; under: [number, number, number]; colour: number } }

const BLEND = {
  transparent: true,
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor,
  blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
} as const

export class CloudRelief {
  readonly group = new THREE.Group()
  private readonly layers: Layer[] = []
  private air: Layer | null = null
  private globeAir: Layer | null = null
  private globeUnder: Layer | null = null
  private readonly globeLayers: Layer[] = []
  // The width of the coarse picture of each layer of the globe side's ground, in its texels an image width of the close view.
  private readonly broadPx: number[] = []
  // The ground and the air under the horizon on the globe side: to be added to the globe's group.
  readonly globeGround = new THREE.Group()
  private readonly motion: CloudMotion
  private radius = 1
  // Mip levels this set lies under the full set (log2 of the full set's texels a texel of this set), for levels named for the full set.
  private levelsUnderFull = 0
  carry: { map: THREE.Texture; fwd: THREE.Vector3; right: THREE.Vector3; span: THREE.Vector3; cut: THREE.Vector3; gain: number } | null = null
  // The colours of the far deck by azimuth and the frame they are laid in (this scene's axes), for the haze of the globe side.
  deck: { colours: THREE.Vector3[]; fwd: THREE.Vector3; right: THREE.Vector3 } | null = null

  private constructor(motion: CloudMotion) {
    this.motion = motion
  }

  static async load(ctx: SetContext, base: string, def: CloudReliefDef, motion: CloudMotion): Promise<CloudRelief> {
    const r = new CloudRelief(motion)
    r.radius = def.radius
    if (!(def.perFull >= 1)) throw new Error('the ground needs the full set at least as wide as this set')
    r.levelsUnderFull = Math.log2(def.perFull)
    const [W, H] = def.imageSize
    const th = Math.tan(rad(def.vfovDeg) / 2)
    const aspect = W / H
    const up = new THREE.Vector3().fromArray(def.up).normalize()
    const fwd = new THREE.Vector3(0, 0, -1).addScaledVector(up, up.z).normalize()
    const right = new THREE.Vector3().crossVectors(fwd, up).normalize()
    const dip = Math.acos(def.radius / (def.radius + 1))
    const masks = await ctx.texture(base + def.masks, { srgb: false, mips: false })
    const a = motion.air
    const airMap = await ctx.texture(base + def.air, { srgb: true, mips: false })
    const airMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: AIR_VERT,
      fragmentShader: AIR_FRAG,
      uniforms: {
        uAir: { value: airMap }, uUp: { value: up }, uFwd: { value: fwd }, uRight: { value: right }, uRadius: { value: def.radius },
        uSpan: { value: new THREE.Vector3(rad(a.azDeg), rad(a.elevDeg), a.power) }, uBelow: { value: new THREE.Vector4(a.below[0], a.below[1], a.below[2], rad(a.belowDeg)) }, uHold: { value: rad(a.holdDeg) }, uSun: { value: new THREE.Vector3(0, 0, 1) }, uSunHide: { value: new THREE.Vector3(rad(a.sunHideDeg[0]), rad(a.sunHideDeg[1]), rad(a.sunHideDeg[2])) },
        uCut: { value: new THREE.Vector3().fromArray(a.cut) }, uGain: { value: 1 }, uThrough: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uDiag: diagUniform,
        uDeck: { value: a.deck.map((c) => new THREE.Vector3(Math.pow(c[0] / 255, 2.2), Math.pow(c[1] / 255, 2.2), Math.pow(c[2] / 255, 2.2))) }, uDeckFit: { value: new THREE.Vector3(rad(a.deckSpanDeg), a.deckHigh[0], a.deckHigh[1]) },
      },
      ...BLEND,
      side: THREE.BackSide,
      depthTest: false,
      depthWrite: false,
    })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), airMaterial)
    dome.frustumCulled = false
    dome.renderOrder = -1
    dryable(dome)
    r.group.add(dome)
    r.air = { mesh: dome, material: airMaterial }
    const globeUniforms: Record<string, THREE.IUniform> = {}
    for (const [name, u] of Object.entries(airMaterial.uniforms)) globeUniforms[name] = name === 'uDiag' ? u : { value: u.value }
    globeUniforms.uSun = { value: new THREE.Vector3(0, 0, 1) }
    globeUniforms.uEye = { value: up.clone().multiplyScalar(def.radius + 1) }
    globeUniforms.uWeight = { value: 0 }
    globeUniforms.uSunWeight = { value: 0 }
    globeUniforms.uBand = { value: new THREE.Vector2(1e3, 2e3) }
    globeUniforms.uField = { value: new THREE.Vector2(1e3, 2e3) }
    const sb = def.airSun
    globeUniforms.uAir = { value: await ctx.texture(base + sb.limbFile, { srgb: true, mips: false }) }
    globeUniforms.uSunMap = { value: await ctx.texture(base + sb.file, { srgb: true, mips: false }) }
    globeUniforms.uWhole = { value: airMap }
    globeUniforms.uExact = { value: 0 }
    globeUniforms.uExactCore = { value: new THREE.Vector4(rad(sb.atDeg[0]), rad(sb.atDeg[1]), rad(sb.exactCoreDeg[0]), rad(sb.exactCoreDeg[1])) }
    globeUniforms.uExactUnder = { value: rad(sb.exactUnderDeg) }
    globeUniforms.uUpT = { value: up.clone() }
    globeUniforms.uDipT = { value: dip }
    globeUniforms.uSunBox = { value: new THREE.Vector4(rad(sb.atDeg[0] - sb.boxDeg[0]), rad(sb.atDeg[1] - sb.boxDeg[1]), rad(2 * sb.boxDeg[0]), rad(sb.boxDeg[1] + sb.boxDeg[2])) }
    const globeMaterial = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: AIR_VERT_GLOBE, fragmentShader: AIR_FRAG_GLOBE, uniforms: globeUniforms, ...BLEND, side: THREE.BackSide, depthTest: true, depthWrite: false })
    const globeDome = new THREE.Mesh(dome.geometry, globeMaterial)
    globeDome.frustumCulled = false
    globeDome.renderOrder = 5
    globeDome.visible = false
    dryable(globeDome)
    r.globeAir = { mesh: globeDome, material: globeMaterial }
    // The same dome where the globe stands in front of it: on the close side the dome is the ground of the picture under the horizon too, and
    // the far deck fades into it. It is drawn where the globe has written its depth, the dome above only where it has not.
    // Under the horizon the close side reads the lowest row of the whole air picture, so this dome reads the whole picture too and takes
    // nothing from the Sun's own picture.
    const underUniforms: Record<string, THREE.IUniform> = { ...globeUniforms, uAir: { value: airMap }, uWeight: { value: 0 }, uSunWeight: { value: 0 }, uExact: { value: 0 }, uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uThrough: { value: 1 }, uBand: { value: new THREE.Vector2(1e3, 2e3) }, uField: { value: new THREE.Vector2(1e3, 2e3) } }
    const underMaterial = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: AIR_VERT_GLOBE, fragmentShader: AIR_FRAG_GLOBE, uniforms: underUniforms, ...BLEND, side: THREE.BackSide, depthTest: true, depthFunc: THREE.GreaterDepth, depthWrite: false })
    const underDome = new THREE.Mesh(dome.geometry, underMaterial)
    underDome.frustumCulled = false
    underDome.renderOrder = 6
    underDome.visible = false
    dryable(underDome)
    r.globeUnder = { mesh: underDome, material: underMaterial }
    r.globeGround.add(underDome)
    r.deck = { colours: airMaterial.uniforms.uDeck!.value as THREE.Vector3[], fwd, right }
    r.carry = { map: airMap, fwd, right, span: airMaterial.uniforms.uSpan!.value as THREE.Vector3, cut: airMaterial.uniforms.uCut!.value as THREE.Vector3, gain: a.gain }

    // The outline of all layers in the close image: left and right edge in image widths, lower edge in image heights.
    const outline = new THREE.Vector3(Math.min(...def.layers.map((l) => l.box[0])) / W, Math.max(...def.layers.map((l) => l.box[0] + l.box[2])) / W, Math.max(...def.layers.map((l) => l.box[1] + l.box[3])) / H)
    const colours: THREE.Texture[] = []
    for (let k = 0; k < def.layers.length; k++) {
      const l = def.layers[k]!
      const color = await ctx.texture(base + l.color, { srgb: true, anisotropy: 8 })
      colours.push(color)
      const alpha = l.alpha ? await ctx.texture(base + l.alpha, { srgb: false, anisotropy: 4 }) : null
      const dist = new Float32Array(await ctx.buffer(base + l.dist))
      const [dw, dh] = l.distSize
      if (dist.length !== dw * dh) throw new Error('relief distance size mismatch: ' + l.dist)
      const [x0, y0, bw, bh] = l.box
      const cell = motion.cell * W / 5632
      const nx = Math.max(2, Math.round(bw / cell))
      const ny = Math.max(2, Math.round(bh / cell))
      const cols = nx + 1
      const rows = ny + 1
      const position = new Float32Array(cols * rows * 3)
      const uv = new Float32Array(cols * rows * 2)
      const image = new Float32Array(cols * rows * 2)
      const sample = (x: number, y: number): number => {
        const px = Math.min(Math.max(x - 0.5, 0), dw - 1)
        const py = Math.min(Math.max(y - 0.5, 0), dh - 1)
        const ix = Math.min(Math.floor(px), dw - 2)
        const iy = Math.min(Math.floor(py), dh - 2)
        const tx = px - ix
        const ty = py - iy
        return (dist[iy * dw + ix]! * (1 - tx) + dist[iy * dw + ix + 1]! * tx) * (1 - ty) + (dist[(iy + 1) * dw + ix]! * (1 - tx) + dist[(iy + 1) * dw + ix + 1]! * tx) * ty
      }
      let n = 0
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const fx = i / nx
          const fy = j / ny
          const ix = (x0 + fx * bw) / W
          const iy = (y0 + fy * bh) / H
          const dir = new THREE.Vector3((2 * ix - 1) * th * aspect, (1 - 2 * iy) * th, -1).normalize()
          const dd = sample(fx * dw, fy * dh)
          position[n * 3] = dir.x * dd
          position[n * 3 + 1] = dir.y * dd
          position[n * 3 + 2] = dir.z * dd
          uv[n * 2] = fx
          uv[n * 2 + 1] = 1 - fy
          image[n * 2] = ix
          image[n * 2 + 1] = iy
          n++
        }
      }
      const index = new Uint32Array(nx * ny * 6)
      let m = 0
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const p = j * cols + i
          index[m++] = p; index[m++] = p + cols; index[m++] = p + 1
          index[m++] = p + 1; index[m++] = p + cols; index[m++] = p + cols + 1
        }
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      geo.setAttribute('aImage', new THREE.BufferAttribute(image, 2))
      geo.setIndex(new THREE.BufferAttribute(index, 1))
      const size = color.image as unknown as { width: number; height: number }
      const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uColor: { value: color }, uAlpha: { value: alpha ?? masks }, uMasks: { value: masks }, uHasAlpha: { value: alpha ? 1 : 0 },
          uSize: { value: new THREE.Vector2(size.width, size.height) }, uMaskBox: { value: new THREE.Vector4(def.maskBox[0] / W, def.maskBox[1] / H, def.maskBox[2] / W, def.maskBox[3] / H) }, uToLayer: { value: new THREE.Vector2(W / bw, H / bh) }, uEdge: { value: new THREE.Vector2(Math.max(l.edge?.[0] ?? 0, 1e-6), Math.max(l.edge?.[1] ?? 0, 1e-6)) },
          uHaze: { value: new THREE.Vector2() }, uSway: { value: new THREE.Vector4(def.sun[0], def.sun[1], aspect, 0) }, uLens: { value: new THREE.Vector4(th * aspect, th, dip, rad(motion.edgeDeg)) }, uUp: { value: up }, uRim: { value: new THREE.Vector4(def.radius, a.deckHigh[0], a.deckHigh[1], rad(a.rimDeg)) },
          uGain: { value: 1 }, uVignette: { value: 0 }, uAspect: { value: 16 / 9 }, uLayer: { value: new THREE.Vector3().fromArray(l.tint) }, uDiag: diagUniform, uGrad: gradUniform,
        },
        ...BLEND,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: !l.under,
      })
      const mesh = new THREE.Mesh(geo, material)
      mesh.frustumCulled = false
      mesh.renderOrder = k
      dryable(mesh)
      r.group.add(mesh)
      r.layers.push({ mesh, material })
      const own: Record<string, THREE.IUniform> = {}
      for (const [name, u] of Object.entries(material.uniforms)) own[name] = name === 'uDiag' || name === 'uGrad' ? u : { value: u.value instanceof THREE.Vector2 || u.value instanceof THREE.Vector4 ? u.value.clone() : u.value }
      own.uEye = { value: up.clone().multiplyScalar(def.radius + 1) }
      own.uWeight = { value: 0 }
      own.uDepth = { value: new THREE.Vector2(GLOBE_DEPTH[0] / def.radius, 1 / Math.log(GLOBE_DEPTH[1] / GLOBE_DEPTH[0])) }
      own.uTrue = { value: new THREE.Vector2(1e-6, 2e-6) }
      own.uSkin = { value: new THREE.Vector2(1e-6, 2e-6) }
      own.uTall = { value: new THREE.Vector2(1e3, 2e3) }
      own.uMatte = { value: new THREE.Vector4(0, 0, 0, 1) }
      own.uOutline = { value: outline }
      own.uEyeT = { value: up.clone().multiplyScalar(def.radius + 1) }
      own.uAxesT = { value: new THREE.Matrix3() }
      own.uLensT = { value: new THREE.Vector2(th * aspect, th) }
      own.uFrustum = { value: new THREE.Vector4(0, 1, -2, -1) }
      own.uLet = { value: new THREE.Vector3(1, 0, 1) }
      own.uFlat = { value: new THREE.Vector4(-2, -1, -3, -4) }
      own.uKeep = { value: new THREE.Vector2(2, 3) }
      own.uToneLook = { value: new THREE.Vector4(1, 1, 0, 1) }
      own.uToneLive = { value: new THREE.Vector4(1, 0, 1, 1) }
      own.uToneUnder = { value: new THREE.Vector4(1, 1, 1, 0) }
      // The coarse picture: the layer's own, and for a layer with a matte of its own (a tower group) the ground it stands on.
      const broadAt = alpha ? def.layers.findIndex((b) => !b.alpha && !b.under && b.box[0] <= x0 && b.box[1] <= y0 && b.box[0] + b.box[2] >= x0 + bw && b.box[1] + b.box[3] >= y0 + bh) : k
      const broadDef = def.layers[broadAt < 0 || broadAt >= k ? k : broadAt]!
      const broadMap = broadAt < 0 || broadAt >= k ? color : colours[broadAt]!
      own.uBroad = { value: broadMap }
      own.uBroadBox = { value: new THREE.Vector4(broadDef.box[0] / W, broadDef.box[1] / H, broadDef.box[2] / W, broadDef.box[3] / H) }
      r.broadPx.push((broadMap.image as unknown as { width: number }).width * W / broadDef.box[2])
      const globeLayer = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT_GLOBE, fragmentShader: FRAG_GLOBE, uniforms: own, ...BLEND, side: THREE.DoubleSide, depthTest: true, depthWrite: !l.under })
      const twin = new THREE.Mesh(geo, globeLayer)
      twin.frustumCulled = false
      twin.renderOrder = 7 + k
      twin.visible = false
      dryable(twin)
      r.globeGround.add(twin)
      r.globeLayers.push({ mesh: twin, material: globeLayer })
    }
    return r
  }

  update(time: number, gain: number, vignette: number, view: RenderView, sun: THREE.Vector3, sky = 1): void {
    const m = this.motion
    const dt = Math.min(Math.max(time, -m.flowSeconds), m.flowSeconds)
    const aspect = view.format.width / view.format.height
    if (this.air) {
      const u = this.air.material.uniforms
      u.uGain!.value = gain * m.air.gain
      u.uThrough!.value = sky
      ;(u.uSun!.value as THREE.Vector3).copy(sun)
      u.uVignette!.value = vignette
      u.uAspect!.value = aspect
    }
    this.lay(this.layers, dt, gain, vignette, aspect)
  }

  private lay(layers: Layer[], dt: number, gain: number, vignette: number, aspect: number): void {
    const m = this.motion
    const sway = m.swayRad * Math.sin(m.swayPerSecond * dt)
    for (const l of layers) {
      const u = l.material.uniforms
      ;(u.uHaze!.value as THREE.Vector2).set(m.hazeDir[0] * m.hazeSpeed * dt, m.hazeDir[1] * m.hazeSpeed * dt)
      ;(u.uSway!.value as THREE.Vector4).w = sway
      u.uGain!.value = gain
      u.uVignette!.value = vignette
      u.uAspect!.value = aspect
    }
  }

  // The surface view drawn dry (on the globe side of the stop's own frames) or in full.
  dry(on: boolean): void {
    if (this.air) this.air.mesh.userData.dry = on
    for (const l of this.layers) l.mesh.userData.dry = on
  }

  // The dome of the globe side: to be added to the globe's group.
  get globeDome(): THREE.Mesh {
    return this.globeAir!.mesh
  }

  // eye: the globe camera in this scene, from the centre of the deck sphere. turn: this scene's frame in the globe's group.
  // eyeT: the same eye at the T of the handover. weight: the air on the limb. sunWeight: the Sun's own light. exact: the share of the
  // rest that is taken as the whole air picture less the Sun's part (1 at T). own: a frame of the stop's own hold, dive or rise, where
  // what is not shown yet is drawn dry.
  updateGlobe(eye: THREE.Vector3, eyeT: THREE.Vector3, turn: THREE.Quaternion, weight: number, field: [number, number], sunWeight: number, exact: number, gain: number, vignette: number, view: RenderView, sun: THREE.Vector3, own: boolean): void {
    const g = this.globeAir!
    const shown = weight > 0 || sunWeight > 0
    g.mesh.visible = shown || own
    g.mesh.userData.dry = !shown
    g.mesh.quaternion.copy(turn)
    const u = g.material.uniforms
    ;(u.uEye!.value as THREE.Vector3).copy(eye)
    const rT = Math.max(eyeT.length(), this.radius + 0.02)
    ;(u.uUpT!.value as THREE.Vector3).copy(eyeT).divideScalar(eyeT.length())
    u.uDipT!.value = Math.acos(this.radius / rT)
    u.uWeight!.value = weight
    ;(u.uField!.value as THREE.Vector2).fromArray(field)
    u.uSunWeight!.value = sunWeight
    u.uExact!.value = exact
    u.uGain!.value = gain * this.motion.air.gain
    u.uThrough!.value = 1
    ;(u.uSun!.value as THREE.Vector3).copy(sun)
    u.uVignette!.value = vignette
    u.uAspect!.value = view.format.width / view.format.height
  }

  // The ground of the close side on the globe side. share: how much of it (GroundShare). time: the close side's own time, as in
  // update. eye, eyeT, turn, sun as in updateGlobe. centre: the centre of the deck sphere in this scene. The group takes the similarity:
  // this scene's frame turned by turn, the deck sphere on the globe's unit sphere. own as in updateGlobe.
  updateGround(share: GroundShare, time: number, eye: THREE.Vector3, eyeT: THREE.Vector3, turn: THREE.Quaternion, centre: THREE.Vector3, gain: number, vignette: number, view: RenderView, sun: THREE.Vector3, own: boolean): void {
    const weight = share.weight
    const on = weight > 0
    const under = on && share.under > 0
    this.globeGround.visible = on || own
    for (const l of this.globeLayers) {
      l.mesh.visible = on || own
      l.mesh.userData.dry = !on
    }
    this.globeUnder!.mesh.visible = under || own
    this.globeUnder!.mesh.userData.dry = !under
    if (!on) return
    const m = this.motion
    const aspect = view.format.width / view.format.height
    this.globeGround.quaternion.copy(turn)
    this.globeGround.scale.setScalar(1 / this.radius)
    this.globeGround.position.copy(centre).multiplyScalar(-1 / this.radius).applyQuaternion(turn)
    this.lay(this.globeLayers, Math.min(Math.max(time, -m.flowSeconds), m.flowSeconds), gain, vignette, aspect)
    let n = 0
    for (const l of this.globeLayers) {
      ;(l.material.uniforms.uEye!.value as THREE.Vector3).copy(eye)
      l.material.uniforms.uWeight!.value = weight
      ;(l.material.uniforms.uTrue!.value as THREE.Vector2).fromArray(share.true)
      ;(l.material.uniforms.uSkin!.value as THREE.Vector2).fromArray(share.skin)
      ;(l.material.uniforms.uTall!.value as THREE.Vector2).fromArray(share.tall)
      ;(l.material.uniforms.uMatte!.value as THREE.Vector4).fromArray(share.matte)
      // matte.level is a level of the full set's picture: this set reads the level that covers the same part of the image.
      ;(l.material.uniforms.uMatte!.value as THREE.Vector4).z = Math.max(share.matte[2]! - this.levelsUnderFull, 0)
      ;(l.material.uniforms.uEyeT!.value as THREE.Vector3).copy(eyeT)
      ;(l.material.uniforms.uAxesT!.value as THREE.Matrix3).copy(share.atT.axes)
      ;(l.material.uniforms.uLensT!.value as THREE.Vector2).set(share.atT.tan * aspect, share.atT.tan)
      ;(l.material.uniforms.uFrustum!.value as THREE.Vector4).set(share.frustum[0], share.frustum[1], share.near[0], share.near[1])
      ;(l.material.uniforms.uLet!.value as THREE.Vector3).set(share.held, share.near[2], share.frustum[2])
      ;(l.material.uniforms.uFlat!.value as THREE.Vector4).fromArray(share.flat)
      ;(l.material.uniforms.uKeep!.value as THREE.Vector2).fromArray(share.keep)
      ;(l.material.uniforms.uToneLook!.value as THREE.Vector4).fromArray(share.tone.look)
      ;(l.material.uniforms.uToneLive!.value as THREE.Vector4).set(share.tone.power, Math.log2(Math.max(share.tone.broad * this.broadPx[n]!, 1)), share.tone.most, share.tone.contrast)
      ;(l.material.uniforms.uToneUnder!.value as THREE.Vector4).set(share.tone.under[0], share.tone.under[1], share.tone.under[2], share.tone.colour)
      n++
    }
    const u = this.globeUnder!.material.uniforms
    const rT = Math.max(eyeT.length(), this.radius + 0.02)
    ;(u.uEye!.value as THREE.Vector3).copy(eye)
    ;(u.uUpT!.value as THREE.Vector3).copy(eyeT).divideScalar(eyeT.length())
    u.uDipT!.value = Math.acos(this.radius / rT)
    u.uWeight!.value = share.under
    u.uSunWeight!.value = 0
    ;(u.uBand!.value as THREE.Vector2).fromArray(share.band)
    u.uGain!.value = gain * m.air.gain
    ;(u.uSun!.value as THREE.Vector3).copy(sun)
    u.uVignette!.value = vignette
    u.uAspect!.value = aspect
  }

  dispose(): void {
    if (this.air) {
      this.air.mesh.geometry.dispose()
      this.air.material.dispose()
    }
    this.globeAir?.material.dispose()
    this.globeUnder?.material.dispose()
    for (const l of this.globeLayers) l.material.dispose()
    for (const l of this.layers) {
      l.mesh.geometry.dispose()
      l.material.dispose()
    }
  }
}
