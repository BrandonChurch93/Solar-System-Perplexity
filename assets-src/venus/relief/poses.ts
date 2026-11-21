import { writeFileSync } from 'node:fs'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'

const frames = process.argv.slice(2).map(Number)
const out: Record<string, unknown> = {}
for (const f of frames) {
  const time = (f + 0.5) / config.fps
  const seg = config.segments.find((s) => s.stop === 'venus' && f >= s.firstFrame && f < s.endFrame)!
  let pose
  let view = 'terrain'
  if (seg.kind === 'dive') { const s = plan.dive(time); pose = s.pose; view = s.view }
  else if (seg.kind === 'rise') { const s = plan.rise(time); pose = s.pose; view = s.view }
  else pose = plan.terrain(time - seg.start)
  out[f] = { kind: seg.kind, view, position: pose.position.toArray(), quaternion: pose.quaternion.toArray(), vfov: pose.vfov }
}
writeFileSync('out/work/venus/relief/poses.json', JSON.stringify(out, null, 1))
console.log(JSON.stringify(out))
