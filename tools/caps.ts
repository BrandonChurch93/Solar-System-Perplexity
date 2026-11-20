import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'
import { CHROME, CHROME_FLAGS, serve } from './lib/browser'
import { DIST, ROOT, ensureBuild } from './lib/common'

ensureBuild()
const { server, url } = await serve(DIST)
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
const page = await browser.newPage()
await page.goto(url + '?mode=capture')
const caps = await page.evaluate(async () => {
  const gl = document.createElement('canvas').getContext('webgl2')!
  const names = ['MAX_TEXTURE_SIZE', 'MAX_3D_TEXTURE_SIZE', 'MAX_CUBE_MAP_TEXTURE_SIZE', 'MAX_RENDERBUFFER_SIZE', 'MAX_ARRAY_TEXTURE_LAYERS', 'MAX_COLOR_ATTACHMENTS', 'MAX_DRAW_BUFFERS', 'MAX_TEXTURE_IMAGE_UNITS', 'MAX_COMBINED_TEXTURE_IMAGE_UNITS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS', 'MAX_VERTEX_ATTRIBS', 'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_VARYING_VECTORS', 'MAX_SAMPLES', 'MAX_UNIFORM_BUFFER_BINDINGS']
  const limits: Record<string, number> = {}
  for (const n of names) limits[n] = gl.getParameter((gl as unknown as Record<string, number>)[n]!) as number
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  const codecs: Record<string, boolean> = {}
  const sizes: [string, number, number][] = [['960x540', 960, 540], ['1920x1080', 1920, 1080], ['3840x2160', 3840, 2160]]
  const strings = ['avc1.640034', 'avc1.640033', 'avc1.640032', 'avc1.64002A', 'avc1.640028', 'avc1.4D4034', 'avc1.4D402A', 'avc1.4D4028', 'avc1.42E034', 'avc1.42E02A', 'avc1.42E01F', 'vp09.00.40.08', 'vp8', 'av01.0.08M.08']
  if (typeof VideoEncoder !== 'undefined') {
    for (const [label, width, height] of sizes) {
      for (const codec of strings) {
        try {
          const r = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: 20e6, framerate: 30 })
          codecs[codec + ' ' + label] = r.supported === true
        } catch {
          codecs[codec + ' ' + label] = false
        }
      }
    }
  }
  return {
    renderer: dbg ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string) : '',
    version: gl.getParameter(gl.VERSION) as string,
    limits,
    pointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array),
    viewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array),
    extensions: gl.getSupportedExtensions() ?? [],
    videoEncoder: typeof VideoEncoder !== 'undefined',
    codecs,
    hardwareConcurrency: navigator.hardwareConcurrency,
  }
})
const out = { browser: 'Chrome for Testing ' + browser.version(), flags: CHROME_FLAGS, ...caps }
writeFileSync(join(ROOT, 'config/webgl-caps.json'), JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify({ ...out, extensions: out.extensions.length }, null, 1))
await browser.close()
server.close()
