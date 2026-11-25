export interface BloomPlan {
  halves: [number, number][]
  levels: [number, number][]
  step: number
}

export const HALVE = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
out vec4 outColor;
void main() {
  ivec2 top = textureSize(uTex, 0) - 1;
  ivec2 p = ivec2(gl_FragCoord.xy) * 2;
  vec3 s = texelFetch(uTex, min(p, top), 0).rgb + texelFetch(uTex, min(p + ivec2(1, 0), top), 0).rgb
    + texelFetch(uTex, min(p + ivec2(0, 1), top), 0).rgb + texelFetch(uTex, min(p + ivec2(1, 1), top), 0).rgb;
  outColor = vec4(s * 0.25, 1.0);
}`

export function bloomPlan(width: number, height: number, factor: number, count: number): BloomPlan {
  if (!(width > 0 && height > 0 && factor > 0)) throw new Error('the bloom has no frame')
  const halves: [number, number][] = []
  let w = width
  let h = height
  let step = factor
  while (step >= 1.5) {
    w = Math.ceil(w / 2)
    h = Math.ceil(h / 2)
    halves.push([w, h])
    step /= 2
  }
  const levels: [number, number][] = []
  let lw = Math.round(width / factor)
  let lh = Math.round(height / factor)
  for (let i = 0; i < count; i++) {
    lw = Math.max(2, Math.ceil(lw / 2))
    lh = Math.max(2, Math.ceil(lh / 2))
    levels.push([lw, lh])
  }
  return { halves, levels, step }
}
