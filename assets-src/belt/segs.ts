import { config } from '../../src/config'

for (const f of process.argv.slice(2).map(Number)) {
  const s = config.segments.find((x) => f >= x.firstFrame && f < x.endFrame)
  console.log(f, s ? s.id + ' ' + s.firstFrame + ' to ' + (s.endFrame - 1) : 'none')
}
