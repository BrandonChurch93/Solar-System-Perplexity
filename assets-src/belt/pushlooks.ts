import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { args } from '../../tools/lib/common'
import { LOOKS, pickLooks, readLooks } from '../../tools/lib/looks'

const ROOT = process.cwd()
const a = args()
const folder = 'belt'
const ref = 'refs/heads/agent/' + folder + '-looks'
const git = (argv: string[], env: Record<string, string> = {}): string => execFileSync('git', argv, { cwd: ROOT, env: { ...process.env, ...env }, maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim()
const tryGit = (argv: string[]): string | null => {
  const r = spawnSync('git', argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
  return r.status === 0 ? r.stdout.trim() : null
}
const chosen = pickLooks(readLooks(), Number(a.max ?? 8))
if (chosen.length === 0) {
  console.log('no looks yet')
  process.exit(0)
}
const tmp = mkdtempSync(join(tmpdir(), 'looks-'))
const env = { GIT_INDEX_FILE: join(tmp, 'index') }
const meta = { folder, pushed: new Date().toISOString(), head: tryGit(['rev-parse', 'HEAD']) ?? '', note: a.note ?? '', looks: chosen }
const metaFile = join(tmp, 'index.json')
writeFileSync(metaFile, JSON.stringify(meta, null, 1) + '\n')
const put = (file: string, path: string): void => {
  const blob = git(['hash-object', '-w', file])
  git(['update-index', '--add', '--cacheinfo', '100644,' + blob + ',' + path], env)
}
for (const l of chosen) put(join(LOOKS, l.file), 'looks/' + folder + '/' + l.file)
put(metaFile, 'looks/' + folder + '/index.json')
const tree = git(['write-tree'], env)
let parent: string | null = null
if (tryGit(['ls-remote', '--exit-code', 'origin', ref])) {
  tryGit(['fetch', '-q', '--depth', '1', 'origin', '+' + ref + ':refs/remotes/origin/agent/' + folder + '-looks'])
  parent = tryGit(['rev-parse', '--verify', '-q', 'refs/remotes/origin/agent/' + folder + '-looks'])
}
const who = { GIT_AUTHOR_NAME: tryGit(['config', 'user.name']) ?? 'Builder', GIT_AUTHOR_EMAIL: tryGit(['config', 'user.email']) ?? 'builder@localhost' }
const message = 'Looks ' + folder + ' ' + meta.pushed.slice(0, 16).replace('T', ' ') + ' UTC\n\n' + (meta.note ? meta.note + '\n\n' : '') + 'Co-authored-by: Perplexity <noreply@perplexity.ai>\n'
const commit = git(['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', message], { ...who, GIT_COMMITTER_NAME: who.GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL: who.GIT_AUTHOR_EMAIL })
let pushed = false
for (let i = 0; i < 3 && !pushed; i++) pushed = tryGit(['push', '-q', 'origin', commit + ':' + ref]) !== null
rmSync(tmp, { recursive: true, force: true })
if (!pushed) {
  console.error('push failed three times')
  process.exit(1)
}
console.log('pushed ' + chosen.length + ' looks to agent/' + folder + '-looks (' + commit.slice(0, 8) + ')')
for (const l of chosen) console.log('  ' + l.label)
