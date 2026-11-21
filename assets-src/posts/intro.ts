import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROOT, WORK, args, loadConfig, machineId, writeRecord } from '../../tools/lib/common'
import { decodeFramePng, encodeTwoPass, openIntermediate, probeVideo, psnrPng, rateFor, rgbToYuvFilter, tempDir, x264Args } from '../../tools/lib/encode'
import { POSTS, introFile, postsConfig, sha256, streamInfo, type Box } from '../../tools/post'

interface Inputs { skill: string; skillFolder: string; preset: string; cps: number; hold: number; logicalWidth: number; promptBox: Box }
interface State { t: number; composer: { typedText: string; complete: boolean; illustrativeSubmit: boolean; sendPressed: boolean; textBoundsFit: boolean; actualGenerationSubmitted: boolean } }
interface Manifest { width: number; height: number; fps: number; frameCount: number; duration: number; params: Record<string, unknown>; timeline: Record<string, number>; states: State[]; sourceHashes: Record<string, string>; rendererSha256: string; runtime: string }

const here = dirname(fileURLToPath(import.meta.url))
const inputs = JSON.parse(readFileSync(join(here, 'inputs.json'), 'utf8')) as Inputs
const cfg = loadConfig()
const posts = postsConfig(cfg)
const a = args()
if (a.stop && !cfg.stopIds.includes(a.stop)) throw new Error('--stop must be one of ' + cfg.stopIds.join(', '))
const skillDir = (a['skill-dir'] ?? inputs.skillFolder).replace(/^~/, homedir())
const renderer = join(skillDir, 'scripts/render.mjs')
if (!existsSync(renderer)) throw new Error('the skill ' + inputs.skill + ' is not at ' + skillDir + '. Load it with the skill loader first, or pass --skill-dir')
const master = cfg.formats[cfg.formatKeys.master]!
const fps = cfg.fps
const dpr = master.width / inputs.logicalWidth
const required = ['readiness', 'fontLoaded', 'seekDeterminism', 'fixedFraming', 'composerTextBounds', 'firstFrameVisible', 'noRuntimeErrors', 'typingMonotonic', 'finalTextExact']

function skill(prompt: string, out: string, hold: number, extra: string[]): string[] {
  rmSync(out, { recursive: true, force: true })
  const argv = ['--q', prompt, '--out', out, '--preset', inputs.preset, '--cps', String(inputs.cps), '--hold', String(hold), '--dpr', String(dpr), '--fps', String(fps), ...extra]
  const r = spawnSync('node', [renderer, ...argv], { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) throw new Error('the skill failed: ' + (r.stderr ?? '').slice(-600))
  return argv
}

function manifest(dir: string): Manifest {
  return JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as Manifest
}

async function make(stop: string): Promise<void> {
  const prompt = posts.prompts[stop]!
  const dir = join(POSTS, 'render', stop)
  skill(prompt, join(dir, 'timing'), inputs.hold, ['--times', '0'])
  const send = manifest(join(dir, 'timing')).timeline.send!
  const hold = Math.floor((inputs.hold + Math.ceil(send * fps - 1e-6) / fps - send) * 1e4) / 1e4
  const full = join(dir, 'full')
  const argv = skill(prompt, full, hold, ['--no-video', '1'])
  const m = manifest(full)
  const checks = JSON.parse(readFileSync(join(full, 'checks.json'), 'utf8')) as Record<string, unknown>
  const bad = [...required.filter((k) => checks[k] !== true), ...(checks.completeHoldOk === true ? [] : ['completeHoldOk'])]
  if (bad.length) throw new Error('the skill reports failed checks: ' + bad.join(', '))
  if (m.width !== master.width || m.height !== master.height || m.fps !== fps) throw new Error('the skill rendered ' + m.width + ' x ' + m.height + ' at ' + m.fps + ' fps')
  const typed = m.states.map((s) => s.composer.typedText)
  const submit = m.states.findIndex((s) => s.composer.illustrativeSubmit)
  const lastKey = m.states.findIndex((s) => s.composer.complete)
  const keys = Array.from(prompt, (_, i) => typed.findIndex((t) => t.length > i))
  if (submit < 0 || lastKey < 0 || keys.some((k) => k < 0)) throw new Error('the render never reaches the full prompt or the submit')
  if (typed[submit] !== prompt || m.states.some((s) => !prompt.startsWith(s.composer.typedText) || !s.composer.textBoundsFit || s.composer.actualGenerationSubmitted)) throw new Error('the typed text is not the config string at every frame')
  for (let i = 1; i <= submit; i++) if (typed[i]!.length - typed[i - 1]!.length > 1) throw new Error('frame ' + i + ' adds more than one character')
  const frames = submit + 1
  const holdSeconds = (submit - lastKey) / fps
  const late = m.states[submit]!.t - m.timeline.send!
  if (frames / fps > posts.introMaxSeconds + 1e-9) throw new Error('the intro is ' + (frames / fps).toFixed(3) + ' s, over posts.introMaxSeconds')
  if (holdSeconds < posts.readHoldSeconds - 1e-9) throw new Error('the full prompt is held ' + holdSeconds.toFixed(3) + ' s, under posts.readHoldSeconds')
  if (!m.states[submit]!.composer.sendPressed || late < 0 || late > 0.002) throw new Error('the submit does not land on a frame (' + late.toFixed(4) + ' s late)')

  const png = (n: number): string => join(full, 'frames', String(n).padStart(5, '0') + '.png')
  const tmp = join(tempDir(WORK, 'post'), 'intro-' + stop + '.mkv')
  const it = openIntermediate(tmp, m.width, m.height, fps, 'png')
  for (let n = 0; n < frames; n++) await it.write(readFileSync(png(n)))
  await it.end()
  const out = introFile(stop)
  const rate = rateFor(cfg, cfg.formatKeys.master)
  encodeTwoPass(tmp, out, { fps, rate, filter: rgbToYuvFilter(), faststart: true, passlog: join(tempDir(WORK, 'post'), 'intro-' + stop + '.pass') })
  rmSync(tmp, { force: true })
  const p = probeVideo(out)
  const s = streamInfo(out)
  if (!p || p.frames !== frames || p.width !== master.width || p.height !== master.height || p.fps !== fps + '/1' || p.codec !== 'h264' || p.pixFmt !== 'yuv420p' || s.audioStreams !== 0) throw new Error('the encoded intro is not ' + frames + ' frames of the master format')
  const shots = join(dir, 'shots')
  mkdirSync(shots, { recursive: true })
  copyFileSync(png(submit - 1), join(shots, 'before-submit.png'))
  copyFileSync(png(submit), join(shots, 'submit.png'))
  decodeFramePng(out, submit, join(shots, 'submit-decoded.png'))
  decodeFramePng(out, submit - 1, join(shots, 'before-submit-decoded.png'))
  const psnr = [psnrPng(join(shots, 'before-submit-decoded.png'), png(submit - 1)), psnrPng(join(shots, 'submit-decoded.png'), png(submit))].map((v) => Number(v.toFixed(2)))
  rmSync(join(full, 'frames'), { recursive: true, force: true })
  rmSync(join(dir, 'timing', 'frames'), { recursive: true, force: true })
  const round = (v: number): number => Number(v.toFixed(4))
  writeRecord(out, {
    engineHash: '',
    stopHashes: {},
    format: cfg.formatKeys.master,
    tier: 'intro',
    assets: 'none',
    diag: 'beauty',
    browser: m.runtime,
    machine: machineId(),
    extra: {
      kind: 'intro',
      stop,
      prompt,
      frames,
      fps,
      durationSeconds: round(frames / fps),
      firstKeySeconds: round(keys[0]! / fps),
      lastKeySeconds: round(lastKey / fps),
      submitSeconds: round(submit / fps),
      holdBeforeSubmitSeconds: round(holdSeconds),
      keySeconds: keys.map((k) => round(k / fps)),
      sha256: sha256(out),
      skill: inputs.skill,
      inputs: { q: prompt, preset: inputs.preset, cps: inputs.cps, hold, dpr, fps },
      command: 'node scripts/render.mjs ' + argv.map((x) => (/[^\w.\-/]/.test(x) ? JSON.stringify(x) : x)).join(' ').replace(full, 'DIR'),
      skillTimeline: Object.fromEntries(['typeStart', 'typeEnd', 'sendMoveStart', 'sendMoveEnd', 'send'].map((k) => [k, round(m.timeline[k]!)])),
      skillSources: { ...m.sourceHashes, 'render.mjs': m.rendererSha256 },
      skillChecks: checks,
      trim: { renderedFrames: m.frameCount, keptFrames: frames, lastFrame: 'the first frame at or after the send instant, ' + (late * 1000).toFixed(2) + ' ms after it' },
      promptBox: { x: Math.round(inputs.promptBox.x * dpr), y: Math.round(inputs.promptBox.y * dpr), width: Math.round(inputs.promptBox.width * dpr), height: Math.round(inputs.promptBox.height * dpr) },
      encode: { codec: 'libx264', twoPass: true, intermediate: 'ffv1 gbrp lossless', rate, filter: rgbToYuvFilter(), args: x264Args(fps, rate).join(' ') },
      decodedPsnr: { beforeSubmit: psnr[0], submit: psnr[1] },
      probe: p,
      date: new Date().toISOString(),
    },
  })
  console.log(stop + ': ' + relative(ROOT, out) + ', ' + frames + ' frames, ' + (frames / fps).toFixed(3) + ' s, first key ' + (keys[0]! / fps).toFixed(3) + ' s, last key ' + (lastKey / fps).toFixed(3) + ' s, submit ' + (submit / fps).toFixed(3) + ' s, full prompt held ' + holdSeconds.toFixed(3) + ' s, hold input ' + hold)
}

let failed = 0
for (const stop of a.stop ? [a.stop] : cfg.stopIds) {
  let done = false
  for (let attempt = 1; attempt <= posts.introMaxTries && !done; attempt++) {
    try {
      await make(stop)
      done = true
    } catch (e: unknown) {
      console.error(stop + ': try ' + attempt + ' of ' + posts.introMaxTries + ' failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }
  if (!done) failed++
}
if (failed) process.exit(1)
