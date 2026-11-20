import { ArrayBufferTarget, FileSystemWritableFileStreamTarget, Muxer } from 'mp4-muxer'

interface Level { id: number; name: string; maxFs: number; maxMbps: number; maxBrKbps: number }

const LEVELS: Level[] = [
  { id: 10, name: '1', maxFs: 99, maxMbps: 1485, maxBrKbps: 64 },
  { id: 11, name: '1.1', maxFs: 396, maxMbps: 3000, maxBrKbps: 192 },
  { id: 12, name: '1.2', maxFs: 396, maxMbps: 6000, maxBrKbps: 384 },
  { id: 13, name: '1.3', maxFs: 396, maxMbps: 11880, maxBrKbps: 768 },
  { id: 20, name: '2', maxFs: 396, maxMbps: 11880, maxBrKbps: 2000 },
  { id: 21, name: '2.1', maxFs: 792, maxMbps: 19800, maxBrKbps: 4000 },
  { id: 22, name: '2.2', maxFs: 1620, maxMbps: 20250, maxBrKbps: 4000 },
  { id: 30, name: '3', maxFs: 1620, maxMbps: 40500, maxBrKbps: 10000 },
  { id: 31, name: '3.1', maxFs: 3600, maxMbps: 108000, maxBrKbps: 14000 },
  { id: 32, name: '3.2', maxFs: 5120, maxMbps: 216000, maxBrKbps: 20000 },
  { id: 40, name: '4', maxFs: 8192, maxMbps: 245760, maxBrKbps: 20000 },
  { id: 41, name: '4.1', maxFs: 8192, maxMbps: 245760, maxBrKbps: 50000 },
  { id: 42, name: '4.2', maxFs: 8704, maxMbps: 522240, maxBrKbps: 50000 },
  { id: 50, name: '5', maxFs: 22080, maxMbps: 589824, maxBrKbps: 135000 },
  { id: 51, name: '5.1', maxFs: 36864, maxMbps: 983040, maxBrKbps: 240000 },
  { id: 52, name: '5.2', maxFs: 36864, maxMbps: 2073600, maxBrKbps: 240000 },
  { id: 60, name: '6', maxFs: 139264, maxMbps: 4177920, maxBrKbps: 240000 },
  { id: 61, name: '6.1', maxFs: 139264, maxMbps: 8355840, maxBrKbps: 480000 },
  { id: 62, name: '6.2', maxFs: 139264, maxMbps: 16711680, maxBrKbps: 800000 },
]

const PROFILES = [
  { name: 'High', prefix: '6400', brFactor: 1.25 },
  { name: 'Main', prefix: '4D40', brFactor: 1 },
  { name: 'Baseline', prefix: '42E0', brFactor: 1 },
]

export interface EncodeSpec { width: number; height: number; fps: number; bitrate: number }

export interface CodecChoice { codec: string; muxCodec: 'avc' | 'vp9' | 'av1'; label: string; h264: boolean; config: VideoEncoderConfig }

function hex2(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, '0')
}

export function levelsThatFit(spec: EncodeSpec, brFactor: number): Level[] {
  const wMbs = Math.ceil(spec.width / 16)
  const hMbs = Math.ceil(spec.height / 16)
  const fs = wMbs * hMbs
  const mbps = fs * spec.fps
  return LEVELS.filter((l) => {
    const side = Math.sqrt(8 * l.maxFs)
    return fs <= l.maxFs && wMbs <= side && hMbs <= side && mbps <= l.maxMbps && spec.bitrate <= l.maxBrKbps * 1000 * brFactor
  })
}

export function h264Candidates(spec: EncodeSpec): { codec: string; label: string }[] {
  const out: { codec: string; label: string }[] = []
  for (const p of PROFILES) for (const l of levelsThatFit(spec, p.brFactor)) out.push({ codec: 'avc1.' + p.prefix + hex2(l.id), label: 'H.264 ' + p.name + ' ' + l.name })
  return out
}

function baseConfig(codec: string, spec: EncodeSpec): VideoEncoderConfig {
  return { codec, width: spec.width, height: spec.height, bitrate: spec.bitrate, framerate: spec.fps, latencyMode: 'quality', bitrateMode: 'variable' }
}

export async function chooseH264(spec: EncodeSpec): Promise<CodecChoice | null> {
  if (typeof VideoEncoder === 'undefined') return null
  for (const c of h264Candidates(spec)) {
    const config: VideoEncoderConfig = { ...baseConfig(c.codec, spec), avc: { format: 'avc' } }
    try {
      const r = await VideoEncoder.isConfigSupported(config)
      if (r.supported) return { codec: c.codec, muxCodec: 'avc', label: c.label, h264: true, config }
    } catch {
      continue
    }
  }
  return null
}

export async function chooseFallback(spec: EncodeSpec): Promise<CodecChoice | null> {
  if (typeof VideoEncoder === 'undefined') return null
  const options: { codec: string; mux: 'vp9' | 'av1'; label: string }[] = [
    { codec: 'vp09.00.40.08', mux: 'vp9', label: 'VP9' },
    { codec: 'vp09.00.31.08', mux: 'vp9', label: 'VP9' },
    { codec: 'av01.0.08M.08', mux: 'av1', label: 'AV1' },
    { codec: 'av01.0.04M.08', mux: 'av1', label: 'AV1' },
  ]
  for (const o of options) {
    const config = baseConfig(o.codec, spec)
    try {
      const r = await VideoEncoder.isConfigSupported(config)
      if (r.supported) return { codec: o.codec, muxCodec: o.mux, label: o.label, h264: false, config }
    } catch {
      continue
    }
  }
  return null
}

export type Sink = { kind: 'memory' } | { kind: 'disk'; stream: FileSystemWritableFileStream }

export class FilmEncoder {
  private readonly encoder: VideoEncoder
  private readonly muxer: Muxer<ArrayBufferTarget | FileSystemWritableFileStreamTarget>
  private readonly frameUs: number
  private submitted = 0
  chunks = 0
  error: Error | null = null
  private waiters: (() => void)[] = []

  constructor(private readonly choice: CodecChoice, private readonly spec: EncodeSpec, private readonly sink: Sink) {
    const target = sink.kind === 'disk' ? new FileSystemWritableFileStreamTarget(sink.stream) : new ArrayBufferTarget()
    this.muxer = new Muxer({ target, video: { codec: choice.muxCodec, width: spec.width, height: spec.height, frameRate: spec.fps }, fastStart: false })
    this.frameUs = 1e6 / spec.fps
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => {
        this.chunks++
        this.muxer.addVideoChunk(chunk, meta)
        this.wake()
      },
      error: (e) => {
        this.error = e instanceof Error ? e : new Error(String(e))
        this.wake()
      },
    })
    this.encoder.addEventListener('dequeue', () => this.wake())
    this.encoder.configure(choice.config)
  }

  private wake(): void {
    const w = this.waiters
    this.waiters = []
    for (const f of w) f()
  }

  get queue(): number {
    return this.encoder.encodeQueueSize
  }

  async drainTo(max: number, yieldOnce: () => Promise<void>): Promise<void> {
    while (this.encoder.encodeQueueSize > max && !this.error) {
      await Promise.race([new Promise<void>((r) => this.waiters.push(r)), yieldOnce()])
    }
    if (this.error) throw this.error
  }

  encodeCanvas(canvas: HTMLCanvasElement, index: number): void {
    if (this.error) throw this.error
    const timestamp = Math.round(index * this.frameUs)
    const duration = Math.round((index + 1) * this.frameUs) - timestamp
    const frame = new VideoFrame(canvas, { timestamp, duration, alpha: 'discard' })
    try {
      this.encoder.encode(frame, { keyFrame: index % this.spec.fps === 0 })
    } finally {
      frame.close()
    }
    this.submitted++
  }

  async finish(expected: number): Promise<Uint8Array | null> {
    await this.encoder.flush()
    if (this.error) throw this.error
    if (this.submitted !== expected || this.chunks !== expected) throw new Error('frame count mismatch: ' + this.chunks + ' encoded of ' + expected)
    this.encoder.close()
    this.muxer.finalize()
    if (this.sink.kind === 'disk') {
      await this.sink.stream.close()
      return null
    }
    return new Uint8Array((this.muxer.target as ArrayBufferTarget).buffer)
  }

  async abort(): Promise<void> {
    try {
      if (this.encoder.state !== 'closed') this.encoder.close()
    } catch {
      /* already closed */
    }
    if (this.sink.kind === 'disk') {
      try {
        await this.sink.stream.abort()
      } catch {
        /* nothing written */
      }
    }
  }

  get codec(): string {
    return this.choice.codec
  }
}
