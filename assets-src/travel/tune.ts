import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TRAVEL, type TravelLook } from '../../src/space/travel/path'

const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI

export interface Measure { worst: number; worstAt: number; inView: number; peakTurn: number; peakAt: number; nextIn: number; next10: number; clear: number }

export function measure(id: string, over?: Partial<TravelLook>): Measure {
  const saved = TRAVEL[id]
  if (over) TRAVEL[id] = { ...saved, ...over }
  const d = new FilmDirector(plans)
  TRAVEL[id] = saved!
  const seg = config.segments.find((s) => s.id === id + '.travel')!
  const index = plans.findIndex((p) => p.id === id)
  const px = (f: number, o: number): { pts: THREE.Vector2[]; front: boolean; weight: number; r: number; q: THREE.Quaternion; next: { x: number; y: number; r: number; front: boolean } } => {
    const s = d.shotAt(f, (f + o) / config.fps)
    const inv = s.camera.quaternion.clone().invert()
    const t = Math.tan(s.camera.vfov / DEG / 2)
    const k = fmt.height / 2 / t
    const st = s.sets[0]!
    const rel = st.origin.clone().sub(s.camera.position).applyQuaternion(inv)
    const pts: THREE.Vector2[] = []
    for (const off of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const p = rel.clone().add(new THREE.Vector3(off[0], off[1], 0))
      const z = Math.max(-p.z, 1e-6)
      pts.push(new THREE.Vector2((p.x / z) * k, (p.y / z) * k))
    }
    const dist = rel.length()
    const nx = s.sets[s.sets.length - 1]!
    const nr = nx.origin.clone().sub(s.camera.position).applyQuaternion(inv)
    const nz = Math.max(-nr.z, 1e-6)
    return { pts, front: rel.z < 0, weight: st.weight, r: (1 / Math.sqrt(Math.max(dist * dist - 1, 1e-12))) * k, q: s.camera.quaternion.clone(), next: { x: (nr.x / nz) * k, y: (nr.y / nz) * k, r: (1 / Math.sqrt(Math.max(nr.lengthSq() - 1, 1e-12))) * k, front: nr.z < 0 } }
  }
  const m: Measure = { worst: 0, worstAt: 0, inView: 0, peakTurn: 0, peakAt: 0, nextIn: -1, next10: -1, clear: d.clearAtOf(index + 1) }
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const a = px(f, 0)
    const b = px(f, config.shutterFraction)
    const c = a.pts[0]!
    const seen = a.front && a.weight > 0 && Math.abs(c.x) < fmt.width / 2 + a.r && Math.abs(c.y) < fmt.height / 2 + a.r
    if (seen) {
      m.inView++
      for (let i = 0; i < a.pts.length; i++) {
        const p = a.pts[i]!
        if (Math.abs(p.x) > fmt.width / 2 + 40 || Math.abs(p.y) > fmt.height / 2 + 40) continue
        const v = p.distanceTo(b.pts[i]!)
        if (v > m.worst) {
          m.worst = v
          m.worstAt = f
        }
      }
    }
    const turn = (2 * Math.acos(Math.min(Math.abs(a.q.dot(b.q)), 1)) * DEG) / config.shutterFraction
    if (turn > m.peakTurn) {
      m.peakTurn = turn
      m.peakAt = f
    }
    const n = a.next
    if (m.nextIn < 0 && a.weight <= 0 && n.front && Math.abs(n.x) < fmt.width / 2 && Math.abs(n.y) < fmt.height / 2) m.nextIn = f
    if (m.next10 < 0 && n.r >= 10) m.next10 = f
  }
  return m
}

export const line = (id: string, m: Measure): string => id + ': leaving body in view ' + m.inView + ' frames, fastest limb ' + m.worst.toFixed(1) + ' px across the shutter at ' + m.worstAt + ', clear ' + m.clear.toFixed(2) + ', peak turn ' + m.peakTurn.toFixed(2) + ' deg/frame at ' + m.peakAt + ', next body in frame from ' + m.nextIn + ', 10 px at ' + m.next10

const argv = process.argv.slice(2)
if (argv[0] === 'all') for (const p of plans.slice(0, -1)) console.log(line(p.id, measure(p.id)))
else if (argv[0] === 'try') for (const j of argv.slice(2)) console.log(j + '\n  ' + line(argv[1]!, measure(argv[1]!, JSON.parse(j) as Partial<TravelLook>)))
else if (argv[0]) {
  const id = argv[0]
  const rows: { over: Partial<TravelLook>; m: Measure }[] = []
  const most = Number(argv[1] ?? 45)
  const turn = Number(argv[2] ?? 5)
  const lead = Number(argv[3] ?? 8)
  for (const share of [0.15, 0.2, 0.25, 0.32, 0.4]) for (const until of [0.35, 0.45, 0.55, 0.65]) for (const from of [0, 0.1, 0.2, 0.3]) for (const pan of [[2, 2], [2, 3], [3, 3], [2, 4]] as [number, number][]) for (const roll of [0.2, 0.3, 0.4]) {
    const over = { lead: [share, until] as [number, number], panSpan: [from, 1] as [number, number], pan, rollSpan: [roll, 0.96] as [number, number], clearBy: 0.7 }
    const m = measure(id, over)
    if (m.worst <= most && m.peakTurn <= turn && m.next10 - m.nextIn >= lead) rows.push({ over, m })
  }
  const wt = Number(argv[4] ?? 4)
  rows.sort((a, b) => a.m.worst + wt * a.m.peakTurn - (b.m.worst + wt * b.m.peakTurn))
  for (const r of rows.slice(0, 12)) console.log(JSON.stringify(r.over) + '\n  ' + line(id, r.m))
}
