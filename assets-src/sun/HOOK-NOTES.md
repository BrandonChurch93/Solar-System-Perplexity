# Sun hook surge, branch agent/sun-hook (mail 76, ROUND31-FIXES section F)

This branch is cut from origin/main 2b50ee2 and holds only the hook surge. The polish notebook
(mail 34 list, items 4, 5a, 5b, 6, 7) lives on `agent/sun` in `assets-src/sun/NOTES.md`, head aea8bf5.

## The task (section F, short)
Critic, scroll stop, opening 7, one major: the arch is fully formed in frame one, later frames only shimmer.
Cure: frame 0 stays as readable as it is. Inside `film.hookSeconds` (2 s, frames 0 to 60) one event changes the
picture at 400 px wide: a bright surge leaves one foot, climbs the arch, crosses the crest, comes down into the
other foot, lights the strands it passes and flares the second foot as it lands. Plasma along the loop, not a
flash of the frame. Frames 90, 247, 360 keep their bytes. Send: 0, 8, 15, 23, 30, 38, 45, 53, 60 final tier at
400 px wide in one strip, before and after; finals of 0 and 60 full size; draft hashes of 90, 247, 360 before
and after. DONE or PART at 07:30 UTC to /root.

## Before (main 2b50ee2, clean tree)
`out/work/sun/hook/before.sh before` : drafts of 90, 247, 360, 2325, 2427, 2580, 615, 1440, 2010, 3150, 3720,
4290, 4860 into `out/work/sun/hook/before-draft`, finals of the nine hook frames into `before-final`.
Hashes: see the table at the end of this file.

## Design
All inside the opening (`look.opening`, which is zero from 2.85 s, so frame 90 never sees it).
- `look.opening.surge`: head runs along the arch coordinate `s` (0 at the left foot, 1 at the right foot) from
  `-lead` at `from` to `1 + lead` at `land`. Amplitude is exactly 0 for `since <= from` and for `since >= end`.
- `loops.ts` shader, inside the knots block (already behind a uniform loop): a front that is a Gaussian ahead
  of the head (`width`) and an exponential tail behind it (`tail`), offset per strand (`ragged`) so the strands
  do not light in one straight line across the bundle. It multiplies the strand light and adds a wide veil from
  the loops card at an explicit mip level (`level`) so the lit stretch thickens at phone size.
- Feet: launch flare on the left foot (`launch`) and landing flare on the right foot (`flare`), both through
  the existing `uFoot` uniform, shaped `t / peak * exp(1 - t / peak)`.
- Ground: `ground.ts` gets `uLand` (card position of the right foot and a reach) and `uLandOn`; the existing
  glow map is raised only around the landing foot.
- No hash, no time source, no texture read without explicit level in the new code.

## Mail 81 (06:12 UTC), for the polish list on agent/sun, not this branch
Surface critic, sun.travel frame 495, just inside the lower edge of the disc: "A thin pale arc runs inside the
true limb, creating a doubled contour across the solar texture." Fix named: "Blend out the inner arc and
preserve a single bright falloff at the limb without flattening the photosphere detail." If my globe draws the
arc at that distance it is mine, if the sky's disc draws it, it is the travel agent's: look, then tell /root
which. No answer needed before the hook is done.

## Log
- 06:04 before renders started. 06:07 code written (not built until the before renders end).
