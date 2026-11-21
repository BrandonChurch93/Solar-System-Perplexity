import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { DIST, WORK, args, loadConfig } from './lib/common'

const cfg = loadConfig()
const a = args()
const limitMb = Number(a.limit ?? 480)
const site = join(WORK, 'site')
const cache = join(WORK, 'site-cache')
if (!existsSync(join(DIST, 'review.html'))) throw new Error('run npm run review first')
rmSync(site, { recursive: true, force: true })
mkdirSync(cache, { recursive: true })
const full = new RegExp('/assets/(' + cfg.stopIds.join('|') + ')/full(/|$)')
cpSync(DIST, site, { recursive: true, filter: (src) => full.test(src.split('\\').join('/')) === false })

function small(name: string): void {
  const src = join(DIST, 'review', name)
  const st = statSync(src)
  const clip = cfg.stopIds.includes(name.replace('.mp4', ''))
  const key = name.replace('.mp4', '') + '-' + st.size + '-' + Math.round(st.mtimeMs) + '.mp4'
  const made = join(cache, key)
  if (!existsSync(made)) {
    for (const f of readdirSync(cache)) if (f.startsWith(name.replace('.mp4', '') + '-')) rmSync(join(cache, f))
    const rate = clip ? ['-vf', 'scale=1280:-2', '-crf', '24', '-maxrate', '2800k', '-bufsize', '5600k'] : ['-vf', 'scale=960:-2', '-crf', '27', '-maxrate', '1200k', '-bufsize', '2400k']
    const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', src, ...rate, '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', made + '.tmp.mp4'], { stdio: 'inherit' })
    if (r.status !== 0) throw new Error('encode failed for ' + name)
    spawnSync('mv', [made + '.tmp.mp4', made])
  }
  if (statSync(made).size < st.size) cpSync(made, join(site, 'review', name))
}

for (const f of readdirSync(join(DIST, 'review'))) if (f.endsWith('.mp4')) small(f)

function size(dir: string): number {
  let n = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) n += e.isDirectory() ? size(join(dir, e.name)) : statSync(join(dir, e.name)).size
  return n
}
const parts = readdirSync(site, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name + ' ' + (size(join(site, e.name)) / 1e6).toFixed(0))
const total = size(site) / 1e6
console.log('site: ' + site + ', ' + total.toFixed(0) + ' MB (' + parts.join(', ') + '), limit ' + limitMb)
if (total > limitMb) { console.error('the site folder is over the limit'); process.exit(1) }
