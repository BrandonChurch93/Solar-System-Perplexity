import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector, LOOKBACK } from '../../src/director/film'
import { plans } from '../../src/director/plans'
const fmt = config.formats[config.formatKeys.master]!
const DEG = 180 / Math.PI
const G = LOOKBACK.glide as Record<string, number>
const run = (label: string): void => {
  const d = new FilmDirector(plans)
  const ys: number[] = []
  let peak = 0, peakF = 0
  let prev: THREE.Quaternion | null = null
  for (let f = 5024; f <= 5146; f++) {
    const s = d.shotAt(f, (f + 0.25) / config.fps)
    const inv = s.camera.quaternion.clone().invert()
    const c = s.sun.dir.clone().applyQuaternion(inv)
    const t = Math.tan(s.camera.vfov / DEG / 2)
    ys.push(c.z < 0 ? (0.5 - c.y / -c.z / t * 0.5) * fmt.height : -99999)
    if (prev) { const dq = s.camera.quaternion.clone().multiply(prev.clone().invert()); const a = 2 * Math.atan2(Math.hypot(dq.x, dq.y, dq.z), Math.abs(dq.w)) * DEG; if (a > peak) { peak = a; peakF = f } }
    prev = s.camera.quaternion.clone()
  }
  const cross = (v: number): number => { for (let i = ys.length - 1; i > 0; i--) if (ys[i - 1]! < v || ys[i-1] === -99999) return 5024 + i; return 5024 }
  console.log(label + ' sun y reaches -400 at ' + cross(-400) + ', -30 at ' + cross(-30) + ', 330 at ' + cross(330) + '; frames -30 to 330: ' + (cross(330) - cross(-30)) + '; peak turn ' + peak.toFixed(2) + ' at ' + peakF)
}
run('now')
for (const turn of [0.2, 0.35, 0.5]) for (const aim of [0.1, 0.3, 0.5]) for (const phase of [0.25, 0.4, 0.5]) { G.turn = turn; G.aim = aim; G.phase = phase; run('turn ' + turn + ' aim ' + aim + ' phase ' + phase) }
