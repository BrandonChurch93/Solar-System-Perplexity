import { config } from '../config'

export const REQUIRED_EXTENSIONS = ['EXT_color_buffer_float', 'EXT_color_buffer_half_float', 'OES_texture_float_linear', 'EXT_float_blend']
export const OPTIONAL_EXTENSIONS = ['EXT_texture_filter_anisotropic']

export interface Needs { extensions: string[]; optional: string[]; limits: Record<string, number> }

export function needs(assets: string, formatId: string): Needs {
  const set = config.assetSets[assets]
  const format = config.formats[formatId]
  if (!set || !format) throw new Error('unknown asset set or format')
  const edge = Math.max(format.width, format.height)
  return {
    extensions: REQUIRED_EXTENSIONS,
    optional: OPTIONAL_EXTENSIONS,
    limits: {
      MAX_TEXTURE_SIZE: Math.max(set.wrapMapWidth, set.reliefWidth, set.skyWidth, edge),
      MAX_RENDERBUFFER_SIZE: edge,
      MAX_TEXTURE_IMAGE_UNITS: 16,
      MAX_VERTEX_ATTRIBS: 8,
    },
  }
}

export function missing(gl: WebGL2RenderingContext, n: Needs): string[] {
  const out: string[] = []
  for (const e of n.extensions) if (!gl.getExtension(e)) out.push(e)
  for (const [k, v] of Object.entries(n.limits)) {
    const got = gl.getParameter((gl as unknown as Record<string, number>)[k]!) as number
    if (got < v) out.push(k + ' ' + got + ' < ' + v)
  }
  return out
}
