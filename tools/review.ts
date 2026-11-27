import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { DIST, ROOT, WORK, args, ensureBuild, loadConfig } from './lib/common'
import { FFMPEG, encodeOnePass, rateFor, yuvScaleFilter } from './lib/encode'

const cfg = loadConfig()
if (process.argv.includes('--no-build') === false) ensureBuild()
const out = join(DIST, 'review')
mkdirSync(out, { recursive: true })
const maxMb = Number(process.env.REVIEW_MAX_FILE_MB ?? cfg.raw.repo.maxFileMb)

interface Item { file: string; title: string; kind: 'video' | 'image'; time: number; mb: number; left: boolean; note?: string }
const items: Item[] = []

function place(src: string, dest: string): void {
  rmSync(dest, { force: true })
  try {
    linkSync(src, dest)
  } catch {
    copyFileSync(src, dest)
  }
}

function add(path: string, title: string, prefix = ''): void {
  if (!existsSync(path)) return
  const st = statSync(path)
  const ext = extname(path).toLowerCase()
  const kind = ext === '.mp4' ? 'video' : 'image'
  const mb = st.size / 1e6
  const left = mb > maxMb
  const name = prefix + basename(path)
  if (!left) place(path, join(out, name))
  items.push({ file: name, title, kind, time: st.mtimeMs, mb, left })
}

const posts: Item[] = []
const small = cfg.formats[cfg.formatKeys.preview]
if (small === undefined) throw new Error('no preview format in the config')
for (const stop of cfg.stopIds) {
  const path = ['out/work/posts', 'out/posts'].map((d) => join(ROOT, d, stop + '.mp4')).find((p) => existsSync(p))
  if (path === undefined) continue
  const at = items.length
  add(path, 'Post: ' + stop, 'post-')
  const item = items[at]
  if (item === undefined) continue
  if (item.left) {
    const copy = join(out, item.file)
    rmSync(copy, { force: true })
    encodeOnePass(path, copy, { fps: cfg.fps, rate: rateFor(cfg, cfg.formatKeys.preview), filter: yuvScaleFilter(small.width, small.height) })
    const mb = statSync(copy).size / 1e6
    item.left = mb > maxMb
    if (item.left) rmSync(copy)
    else item.note = 'A smaller copy, ' + small.width + ' x ' + small.height + ', because the host does not accept a file of ' + item.mb.toFixed(0) + ' MB. The post at full size is in the repo under out/posts.'
  }
  posts.push(item)
}
// The finished film, with its sound and its subtitles, leads the page. The file is larger than the repo allows, so it is
// not in the repo: its path is given with --film or REVIEW_FILM. Without a path the page is built without it.
const finals: Item[] = []
const filmSrc = args().film ?? process.env.REVIEW_FILM
if (filmSrc !== undefined && filmSrc !== '' && filmSrc !== 'true') {
  if (!existsSync(filmSrc)) throw new Error('the film given with --film is not there: ' + filmSrc)
  const st = statSync(filmSrc)
  const mb = st.size / 1e6
  const item: Item = { file: 'film-final.mp4', title: 'The film, with sound and subtitles', kind: 'video', time: st.mtimeMs, mb, left: false }
  const copy = join(out, item.file)
  if (mb > maxMb) {
    const cache = join(WORK, 'site-cache')
    mkdirSync(cache, { recursive: true })
    const made = join(cache, 'film-final-' + st.size + '-' + Math.round(st.mtimeMs) + '.mp4')
    if (!existsSync(made)) {
      const tmp = made + '.tmp.mp4'
      const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-i', filmSrc, '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '2000k', '-bufsize', '4000k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', tmp], { stdio: 'inherit' })
      if (r.status !== 0) throw new Error('the smaller copy of the film could not be made')
      spawnSync('mv', [tmp, made])
    }
    place(made, copy)
    item.left = statSync(copy).size / 1e6 > maxMb
    if (item.left) rmSync(copy)
    else item.note = 'A smaller copy, 1280 wide, with its sound, because the host does not accept a file of ' + mb.toFixed(0) + ' MB. The film at full size is too large for the repo as well; it is delivered with the build.'
  } else place(filmSrc, copy)
  items.push(item)
  finals.push(item)
}
add(join(ROOT, 'out/roughcut.mp4'), 'Rough cut, made from the approved stills')
add(join(ROOT, 'out/preview.mp4'), 'Preview film')
const seen = new Set<string>()
for (const dir of ['out/work/clips', 'out/clips']) {
  const d = join(ROOT, dir)
  if (!existsSync(d)) continue
  for (const f of readdirSync(d).sort()) {
    if (extname(f) !== '.mp4' || seen.has(f)) continue
    seen.add(f)
    add(join(d, f), 'Clip: ' + basename(f, '.mp4'))
  }
}
for (const [dir, label] of [['out/stills', ''], ['out/stills/status', 'Status: ']] as const) {
  const stills = join(ROOT, dir)
  if (!existsSync(stills)) continue
  for (const f of readdirSync(stills).sort()) {
    const ext = extname(f).toLowerCase()
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.webp') continue
    add(join(stills, f), label + basename(f, ext).split('-').join(' '), label ? 'status-' : '')
  }
}
items.sort((x, y) => y.time - x.time)

const progress = readFileSync(join(ROOT, 'kit/PROGRESS.md'), 'utf8')
const phase = /- Current phase: (.*)/.exec(progress)?.[1] ?? ''
const stop = /- Current stop: (.*)/.exec(progress)?.[1] ?? ''
const date = process.env.REVIEW_DATE ?? new Date().toISOString().slice(0, 10)
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const named = (names: string[]): Item[] => names.map((n) => items.find((i) => i.file === n)).filter((i): i is Item => !!i)
const film = named(['preview.mp4'])
const clips = named(cfg.stopIds.map((s) => s + '.mp4'))
const compares = named(cfg.stopIds.flatMap((s) => ['compare-' + s + '-hold.jpg', 'compare-' + s + '-terrain.jpg']))
const lead = [...finals, ...posts, ...film, ...clips, ...compares]
const ordered = [...lead, ...items.filter((i) => lead.includes(i) === false)]
const groups = [finals.length ? 'the film with its sound and subtitles' : '', posts.length ? 'the ' + posts.length + ' posts' : '', film.length ? 'the preview film' : '', clips.length ? 'the ' + clips.length + ' clips' : '', compares.length ? 'the comparison images (hold, then terrain)' : ''].filter((g) => g !== '')
const body = ordered
  .map((i) => {
    if (i.left) return '<section><h2>' + esc(i.title) + '</h2><p class="note">Left out of this page because the host does not accept a file of ' + i.mb.toFixed(0) + ' MB. ' + (finals.includes(i) ? 'It is delivered with the build' : 'It is in the repo under ' + (posts.includes(i) ? 'out/posts' : 'out/clips')) + '.</p></section>'
    const still = i.kind === 'video' ? items.find((x) => x.kind === 'image' && !x.left && new RegExp('^f\\d+-' + basename(i.file, '.mp4') + '\\.hold\\.jpg$').test(x.file)) : undefined
    const media = i.kind === 'video' ? '<video controls playsinline preload="metadata"' + (still ? ' poster="review/' + still.file + '"' : '') + ' src="review/' + i.file + '"></video>' : '<a href="review/' + i.file + '"><img loading="lazy" src="review/' + i.file + '" alt="' + esc(i.title) + '" /></a>'
    return '<section><h2>' + esc(i.title) + '</h2>' + media + (i.note ? '<p class="note">' + esc(i.note) + '</p>' : '') + '</section>'
  })
  .join('\n')
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Grand Tour review</title>
<link rel="icon" href="data:," />
<style>
:root { color-scheme: dark; }
body { margin: 0; background: #0c0d10; color: #e8e6e1; font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
header { padding: 28px 20px 8px; max-width: 1280px; margin: 0 auto; }
h1 { font-size: 22px; font-weight: 600; margin: 0 0 6px; letter-spacing: 0.01em; }
p { margin: 0; color: #a9a59c; }
a { color: #d9b98a; }
main { max-width: 1280px; margin: 0 auto; padding: 8px 20px 60px; }
section { margin: 28px 0; }
h2 { font-size: 15px; font-weight: 600; margin: 0 0 10px; color: #cfcbc2; text-transform: capitalize; }
video, img { display: block; width: 100%; height: auto; background: #050506; border-radius: 6px; }
.note { font-size: 14px; }
</style>
</head>
<body>
<header>
<h1>Grand Tour review</h1>
<p>${esc(date)} · Phase ${esc(phase)}${stop && stop !== 'none' ? ' · Stop ' + esc(stop) : ''}</p>
<p><a href="./">Open the app</a>${groups.length ? ' · First ' + groups.join(', then ') + ', with the stops in the order of the film. Then everything else, newest first.' : ''}</p>
</header>
<main>
${body || '<p>Nothing to review yet.</p>'}
</main>
</body>
</html>
`
writeFileSync(join(DIST, 'review.html'), html)
console.log('review page: ' + items.length + ' items, ' + items.filter((i) => i.left).length + ' left out')
