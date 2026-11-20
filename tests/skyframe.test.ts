import { describe, expect, it } from 'vitest'
import frame from '../src/space/skyframe.json'
import { skyAim, type SkyAimArgs } from '../tools/assets/skyaim'

describe('sky frame', () => {
  it('stored quaternions follow from the stored arguments and the current plans', () => {
    const aim = skyAim(frame.args as unknown as SkyAimArgs)
    const close = (a: number[], b: number[]): void => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6))
    close(aim.quaternion, frame.quaternion)
    for (const [stop, turn] of Object.entries(aim.turns)) close(turn, (frame.turns as Record<string, number[]>)[stop]!)
  })
})
