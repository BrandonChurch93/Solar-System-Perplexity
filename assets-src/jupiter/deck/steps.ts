import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as THREE from 'three'
import { ROOT, WORK, args, loadConfig, requireDisk } from '../../../tools/lib/common'
import { Capture, padFrame } from '../../../tools/lib/render'
import { shutterMid } from '../../../src/core/sampler'
import type { Pose } from '../../../src/core/types'
import { sideAt, type HandoverParams } from '../../../src/director/handover'
import type { Fit } from '../../../src/director/moves'
import { JupiterPlan, params } from '../../../src/stops/jupiter/plan'
import fit from '../../../src/stops/jupiter/fit.json'

// The "every frame" measure of tools/handover.ts on a few frames of this stop, without the whole report.
//   npx tsx assets-src/jupiter/deck/steps.ts --frames 2970-3000 --name NAME [--every N] [--dir DIR] [--path '{"dive":{"path":{"rise":0.3}}}'] [--norender]
// Stills are read from DIR (default out/work/jupiter/frames/NAME, files fNNNNN.png or fNNNNN-draft.png) and rendered at the draft tier when missing.
// --path merges handover options into the plan for the heights and the body grids only (the picture needs a build of the same options).

const cfg = loadConfig()
const a = args()
const [first, last] = String(a.frames).split('-').map(Number) as [number, number]
const every = a.every ? Number(a.every) : 1
const dir = a.dir ? String(a.dir) : join(WORK, 'jupiter', 'frames', String(a.name ?? 'steps'))
mkdirSync(dir, { recursive: true })
const master = cfg.formats[cfg.formatKeys.master]!
const L = cfg.raw.handover.limits
const fps = cfg.fps
const own = a.path ? (JSON.parse(String(a.path)) as Record<string, unknown>) : null
const base = params.handover as unknown as Record<string, Record<string, unknown>>
const merged = own ? Object.fromEntries(Object.entries(base).map(([k, v]) => [k, own[k] && typeof v === 'object' ? { ...v, ...(own[k] as object) } : v])) : base
const plan = new JupiterPlan('jupiter', fit as Fit, { ...params, handover: merged as unknown as HandoverParams })

function sphereHit(p: Pose, sx: number, sy: number): boolean {
  const tan = Math.tan((p.vfov * Math.PI) / 360)
  const ray = new THREE.Vector3(sx * tan * (master.width / master.height), sy * tan, -1).normalize().applyQuaternion(p.quaternion)
  const along = -p.position.dot(ray)
  const disc = along * along - p.position.lengthSq() + 1
  return disc > 0 && along - Math.sqrt(disc) > 0
}

function bodyGrid(p: Pose): number[][] {
  const cols = Math.floor(master.width / L.blockPx)
  const rows = Math.floor(master.height / L.blockPx)
  const out: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) row.push(sphereHit(p, (((c + 0.5) * L.blockPx) / master.width) * 2 - 1, 1 - (((r + 0.5) * L.blockPx) / master.height) * 2) ? 1 : 0)
    out.push(row)
  }
  return out
}

const rows: { frame: number; height: number; rate: number | null }[] = []
const bodies: number[][][] = []
const paths: string[] = []
const missing: number[] = []
for (let f = first; f <= last; f += every) {
  const seg = cfg.segments.find((s) => s.stop === 'jupiter' && f >= s.firstFrame && f < s.endFrame)!
  const mid = (f + shutterMid()) / fps
  const kind = seg.kind as 'dive' | 'rise'
  const side = sideAt(seg, mid)
  const pose = (view: 'orbit' | 'terrain'): Pose => (kind === 'dive' ? plan.divePose(mid, view) : plan.risePose(mid, view))
  const cam = side === 'orbit' ? pose('orbit') : plan.twin(pose('terrain'), mid)
  const height = cam.position.length() - 1
  const prev = rows[rows.length - 1]
  rows.push({ frame: f, height, rate: prev ? Math.log(prev.height / height) : null })
  bodies.push(bodyGrid(cam))
  const one = [join(dir, 'f' + padFrame(f) + '.png'), join(dir, 'f' + padFrame(f) + '-draft.png')].find((p) => existsSync(p))
  if (!one) missing.push(f)
  paths.push(one ?? join(dir, 'f' + padFrame(f) + '.png'))
}
if (a.norender !== 'true' && missing.length > 0) {
  requireDisk(cfg)
  const capture = new Capture(cfg, a.format)
  try {
    for (const f of missing) await capture.still(f, 'draft', join(dir, 'f' + padFrame(f) + '.png'))
  } finally {
    await capture.close()
  }
}
const have = paths.map((p) => existsSync(p))
if (have.every((v) => v)) {
  const reply = execFileSync('python3', [join(ROOT, 'tools/img/handover.py')], { input: JSON.stringify({ op: 'frames', paths, bodies, floor: L.flatFloor }), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 1 << 26 })
  const n = JSON.parse(reply) as { level: number; colour: number[]; bodyShare: number; bodyLevel: number; bodyColour: number[]; flatShare: number; contrast: number }[]
  let worst = { frame: -1, step: 0 }
  let worstColour = { frame: -1, step: 0 }
  const out = rows.map((r, i) => {
    const p = n[i - 1]
    const v = n[i]!
    const dl = p ? v.bodyLevel - p.bodyLevel : 0
    const dc = p ? Math.max(...v.bodyColour.map((c, k) => Math.abs(c - p.bodyColour[k]!))) : 0
    const counted = p ? Math.min(v.bodyShare, p.bodyShare) >= L.bodyShare : false
    if (counted && Math.abs(dl) > worst.step) worst = { frame: r.frame, step: Math.abs(dl) }
    if (counted && dc > worstColour.step) worstColour = { frame: r.frame, step: dc }
    console.log(r.frame, 'h', r.height.toFixed(4), 'rate', (r.rate ?? 0).toFixed(4), 'share', v.bodyShare.toFixed(3), 'body', v.bodyLevel.toFixed(2), 'step', dl.toFixed(2), 'colour', dc.toFixed(2), 'flat', v.flatShare.toFixed(3), 'frame', v.level.toFixed(2), p ? (v.level - p.level).toFixed(2) : '')
    return { ...r, ...v, step: dl, colourStep: dc }
  })
  console.log('worst level step', worst.step.toFixed(2), 'into', worst.frame, 'limit', L.levelStep, '| worst colour step', worstColour.step.toFixed(2), 'into', worstColour.frame, 'limit', L.colourStep)
  writeFileSync(join(dir, 'steps-' + first + '-' + last + '.json'), JSON.stringify(out))
} else for (const r of rows) console.log(r.frame, 'h', r.height.toFixed(4), 'rate', (r.rate ?? 0).toFixed(4))
