import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { WORK, loadConfig } from '../lib/common'
import { decodePng } from '../lib/frames'
import { countTexels } from './texels'

const cfg = loadConfig()
const dir = join(WORK, 'measure', 'selftest')
mkdirSync(dir, { recursive: true })
const py = `
import sys
import numpy as np
from PIL import Image
d = sys.argv[1]
w, h = 400, 200
a = np.zeros((h, w, 3), np.uint8)
a[:, :300, 1] = 255
a[:, :300, 0] = 128
a[:, :6, 0] = 127
a[:, 300:, 0] = 10
Image.fromarray(a).save(d + '/rgb.png')
b = np.zeros((h, w, 4), np.uint8)
b[..., 3] = 255
b[:100, :, 1] = 200
b[:100, :, 0] = 40
b[:100, :50, 0] = 255
Image.fromarray(b, 'RGBA').save(d + '/rgba.png', optimize=True)
Image.fromarray(np.zeros((h, w, 3), np.uint8)).save(d + '/empty.png')
`
execFileSync('python3', ['-c', py, dir])
const cases: [string, number, number, number][] = [
  ['rgb.png', 60000, 1200, 0.02],
  ['rgba.png', 40000, 35000, 0.875],
  ['empty.png', 0, 0, 0],
]
let ok = true
for (const [name, counted, soft, fraction] of cases) {
  const c = countTexels(decodePng(readFileSync(join(dir, name))), cfg.raw.detail.minTexelsPerPixel)
  const pass = c.counted === counted && c.soft === soft && Math.abs(c.fraction - fraction) < 1e-9
  ok &&= pass
  console.log((pass ? 'ok   ' : 'BAD  ') + name + ' counted ' + c.counted + ' soft ' + c.soft + ' fraction ' + c.fraction.toFixed(4) + ' (want ' + counted + ' ' + soft + ' ' + fraction + ')')
}
const s = execFileSync('python3', [join('tools/measure/g17.py'), 'references/approved/mars-hero.png', 'references/approved/mars-hero.png'], { encoding: 'utf8' })
const r = JSON.parse(s) as { median: number }
const g17 = Math.abs(r.median - 1) < 1e-9
ok &&= g17
console.log((g17 ? 'ok   ' : 'BAD  ') + 'g17 approved against itself: median ' + r.median)
process.exit(ok ? 0 : 1)
