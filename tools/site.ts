import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { DIST, WORK, args, loadConfig } from './lib/common'

const cfg = loadConfig()
const a = args()
const limitMb = Number(a.limit ?? 480)
// --leave-out a.mp4,b.mp4: films the hosted page does not carry (the page says so). --pictures N: web copies of the pictures, at most N wide.
const leaveOut = (a['leave-out'] ?? '').split(',').filter((n) => n !== '' && n !== 'true')
const pictureWidth = Number(a.pictures ?? 0)
const site = join(WORK, 'site')
const cache = join(WORK, 'site-cache')
if (!existsSync(join(DIST, 'review.html'))) throw new Error('run npm run review first')
rmSync(site, { recursive: true, force: true })
mkdirSync(cache, { recursive: true })
const full = /\/assets\/(.+\/)?full(\/|$)/

function put(src: string, dest: string): void {
  rmSync(dest, { force: true })
  try {
    linkSync(src, dest)
  } catch {
    copyFileSync(src, dest)
  }
}

function tree(from: string, to: string): void {
  mkdirSync(to, { recursive: true })
  for (const e of readdirSync(from, { withFileTypes: true })) {
    const src = join(from, e.name)
    const rel = src.split('\\').join('/')
    if (full.test(rel)) continue
    if (e.isDirectory()) tree(src, join(to, e.name))
    else if (/\/review\/[^/]+\.mp4$/.test(rel)) continue
    else if (/\.(html|json)$/.test(e.name)) copyFileSync(src, join(to, e.name))
    else put(src, join(to, e.name))
  }
}
tree(DIST, site)
writeFileSync(join(site, 'site.json'), JSON.stringify({ sets: Object.keys(cfg.raw.assetSets).filter((s) => s !== 'full') }) + '\n')

interface Copy { name: string; src: string; key: string; made: string; stopVideo: boolean; shrink: boolean }
const copies: Copy[] = []

function probe(path: string, entries: string): string[] {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'csv=p=0', path], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error('ffprobe failed for ' + path)
  return r.stdout.trim().split(/[,\n]/).map((v) => v.trim()).filter((v) => v !== '')
}

function ffmpeg(list: string[], name: string): void {
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...list], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('encode failed for ' + name)
}

function small(name: string): void {
  const src = join(DIST, 'review', name)
  // The finished film was made at its hosted size by the review tool and keeps its sound.
  if (name.startsWith('film-')) return put(src, join(site, 'review', name))
  const st = statSync(src)
  const base = name.replace('.mp4', '')
  const stopVideo = cfg.stopIds.includes(base.replace(/^post-/, ''))
  const key = base + '-' + st.size + '-' + createHash('sha256').update(readFileSync(src)).digest('hex').slice(0, 12)
  const made = join(cache, key + '.mp4')
  for (const f of readdirSync(cache)) if (f.startsWith(base + '-') && f.startsWith(key) === false) rmSync(join(cache, f))
  if (!existsSync(made)) {
    const rate = stopVideo ? ['-vf', 'scale=1280:-2', '-crf', '24', '-maxrate', '2800k', '-bufsize', '5600k'] : ['-vf', 'scale=960:-2', '-crf', '27', '-maxrate', '1200k', '-bufsize', '2400k']
    ffmpeg(['-i', src, ...rate, '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', made + '.tmp.mp4'], name)
    spawnSync('mv', [made + '.tmp.mp4', made])
  }
  if (statSync(made).size < st.size) {
    put(made, join(site, 'review', name))
    copies.push({ name, src, key, made, stopVideo, shrink: stopVideo || base === 'roughcut' })
  } else put(src, join(site, 'review', name))
}

function fit(c: Copy, bytes: number): void {
  const seconds = Number(probe(c.made, 'format=duration')[0])
  const kbps = Math.floor((bytes * 8) / seconds / 1000)
  if (!(kbps >= 150)) throw new Error('the site folder cannot be brought under the limit: ' + c.name + ' would get ' + kbps + ' kbit/s')
  const made = join(cache, c.key + '-b' + kbps + '.mp4')
  if (!existsSync(made)) {
    const log = join(cache, c.key + '-pass')
    const common = ['-i', c.src, '-vf', 'scale=' + (c.stopVideo ? '1280' : '960') + ':-2', '-c:v', 'libx264', '-preset', 'slow', '-b:v', kbps + 'k', '-maxrate', Math.round(kbps * 1.6) + 'k', '-bufsize', kbps * 3 + 'k', '-pix_fmt', 'yuv420p', '-an', '-passlogfile', log]
    ffmpeg([...common, '-pass', '1', '-f', 'null', '/dev/null'], c.name)
    ffmpeg([...common, '-pass', '2', '-movflags', '+faststart', made + '.tmp.mp4'], c.name)
    spawnSync('mv', [made + '.tmp.mp4', made])
    for (const f of readdirSync(cache)) if (f.startsWith(c.key + '-pass')) rmSync(join(cache, f))
  }
  put(made, join(site, 'review', c.name))
  c.made = made
}

for (const f of readdirSync(join(DIST, 'review')).sort()) if (f.endsWith('.mp4') && leaveOut.includes(f) === false) small(f)

// Web copies of the review pictures, when asked for: JPEG, at most pictureWidth wide. A copy is used where it saves 15 percent or more.
let webCopies = 0
if (pictureWidth > 0) {
  for (const f of readdirSync(join(DIST, 'review')).sort()) {
    if (!/\.jpe?g$/i.test(f)) continue
    const src = join(DIST, 'review', f)
    const st = statSync(src)
    const made = join(cache, 'pic-' + f.replace(/\.jpe?g$/i, '') + '-' + st.size + '-w' + pictureWidth + '.jpg')
    if (!existsSync(made)) {
      ffmpeg(['-i', src, '-vf', "scale='min(" + pictureWidth + ",iw)':-2", '-frames:v', '1', '-update', '1', '-q:v', '4', '-pix_fmt', 'yuvj420p', made + '.tmp.jpg'], f)
      spawnSync('mv', [made + '.tmp.jpg', made])
    }
    if (statSync(made).size <= st.size * 0.85) {
      put(made, join(site, 'review', f))
      webCopies++
    }
  }
}

function size(dir: string): number {
  let n = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) n += e.isDirectory() ? size(join(dir, e.name)) : statSync(join(dir, e.name)).size
  return n
}
const limit = limitMb * 1e6
let fitted = 0
for (let pass = 0; pass < 2 && size(site) > limit; pass++) {
  const list = copies.filter((c) => c.shrink)
  const now = list.reduce((n, c) => n + statSync(join(site, 'review', c.name)).size, 0)
  const budget = limit - (size(site) - now) - 1.5e6
  const factor = budget / now
  if (!(factor > 0)) throw new Error('the site folder is over the limit without its videos')
  for (const c of list) fit(c, statSync(join(site, 'review', c.name)).size * factor * 0.985)
  fitted = factor
}

const page = join(site, 'review.html')
let html = readFileSync(page, 'utf8')
const where = (c: Copy): string => (c.name.startsWith('post-') ? 'out/posts' : c.stopVideo ? 'out/clips' : 'out')
for (const c of copies) {
  const tag = 'src="review/' + c.name + '"></video>'
  const at = html.indexOf(tag)
  if (at < 0 || html.startsWith('<p class="note">', at + tag.length)) continue
  const [w, h] = probe(c.made, 'stream=width,height')
  const note = '<p class="note">A smaller copy, ' + w + ' x ' + h + ', because the host limits the size of the site. The file at full size is in the repo under ' + where(c) + '.</p>'
  html = html.slice(0, at + tag.length) + note + html.slice(at + tag.length)
}
for (const n of leaveOut) {
  const tag = 'src="review/' + n + '"></video>'
  const end = html.indexOf(tag)
  const start = end < 0 ? -1 : html.lastIndexOf('<video', end)
  if (start < 0) continue
  html = html.slice(0, start) + '<p class="note">Left out of this hosted page because the host limits the size of the site. It is in the repo under out/' + n + '.</p>' + html.slice(end + tag.length)
}
if (leaveOut.includes('preview.mp4')) html = html.replace(', then the preview film', '')
if (webCopies > 0) html = html.replace('</header>', '<p>The pictures on this hosted page are web copies, at most ' + pictureWidth + ' wide, because the host limits the size of the site. The pictures at full size are in the repo under out/stills.</p>\n</header>')
writeFileSync(page, html)

const parts = readdirSync(site, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name + ' ' + (size(join(site, e.name)) / 1e6).toFixed(0))
const total = size(site) / 1e6
console.log('site: ' + site + ', ' + total.toFixed(0) + ' MB (' + parts.join(', ') + '), limit ' + limitMb + (fitted ? ', the posts, clips and rough cut encoded at ' + fitted.toFixed(2) + ' of their first size to fit' : '') + ', ' + copies.length + ' smaller copies noted on the page' + (webCopies ? ', ' + webCopies + ' pictures as web copies' : '') + (leaveOut.length ? ', left out: ' + leaveOut.join(' ') : ''))
if (total > limitMb) { console.error('the site folder is over the limit'); process.exit(1) }
