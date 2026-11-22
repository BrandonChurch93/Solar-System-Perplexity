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
- 06:15 before renders done (finals about 60 s per frame). Before strip: `out/work/sun/hook/strip-before.jpg`.
- "One strip" of nine frames at 400 px is 3600 px wide, the attachment rule caps the long edge at 1400:
  decided on one sheet of 3 by 3 tiles, each 400 px wide (1200 by 701), same for before and after.
- 06:16 to 06:25 six draft rounds (d1 to d6, `out/work/sun/hook/strip-dN.jpg`):
  d1 amount 5, tail 0.3: the whole arch lit by frame 30, reads as "arch brightens", not as a pulse.
  d2 tail 0.16, amount 4: travels, but mild at the crest.
  d3 core at the head, halo 0.7: at native size a foggy beam under the crest (the front is a line of
  constant `s`, so the hanging inner strands and the veil lit up as a band) and a white cloud at the head.
  d4 `inner` (the surge fades to a quarter on the inner strands, arc 1.8 to 2.3), core 0.5, halo 0.35: beam gone.
  d5 crest boost: crest reads at 400 px. Veil outside the strands looked like beige fog over the stars.
  d6 veil from mip 5 instead of 6, 0.35; amplitude profile along the arch `crest: [feet, crest]` so the feet,
  where every strand converges, clip less than before.
- 06:25 after renders started with `crest: [0.45, 1.35]`, `launch: 0.7` (`before.sh after`).
- Shader audit (`python3 tools/shaderaudit.py`, HEAD export against the work tree, line numbers ignored): same 32 lines.
