import type * as THREE from 'three'

// The inverse angle functions of the Neptune stop's shaders on a graphics card.
//
// The shader texts of this stop call the built in asin, acos and atan, and under the software renderer that drew the approved
// film they stay exactly as they are: ownTrig changes nothing there, so that picture stays the same to the last bit.
// A graphics card under Direct3D 11 has no such instruction. Its shader compiler writes the three functions out as short
// polynomials (asin off by up to 0.0000676 radians, with a step of twice that at 0), and bandOf of the deep program multiplies
// the angle by the planet's radius, which makes of that error a shift of the fine cloud pattern by 1 to 2 pixels at 1080 lines
// (measured on the Windows PC's test frames 9720 and 9916 of main c980c36).
// So on every renderer that is not the software renderer, each program of this stop is compiled with the three calls turned to
// the functions below: the float kernels of fdlibm (e_asinf.c, e_acosf.c, s_atanf.c, e_atan2f.c), written with + - * / sqrt abs
// min max and comparisons only and without a branch, so every machine works the same steps. Measured in 32 bit floats against
// the exact answers (as shader code in a browser, 2.1 million points for each function): asin within 2.3 float steps, acos
// within 1.2, atan within 1.9, everywhere, with no step at 0. Outside -1 to 1 nepAsin and nepAcos answer as at the nearer end.
// nepAtan(0, 0) is 0, and with y = 0 and x under 0 it is plus pi.
export const TRIG_GLSL = /* glsl */ `
float nepAsinRatio(float t) {
  float p = t * (0.166666672 + t * (-0.325565815 + t * (0.201212525 + t * (-0.0400555357 + t * (0.000791535014 + t * 3.47933092e-05)))));
  float q = 1.0 + t * (-2.40339494 + t * (2.02094579 + t * (-0.68828398 + t * 0.077038154)));
  return p / q;
}
float nepAsin(float x) {
  float a = min(abs(x), 1.0);
  bool small = a < 0.5;
  float t = mix((1.0 - a) * 0.5, a * a, small);
  float w = nepAsinRatio(t);
  float s = sqrt(t);
  float r = mix(1.57079625 - (2.0 * (s + s * w) - 7.54978942e-08), a + a * w, small);
  return mix(r, -r, x < 0.0);
}
float nepAcos(float x) {
  float c = clamp(x, -1.0, 1.0);
  float a = abs(c);
  bool small = a < 0.5;
  float t = mix((1.0 - a) * 0.5, a * a, small);
  float w = nepAsinRatio(t);
  float s = sqrt(t);
  float mid = 1.57079625 - (c - (7.54978942e-08 - c * w));
  float pos = 2.0 * (s + s * w);
  float neg = 3.1415925 - 2.0 * (s + (s * w - 7.54978942e-08));
  return mix(mix(pos, neg, c < 0.0), mid, small);
}
float nepAtan(float y, float x) {
  float ax = abs(x);
  float ay = abs(y);
  float big = max(ax, ay);
  float q = min(ax, ay) / mix(1.0, big, big > 0.0);
  bool low = q < 0.4375;
  bool mid = q < 0.6875;
  float num = mix(q - 1.0, 2.0 * q - 1.0, mid);
  float den = mix(q + 1.0, 2.0 + q, mid);
  float r = mix(num / den, q, low);
  float hi = mix(mix(0.785398126, 0.463647604, mid), 0.0, low);
  float lo = mix(mix(3.77489471e-08, 5.01215824e-09, mid), 0.0, low);
  float z = r * r;
  float w = z * z;
  float s1 = z * (0.333333343 + w * (0.142857149 + w * (0.0909088701 + w * (0.0666107312 + w * (0.0497687794 + w * 0.0162858199)))));
  float s2 = w * (-0.200000003 + w * (-0.111111104 + w * (-0.0769187585 + w * (-0.0583357029 + w * -0.0365315713))));
  float t = hi - ((r * (s1 + s2) - lo) - r);
  t = mix(t, 1.57079625 - (t - 7.54978942e-08), ay > ax);
  t = mix(t, 3.14159274 - (t + 8.74227766e-08), x < 0.0);
  return mix(t, -t, y < 0.0);
}
float nepAtan(float t) {
  return nepAtan(t, 1.0);
}
`

const OWN_NAME: Record<string, string> = { asin: 'nepAsin', acos: 'nepAcos', atan: 'nepAtan' }

// One shader text with every call of the built in asin, acos and atan turned to the functions above, which are put in after
// the precision lines at its head. A text without such a call comes back as it is.
export function ownTrigText(text: string): string {
  if (text.search(/\b(?:asin|acos|atan)\s*\(/) < 0) return text
  const head = /^(?:\s*precision\s+\w+\s+\w+\s*;)*/.exec(text)![0].length
  const body = text.slice(head).replace(/\b(asin|acos|atan)(\s*\()/g, (_all, name: string, open: string) => OWN_NAME[name]! + open)
  return text.slice(0, head) + '\n' + TRIG_GLSL + body
}

const softwareAnswers = new WeakMap<object, boolean>()

// True for the software renderer (SwiftShader), which drew the approved film. Anything else, and no answer at all, counts as
// a graphics card.
function softwareDrawn(renderer: THREE.WebGLRenderer): boolean {
  let answer = softwareAnswers.get(renderer)
  if (answer === undefined) {
    let name = ''
    try {
      const gl = renderer.getContext()
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    } catch {
      name = ''
    }
    answer = /swiftshader/i.test(name)
    softwareAnswers.set(renderer, answer)
  }
  return answer
}

// Called once for each material of this stop, right after it is made.
export function ownTrig(material: THREE.ShaderMaterial): void {
  material.onBeforeCompile = (shader, renderer) => {
    if (softwareDrawn(renderer)) return
    shader.vertexShader = ownTrigText(shader.vertexShader)
    shader.fragmentShader = ownTrigText(shader.fragmentShader)
  }
}
