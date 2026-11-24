import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { deflateSync } from 'node:zlib'
import { PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { afterAll, describe, expect, it } from 'vitest'

// The step of a frame in place (tools/img/handover.py, op inPlace): the change against the frame before on the ground that both frames show.
// The pictures of this test are painted here by three's own camera, a body of radius 1 whose look is fixed to its ground, so the test also
// holds the tool to the conventions of the director: the pose of the camera, its field of view and the turn of the body.

const TOOL = resolve(__dirname, '../tools/img/handover.py')
const have = ((): boolean => {
  try {
    execFileSync('python3', ['-c', 'import numpy, PIL'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

// Each test starts python once or twice; the limit leaves room for a loaded machine.
const TIME = 60000
const W = 384
const H = 216
const VFOV = 40

function crc(buf: Buffer): number {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'latin1')
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), data])), 0)
  return Buffer.concat([head, data, tail])
}

function png(rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const rows = Buffer.alloc(H * (1 + W * 3))
  for (let y = 0; y < H; y++) rows.set(rgb.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1)
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))])
}

// The look of the body, fixed to its ground: soft bands and a dark cap round one pole.
const DARK = 24
function look(p: Vector3): number {
  if (p.y > 0.45) return DARK
  return 150 + 40 * Math.sin(4 * Math.atan2(p.z, p.x)) * Math.cos(3 * Math.asin(p.y))
}

interface View { eye: Vector3; turn: Quaternion; lift: number; gain?: number }

function camera(v: View): PerspectiveCamera {
  const c = new PerspectiveCamera(VFOV, W / H, 0.01, 100)
  c.position.copy(v.eye)
  c.lookAt(0, 0, 0)
  c.updateMatrixWorld(true)
  return c
}

// One picture: per pixel the ray through its middle, where it meets the body, and the look of that ground (plus a lift of the whole body,
// times a gain of the whole picture).
function paint(v: View): { rgb: Uint8Array; mean: number } {
  const c = camera(v)
  const back = v.turn.clone().invert()
  const rgb = new Uint8Array(W * H * 3)
  let sum = 0
  let count = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ray = new Vector3(((x + 0.5) / W) * 2 - 1, 1 - ((y + 0.5) / H) * 2, 0.5).unproject(c).sub(c.position).normalize()
      const along = -ray.dot(c.position)
      const disc = along * along - c.position.lengthSq() + 1
      if (disc <= 0 || along - Math.sqrt(disc) <= 0) continue
      const ground = c.position.clone().addScaledVector(ray, along - Math.sqrt(disc)).applyQuaternion(back)
      const level = (look(ground) + v.lift) * (v.gain ?? 1)
      const i = (y * W + x) * 3
      rgb[i] = Math.round(level)
      rgb[i + 1] = Math.round(level * 0.8)
      rgb[i + 2] = Math.round(level * 0.6)
      sum += 0.2126 * rgb[i]! + 0.7152 * rgb[i + 1]! + 0.0722 * rgb[i + 2]!
      count++
    }
  }
  return { rgb, mean: sum / count }
}

interface Reply { seen: number; level: number; colour: number[]; rms: number; fresh: number; kept: number }

const dir = mkdtempSync(join(tmpdir(), 'in-place-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

function measure(views: View[], extra: object = {}): { reply: (Reply | null)[]; means: number[] } {
  const means: number[] = []
  const paths = views.map((v, i) => {
    const p = paint(v)
    means.push(p.mean)
    const file = join(dir, 'f' + i + '-' + Math.round(v.lift) + '-' + v.eye.length().toFixed(3) + '.png')
    writeFileSync(file, png(p.rgb))
    return file
  })
  const poses = views.map((v) => {
    const c = camera(v)
    return { position: c.position.toArray(), quaternion: c.quaternion.toArray(), vfov: VFOV, turn: v.turn.toArray() }
  })
  const reply = JSON.parse(execFileSync('python3', [TOOL], { input: JSON.stringify({ op: 'inPlace', paths, poses, scale: 1, ...extra }), encoding: 'utf8' })) as (Reply | null)[]
  return { reply, means }
}

const turn = (angle: number): Quaternion => new Quaternion().setFromAxisAngle(new Vector3(0.2, 1, 0.1).normalize(), angle)
// The eye pulls back and climbs toward the dark cap while the body turns under it: the second frame opens on ground the first did not show.
const near: View = { eye: new Vector3(0.1, 0.25, 1.9), turn: turn(0.3), lift: 0 }
const far: View = { eye: new Vector3(0.3, 1.0, 2.9), turn: turn(0.36), lift: 0 }

describe.skipIf(!have)('the step of a frame in place', () => {
  it('is nothing where the frame only opens on new ground, though the mean of the body steps', () => {
    const { reply, means } = measure([near, far])
    expect(reply[0]).toBeNull()
    const r = reply[1]!
    expect(Math.abs(means[1]! - means[0]!)).toBeGreaterThan(10)
    expect(Math.abs(r.level)).toBeLessThan(0.25)
    for (const c of r.colour) expect(Math.abs(c)).toBeLessThan(0.25)
    expect(r.seen).toBeGreaterThan(0.3)
    expect(r.seen).toBeLessThan(0.9)
    // The new ground is the dark cap and the ground round the old frame; the ground seen in both is the lit bands.
    expect(r.fresh).toBeLessThan(r.kept - 20)
  }, TIME)

  it('is the change of the look where the look of the ground changes', () => {
    const { reply } = measure([near, { ...far, lift: 10 }])
    const r = reply[1]!
    const luma = 10 * (0.2126 + 0.7152 * 0.8 + 0.0722 * 0.6)
    expect(r.level).toBeGreaterThan(luma - 0.25)
    expect(r.level).toBeLessThan(luma + 0.25)
    expect(r.colour[0]!).toBeGreaterThan(9.75)
    expect(r.colour[0]!).toBeLessThan(10.25)
    expect(r.colour[2]!).toBeGreaterThan(5.75)
    expect(r.colour[2]!).toBeLessThan(6.25)
  }, TIME)

  it('reads a step of the light of the whole picture as the mean of the body does where the frame does not open', () => {
    // The same eye and the same turn twice, the second picture with 3 and with 6 percent more light.
    for (const gain of [1.03, 1.06]) {
      const { reply, means } = measure([near, { ...near, gain }])
      const r = reply[1]!
      const step = means[1]! - means[0]!
      expect(r.seen).toBeGreaterThan(0.99)
      expect(step).toBeGreaterThan((gain - 1) * means[0]! - 0.25)
      expect(Math.abs(r.level - step)).toBeLessThan(0.25)
    }
  }, TIME)

  it('and reads it alone where the frame opens on darker ground, which hides it in the mean of the body', () => {
    for (const gain of [1.03, 1.06]) {
      const { reply, means } = measure([near, { ...far, gain }])
      const r = reply[1]!
      // The mean of the body falls, by the dark cap that comes into the frame, though the light went up.
      expect(means[1]! - means[0]!).toBeLessThan(-5)
      // In place: the share of the light that was added, on the ground seen in both (kept is its level in this frame, after the step).
      expect(Math.abs(r.level - r.kept * (1 - 1 / gain))).toBeLessThan(0.3)
      expect(r.level).toBeGreaterThan(gain > 1.05 ? 6 : 3)
    }
  }, TIME)

  it('reads a dive the same way: every ground of the nearer frame was in the farther one', () => {
    const { reply, means } = measure([far, near])
    const r = reply[1]!
    expect(Math.abs(means[1]! - means[0]!)).toBeGreaterThan(10)
    expect(r.seen).toBeGreaterThan(0.99)
    expect(Math.abs(r.level)).toBeLessThan(0.25)
  }, TIME)

  it('draws the pair when asked: both frames, the new ground and the change in place', () => {
    const file = join(dir, 'pair.png')
    const { reply } = measure([near, far], { panels: [{ index: 1, file, gain: 8, limit: 1400, names: ['frame 0', 'frame 1'] }] })
    expect(Math.abs(reply[1]!.level)).toBeLessThan(0.25)
    const drawn = readFileSync(file)
    expect(drawn.length).toBeGreaterThan(10000)
    expect(drawn.readUInt32BE(16)).toBe(1400)
  }, TIME)

  it('is thrown off by a turn of the body that is not told, so the turn is part of the measure', () => {
    const { reply } = measure([near, { ...far, turn: turn(0.3) }])
    const told = measure([near, far]).reply[1]!
    // The picture is painted with the same turn in both frames here, and laid over with it: still in place.
    expect(Math.abs(reply[1]!.level)).toBeLessThan(0.25)
    // The same two pictures as the first test, laid over as if the body had not turned: the bands no longer meet.
    const p = [paint(near), paint(far)]
    const paths = p.map((x, i) => {
      const file = join(dir, 'untold-' + i + '.png')
      writeFileSync(file, png(x.rgb))
      return file
    })
    const poses = [near, far].map((v) => {
      const c = camera(v)
      return { position: c.position.toArray(), quaternion: c.quaternion.toArray(), vfov: VFOV, turn: turn(0.3).toArray() }
    })
    const untold = (JSON.parse(execFileSync('python3', [TOOL], { input: JSON.stringify({ op: 'inPlace', paths, poses, scale: 1 }), encoding: 'utf8' })) as (Reply | null)[])[1]!
    expect(untold.rms).toBeGreaterThan(told.rms * 3)
  }, TIME)
})
