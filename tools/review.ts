import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { DIST, ROOT, ensureBuild, loadConfig } from './lib/common'

const cfg = loadConfig()
ensureBuild()
const out = join(DIST, 'review')
mkdirSync(out, { recursive: true })
const maxMb = Number(process.env.REVIEW_MAX_FILE_MB ?? cfg.raw.repo.maxFileMb)

interface Item { file: string; title: string; kind: 'video' | 'image'; time: number; mb: number; left: boolean }
const items: Item[] = []

function add(path: string, title: string, prefix = ''): void {
  if (!existsSync(path)) return
  const st = statSync(path)
  const ext = extname(path).toLowerCase()
  const kind = ext === '.mp4' ? 'video' : 'image'
  const mb = st.size / 1e6
  const left = mb > maxMb
  const name = prefix + basename(path)
  if (!left) copyFileSync(path, join(out, name))
  items.push({ file: name, title, kind, time: st.mtimeMs, mb, left })
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
const body = items
  .map((i) => {
    if (i.left) return '<section><h2>' + esc(i.title) + '</h2><p class="note">Left out of this page because the host does not accept a file of ' + i.mb.toFixed(0) + ' MB. It is in the repo under out/clips.</p></section>'
    const media = i.kind === 'video' ? '<video controls playsinline preload="metadata" src="review/' + i.file + '"></video>' : '<a href="review/' + i.file + '"><img loading="lazy" src="review/' + i.file + '" alt="' + esc(i.title) + '" /></a>'
    return '<section><h2>' + esc(i.title) + '</h2>' + media + '</section>'
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
<p><a href="./">Open the app</a></p>
</header>
<main>
${body || '<p>Nothing to review yet.</p>'}
</main>
</body>
</html>
`
writeFileSync(join(DIST, 'review.html'), html)
console.log('review page: ' + items.length + ' items, ' + items.filter((i) => i.left).length + ' left out')
