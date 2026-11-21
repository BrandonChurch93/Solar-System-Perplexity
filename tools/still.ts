import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, WORK, args, formatId, ensureBuild, loadConfig, machineId, requireDisk, writeRecord } from './lib/common'
import { openCapture, renderPngFresh, type Session } from './lib/browser'

const cfg = loadConfig()
const a = args()
const frame = Number(a.frame ?? 0)
const tier = a.tier ?? 'final'
const format = formatId(cfg, a.format)
const assets = a.assets ?? 'full'
const diag = a.diag ?? 'beauty'
requireDisk(cfg)
const hashes = ensureBuild()
const held: { session?: Session } = {}
const { png, seconds, samples } = await renderPngFresh(() => openCapture({ dist: DIST, format, assets, diag }), held, frame, tier)
const s = held.session!
const dir = join(WORK, 'stills')
mkdirSync(dir, { recursive: true })
const file = a.out ?? join(dir, 'f' + String(frame).padStart(5, '0') + '-' + format + '-' + tier + '-' + assets + (diag === 'beauty' ? '' : '-' + diag) + '.png')
writeFileSync(file, png)
writeRecord(file, { engineHash: hashes.engine, stopHashes: hashes.stops, format, tier, assets, diag, browser: s.browserVersion, machine: machineId(), frame, extra: { seconds, samples } })
console.log(file + ' ' + seconds.toFixed(1) + 's ' + samples + ' samples')
await s.close()
