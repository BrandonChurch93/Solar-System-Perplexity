import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { args, loadConfig, ROOT } from './lib/common'

const cfg = loadConfig()
const a = args()
if (a.stop && cfg.stopIds.includes(a.stop) === false) throw new Error('unknown stop ' + a.stop)
const tier = a.tier ?? 'review'
const out = join(ROOT, 'out/stills/status')
mkdirSync(out, { recursive: true })

function run(script: string, argv: string[]): string[] {
  const r = spawnSync('npx', ['tsx', join('tools', script), ...argv], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) throw new Error(script + ' failed: ' + (r.stderr || r.stdout).slice(-600))
  return r.stdout.trim().split('\n').filter((l) => l.startsWith('/'))
}

function jpg(from: string, to: string): void {
  const limit = cfg.raw.critics.maxImageLongEdgePx
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', from, '-vf', 'scale=w=' + limit + ':h=' + limit + ':force_original_aspect_ratio=decrease', '-q:v', '2', to], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + r.stderr.slice(-400))
}

const made: string[] = []
if (a.stop) {
  for (const view of ['hold', 'terrain']) {
    const files = run('compare.ts', ['--stop', a.stop, '--view', view, '--tier', tier])
    const copy = files.find((f) => f.endsWith('-view.jpg')) ?? files[0]!
    const to = join(out, a.stop + '-' + view + '.jpg')
    copyFileSync(copy, to)
    made.push(to)
  }
  const sheet = run('sheet.ts', ['--segment', a.stop + '.dive', '--format', 'preview', '--tier', tier])[0]!
  const to = join(out, a.stop + '-dive.jpg')
  jpg(sheet, to)
  made.push(to)
} else {
  for (const [i, sheet] of run('sheet.ts', ['--film', '--format', 'preview', '--tier', tier]).entries()) {
    const to = join(out, 'film-' + String(i + 1).padStart(2, '0') + '.jpg')
    jpg(sheet, to)
    made.push(to)
  }
}
run('review.ts', [])
console.log(made.join('\n'))
