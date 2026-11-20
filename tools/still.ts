import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, WORK, args, formatId, ensureBuild, loadConfig, machineId, requireDisk, writeRecord } from './lib/common'
import { openCapture, renderPng } from './lib/browser'

const cfg = loadConfig()
const a = args()
const frame = Number(a.frame ?? 0)
const tier = a.tier ?? 'final'
const format = formatId(cfg, a.format)
const assets = a.assets ?? 'full'
const diag = a.diag ?? 'beauty'
requireDisk(cfg)
const hashes = ensureBuild()
const s = await openCapture({ dist: DIST, format, assets, diag })
const { png, seconds } = await renderPng(s.page, frame, tier)
const dir = join(WORK, 'stills')
mkdirSync(dir, { recursive: true })
const file = a.out ?? join(dir, 'f' + String(frame).padStart(5, '0') + '-' + format + '-' + tier + '-' + assets + (diag === 'beauty' ? '' : '-' + diag) + '.png')
writeFileSync(file, png)
writeRecord(file, { engineHash: hashes.engine, stopHashes: hashes.stops, format, tier, assets, diag, browser: s.browserVersion, machine: machineId(), frame, extra: { seconds } })
console.log(file + ' ' + seconds.toFixed(1) + 's')
await s.close()
