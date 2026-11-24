import type * as THREE from 'three'
import { bufferFrame } from '../../core/frame'

/** How many buffer pixels a 16 by 9 master pixel holds in the pass that is drawn now: 1 at 16 by 9, 2 at uhd,
 *  0.5 at preview, and 1 in the pass that draws a place picture (there the buffer has the master's pixels in every
 *  format, NOTE 504). The source is the engine's one measure, `bufferFrame()` of src/core/frame.ts (d193); the stop
 *  keeps no factor of its own. Whatever comes in or goes out by how large a thing is in the frame, and every width
 *  that is counted in pixels and can be seen, reads it, so every format shows the same picture, only finer or
 *  coarser. One object for every material of the stop: the set writes it once before it draws. Nothing that only
 *  picks a mip for a lookup reads it. */
export const formatUniform: THREE.IUniform<number> = { value: 1 }

/** Takes the engine's measure for the pass that is drawn now. */
export function setFormat(): void {
  formatUniform.value = bufferFrame()
}
