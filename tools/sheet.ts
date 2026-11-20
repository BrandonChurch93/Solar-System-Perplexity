import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { args, loadConfig, requireDisk, WORK } from './lib/common'
import { Capture, filmSheets, outputFolder, padImage, sheetFrames } from './lib/render'

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const tier = a.tier ?? 'review'
if (Boolean(a.film) === Boolean(a.segment) || (a.film && a.cover)) throw new Error('choose --film or --segment ID [--cover]')
const segment = cfg.segments.find((s) => s.id === a.segment)
if (a.segment && segment === undefined) throw new Error('unknown segment ' + a.segment)
const dir = outputFolder(join(WORK, 'sheets'))
const capture = new Capture(cfg, a.format)
const temp = mkdtempSync(join(dir, '.frames-'))
try {
  const stem = '-' + capture.format + '-' + tier + '.png'
  if (segment) {
    const cover = Boolean(a.cover)
    const file = join(dir, segment.id + (cover ? '-cover' : '') + stem)
    await capture.sheet(file, sheetFrames(cfg, segment, cover), tier, temp, { segment: segment.id, cover })
    console.log(file)
  } else {
    for (const [i, specs] of filmSheets(cfg).entries()) {
      const file = join(dir, 'film-' + padImage(i + 1) + stem)
      await capture.sheet(file, specs, tier, temp, { film: true, part: i + 1 })
      console.log(file)
    }
  }
} finally {
  try { await capture.close() } finally { rmSync(temp, { recursive: true, force: true }) }
}
