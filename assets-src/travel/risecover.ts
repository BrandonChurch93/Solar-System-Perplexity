import { config } from '../../src/config'
import { coverWindow } from '../../src/director/timeline'

for (const s of config.segments) {
  if (s.kind !== 'rise') continue
  const w = coverWindow(s)
  console.log(s.id, s.firstFrame, s.endFrame, s.frames, w ? `cover ${w.firstFrame} ${w.centerFrame} ${w.lastFrame}` : 'no cover')
}
