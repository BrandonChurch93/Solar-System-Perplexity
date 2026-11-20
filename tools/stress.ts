import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { WORK, args, ensureBuild, loadConfig, machineId, requireDisk } from './lib/common'
import { chunkFile, chunkReady, log, makeJob, renderUnits, type Unit } from './film'
import { decodeFramePng, encodeOnePass, probeVideo, psnrPng } from './lib/encode'
import { judgedFrames, segmentById } from '../src/director/timeline'

const cfg = loadConfig()
const a = args()
const st = cfg.raw.quality.stress
const ids = a.segment ? a.segment.split(',') : st.segments
const tier = a.tier ?? st.tier
const assets = a.assets ?? 'full'
requireDisk(cfg)
const hashes = ensureBuild()
const dir = join(WORK, 'stress')
const job = makeJob(cfg, hashes, cfg.formatKeys.master, tier, assets, { ...a, grab: 'png' })
const length = Math.max(1, Math.round(st.seconds * cfg.fps))
const pad = (n: number): string => String(n).padStart(5, '0')
const summary: Record<string, unknown>[] = []
try {
  for (const id of ids) {
    const seg = segmentById(id)
    const fr = (cfg.raw.judged.fractions as Record<string, number>)[seg.kind]
    const judged = fr === undefined ? seg.firstFrame + Math.floor(seg.frames / 2) : seg.firstFrame + Math.floor(fr * seg.frames + 1e-9)
    if (fr !== undefined && !judgedFrames().some((j) => j.frame === judged)) throw new Error('judged frame ' + judged + ' of ' + id + ' is not on the judged list')
    const len = Math.min(length, seg.frames)
    const first = Math.min(Math.max(judged - Math.floor(len / 2), seg.firstFrame), seg.endFrame - len)
    const u: Unit = { id, first, end: first + len, dir }
    const picks = [first, first + Math.floor((len - 1) / 2), first + len - 1]
    const before = (f: number): string => id + '-before-' + pad(f) + '.png'
    if (picks.some((f) => !existsSync(join(dir, before(f))))) rmSync(chunkFile(job, u) + '.json', { force: true })
    job.keepPng = { frames: new Set(picks), dir, name: before }
    if (!chunkReady(job, u)) await renderUnits(job, [u])
    const src = chunkFile(job, u)
    const stressed = join(dir, id + '-stress.mp4')
    const mbps = cfg.raw.quality.compressionStressMbps
    encodeOnePass(src, stressed, { fps: cfg.fps, rate: { bitrateMbps: mbps, maxrateMbps: mbps, bufsizeMbps: mbps * 2 }, preset: 'medium' })
    const frames: Record<string, unknown>[] = []
    for (const f of picks) {
      const after = join(dir, id + '-after-' + pad(f) + '.png')
      decodeFramePng(stressed, f - first, after)
      const encoded = join(WORK, 'tmp', 'stress-' + id + '-' + pad(f) + '.png')
      decodeFramePng(src, f - first, encoded)
      frames.push({ frame: f, before: before(f), after: id + '-after-' + pad(f) + '.png', psnrExport: Number(psnrPng(encoded, join(dir, before(f))).toFixed(2)), psnrStress: Number(psnrPng(after, join(dir, before(f))).toFixed(2)) })
      rmSync(encoded)
    }
    const rec = {
      engineHash: hashes.engine, stopHashes: hashes.stops, format: job.format, tier, assets, diag: 'beauty', browser: job.browser ?? '', machine: machineId(), first, last: first + len - 1,
      extra: { segment: id, judgedFrame: judged, exportFile: id + '.mp4', exportMbps: cfg.raw.export.bitrateMbps, stressFile: id + '-stress.mp4', stressMbps: mbps, stressEncode: 'libx264 medium one pass, maxrate = bitrate, bufsize = 2x', probeExport: probeVideo(src), probeStress: probeVideo(stressed), frames },
    }
    writeFileSync(join(dir, id + '.json'), JSON.stringify(rec, null, 1))
    summary.push({ id, first, last: first + len - 1, frames })
    log(job, 'stress ' + id + ' frames ' + first + '-' + (first + len - 1) + ': ' + frames.map((f) => f.frame + ' ' + f.psnrExport + '/' + f.psnrStress + ' dB').join(', '))
  }
} finally {
  await job.source?.close()
}
console.log(JSON.stringify(summary.map((s) => s.id)))
