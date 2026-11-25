import data from './texels.json'

// Decision d253 (b): the asset set must not move the moment at which a level, a patch or an exchange arrives.
// What counts texels to a pixel for such a moment counts the full set's, in both sets (texels.json); what
// picks a level of the picture at hand takes off the levels by which that picture is smaller.
export type Counted = keyof typeof data.full

export function fullSize(name: Counted): [number, number] {
  const size = data.full[name]
  return [size[0]!, size[1]!]
}

// (the levels by which the picture at hand lies under the full set's: 0 in the full set, 1 in the web set)
export function setLod(name: Counted, image: { width: number }): number {
  return Math.log2(data.full[name][0]! / image.width)
}
