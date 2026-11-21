import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import { coverWindow } from '../../../src/director/timeline'

for (const seg of config.segments.filter((s) => s.stop === 'venus' && (s.kind === 'dive' || s.kind === 'rise'))) {
  const w = coverWindow(seg)!
  for (let f = w.firstFrame - 22; f <= w.lastFrame + 10; f++) {
    const t = (f + 0.25) / config.fps
    const shot = seg.kind === 'dive' ? plan.dive(t) : plan.rise(t)
    const h = plan.horizon(shot.view, shot.pose)
    const th = Math.tan(THREE.MathUtils.degToRad(shot.pose.vfov) / 2)
    const angle = THREE.MathUtils.radToDeg(Math.atan2(h.normal[0], h.normal[1]))
    const alt = shot.view === 'orbit' ? (shot.pose.position.length() - 1).toFixed(3) : shot.pose.position.y.toFixed(3)
    console.log(seg.kind, f, shot.view, 'alt', alt, 'vfov', shot.pose.vfov.toFixed(1), 'tilt deg', angle.toFixed(1), 'height in frame (0 centre, 1 top)', (-h.offset / th).toFixed(3), 'amount', plan.coverAmount(seg, t).toFixed(2), 'side', plan.coverSide(seg, t).toFixed(2), 'shell', (shot.view === 'orbit' ? plan.p.coverShell : plan.p.coverSea?.edge ?? []).map((v) => v.toFixed(3)).join(' '))
  }
}
