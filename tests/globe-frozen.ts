export const RANGE_BRANCH = `  if (uDiag == 6) {
    float n = 1.0 + floor(clamp((log2(max(viewDepth, 1e-30)) - RANGE_LOW) / RANGE_OCTAVES, 0.0, 1.0) * 16777214.0);
    float high = floor(n / 65536.0);
    float mid = floor((n - high * 65536.0) / 256.0);
    return vec4(high / 255.0, mid / 255.0, (n - high * 65536.0 - mid * 256.0) / 255.0, 1.0);
  }
`
export const RANGE_NUMBERS = '\nconst float RANGE_LOW = -20.0;\nconst float RANGE_OCTAVES = 32.0;'

export function frozen(text: string): string {
  return text.replace(RANGE_BRANCH, '').replace(RANGE_NUMBERS, '')
}
