import { config } from '../config'

let rate = 1
let degrees: number | null = null

export function setCapture(newRate: number, shutterDegrees: number | null = null): void {
  if (!Number.isInteger(newRate) || newRate < 1) throw new Error('capture rate must be a whole number of at least 1')
  if (shutterDegrees !== null && !(shutterDegrees >= 0 && shutterDegrees <= 360)) throw new Error('shutter must be 0 to 360 degrees')
  rate = newRate
  degrees = shutterDegrees
}

export function captureRate(): number {
  return rate
}

export function shutterAsked(): number | null {
  return degrees
}

export function captureShutterDegrees(): number {
  return degrees ?? config.raw.film.shutterDegrees
}

export function captureFrames(): number {
  return config.frameCount * rate
}

export function shutterSpan(): number {
  return degrees === null ? config.shutterFraction / rate : degrees / 360 / rate
}

export function spanMid(): number {
  return shutterSpan() * 0.5
}

export function shutterSeconds(): number {
  return shutterSpan() / config.fps
}

export function wholeFrame(frame: number): number {
  return Math.floor(frame + 1e-9)
}

export function clockStamp(): string {
  return rate + '|' + (degrees ?? 'film')
}
