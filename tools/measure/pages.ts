// The judged finals are the largest pictures a measure draws. A page that has drawn the texel frames before them still holds what those
// needed, and on a small machine a final then does not fit beside it. So the finals get a page of their own: the first is closed before
// the second is opened, the two never live at once. No number of a measure is read from what a page has drawn before.
export async function freshPage<T extends { close(): Promise<void> }>(src: T, drawnBefore: number, open: () => Promise<T>): Promise<T> {
  if (drawnBefore <= 0) return src
  await src.close()
  return open()
}
