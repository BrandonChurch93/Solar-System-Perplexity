import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { args } from './lib/common'
import { addLook, LOOKS, looksConfig, pickLooks as pick, readLooks, type Look } from './lib/looks'

const ROOT = process.cwd()
const a = args()
const cfg = looksConfig()
const git = (argv: string[], env: Record<string, string> = {}, input?: string | Buffer): string => execFileSync('git', argv, { cwd: ROOT, env: { ...process.env, ...env }, input, maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim()
const tryGit = (argv: string[]): string | null => {
  const r = spawnSync('git', argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
  return r.status === 0 ? r.stdout.trim() : null
}
const branch = (folder: string): string => 'agent/' + folder + '-looks'
const age = (time: string): string => Math.round((Date.now() - Date.parse(time)) / 60000) + ' min ago'

if (a.add) {
  if (!existsSync(a.add)) throw new Error('no file ' + a.add)
  const look = addLook({ file: a.add }, { kind: 'note', label: a.label ?? a.add, stop: a.stop })
  console.log(look ? 'look added: ' + look.label : 'the file could not be read as a picture')
} else if (a.push) {
  const folder = a.folder
  if (!folder || /^[a-z][a-z0-9-]*$/.test(folder) === false) throw new Error('expected --folder NAME')
  const max = Number(a.max ?? 8)
  const chosen = pick(readLooks().filter((l) => !l.stop || l.stop === folder), max, folder)
  if (chosen.length === 0) {
    console.log('no looks yet: render a still, a comparison or a sheet first, or add a picture with --add')
    process.exit(0)
  }
  const tmp = mkdtempSync(join(tmpdir(), 'looks-'))
  const index = join(tmp, 'index')
  const env = { GIT_INDEX_FILE: index }
  const head = tryGit(['rev-parse', 'HEAD']) ?? ''
  const meta = { folder, pushed: new Date().toISOString(), head, note: a.note ?? '', looks: chosen }
  const metaFile = join(tmp, 'index.json')
  writeFileSync(metaFile, JSON.stringify(meta, null, 1) + '\n')
  const put = (file: string, path: string): void => {
    const blob = git(['hash-object', '-w', file])
    git(['update-index', '--add', '--cacheinfo', '100644,' + blob + ',' + path], env)
  }
  for (const l of chosen) put(join(LOOKS, l.file), 'looks/' + folder + '/' + l.file)
  put(metaFile, 'looks/' + folder + '/index.json')
  const tree = git(['write-tree'], env)
  const ref = 'refs/heads/' + branch(folder)
  let parent: string | null = null
  if (tryGit(['ls-remote', '--exit-code', 'origin', ref])) {
    tryGit(['fetch', '-q', '--depth', '1', 'origin', '+' + ref + ':refs/remotes/origin/' + branch(folder)])
    parent = tryGit(['rev-parse', '--verify', '-q', 'refs/remotes/origin/' + branch(folder)])
  }
  const who = { GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? tryGit(['config', 'user.name']) ?? 'Builder', GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL ?? tryGit(['config', 'user.email']) ?? 'builder@localhost' }
  const message = 'Looks ' + folder + ' ' + meta.pushed.slice(0, 16).replace('T', ' ') + ' UTC\n\nCo-authored-by: Perplexity <noreply@perplexity.ai>\n'
  const commit = git(['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', message], { ...who, GIT_COMMITTER_NAME: who.GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL: who.GIT_AUTHOR_EMAIL })
  let pushed = false
  for (let i = 0; i < 3 && !pushed; i++) pushed = tryGit(['push', '-q', 'origin', commit + ':' + ref]) !== null
  rmSync(tmp, { recursive: true, force: true })
  if (!pushed) {
    console.error('push of ' + branch(folder) + ' failed three times')
    process.exit(1)
  }
  console.log('pushed ' + chosen.length + ' looks to ' + branch(folder) + ' (' + commit.slice(0, 8) + '):')
  for (const l of chosen) console.log('  ' + age(l.time) + '  ' + l.label)
} else if (a.fetch) {
  const folders = a.folders ? a.folders.split(',') : [...cfg.stops, 'belt']
  for (const folder of folders) {
    const remote = 'refs/remotes/origin/' + branch(folder)
    if (tryGit(['fetch', '-q', '--depth', '1', 'origin', '+refs/heads/' + branch(folder) + ':' + remote]) === null) continue
    const text = tryGit(['show', remote + ':looks/' + folder + '/index.json'])
    if (!text) continue
    const meta = JSON.parse(text) as { pushed: string; head: string; note: string; looks: Look[] }
    const dir = join(LOOKS, 'remote', folder)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    for (const l of meta.looks) writeFileSync(join(dir, l.file), execFileSync('git', ['cat-file', 'blob', remote + ':looks/' + folder + '/' + l.file], { cwd: ROOT, maxBuffer: 1 << 28 }))
    writeFileSync(join(dir, 'index.json'), text + '\n')
    writeFileSync(join(dir, 'log.jsonl'), meta.looks.map((l) => JSON.stringify({ ...l, from: 'agent/' + folder })).join('\n') + '\n')
    const newest = meta.looks[0]
    console.log(folder + ': ' + meta.looks.length + ' looks, pushed ' + age(meta.pushed) + ', code at ' + meta.head.slice(0, 8) + (meta.note ? ', note: ' + meta.note : '') + (newest ? ', newest (' + age(newest.time) + '): ' + newest.label : ''))
  }
} else {
  const all = readLooks()
  for (const l of all.slice(0, Number(a.max ?? 20))) console.log(age(l.time).padStart(12) + '  ' + l.kind.padEnd(8) + l.label + '  ' + join('out/work/looks', l.file))
  if (all.length === 0) console.log('no looks yet')
}
