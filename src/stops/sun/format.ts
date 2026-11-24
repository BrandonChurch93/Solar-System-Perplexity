import type * as THREE from 'three'

/** The height of the drawing buffer over 1080: 1 at 16 by 9, 2 at uhd, 0.5 at preview.
 *  Whatever comes in or goes out by how large a thing is in the frame reads that size in 1080ths of the frame
 *  height (an angle), never in pixels of the format, so every format shows the same picture, only finer or
 *  coarser. One object for every material of the stop: the set writes it once before it draws. Nothing that only
 *  picks a mip for a lookup reads it. */
export const formatUniform: THREE.IUniform<number> = { value: 1 }

/** height: the height of the buffer that is drawn now. picture: 1 in the frame's own pass. In the pass that draws
 *  a place picture the buffer is larger than the frame by the picture's scale and the limit of its edge gives the
 *  uhd picture the pixels of the master's (NOTE 504): there the factor is that buffer's height over 1080 times the
 *  scale the master's picture has, 1 at 16 by 9 and 1 at uhd. */
export function setFormat(height: number, picture = 1): void {
  formatUniform.value = height / (1080 * picture)
}
