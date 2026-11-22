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
- 06:28 after drafts done: all 13 draft sha256 equal before and after (90, 247, 360 and 2325, 2427, 2580, 615,
  1440, 2010, 3150, 3720, 4290, 4860). Frame 0 at the final tier: byte equal before and after
  (sha256 7cd40c50cd2343864b2700d6a7e2a9ad30ed044020f59e4807c6c369172a7916).

## Draft hashes of the judged Sun frames (draft tier, sha256, before = main 2b50ee2, after = this branch)
| frame | before | after |
| 90 | bf614a99e8524fbe4d45abb1a35235dc69e8d60115a3eda4bda9f170413cf3fe | the same |
| 247 | 88c6f79c3b1fff8d36700ad4081ac1d90110f0fbd0dca35c61a399fa1663ad3e | the same |
| 360 | fcbfbf2f25bffb63875e7bd975102d2d2e8373b449786b00f3256c62953fe402 | the same |

## First full after run (commit 96cf078), 06:25 to 06:36
- Final tier, after minus before at 400 px wide (pixels brighter by more than 16 levels):
  frame 0: none, bytes equal. 8: 1.08 percent of the frame, centroid x 158. 15: 3.77, x 175. 23: 5.75, x 203.
  30: 6.58, x 228. 38: 5.63, x 253. 45: 4.55, x 266. 53: 3.87, x 270. 60: 1.65, x 279.
  (Left foot stands at x 150, right foot at x 286 of 400.) Never more than 6.6 percent of the frame: no frame flash.
- Cost at the final tier: 55.1 to 56.5 s per frame against 53.6 to 54.5 s before (about 3 percent more while the
  surge runs, nothing once `uSurge.y` is 0 because the block sits in a uniform loop).
- At native size: frame 23 had a milky clump at the crest (core 0.5 times crest 1.8 times amount 5.5), frame 30 a
  beige veil outside the outer strands. Cut: `core: [0.3, 0.05]`, `halo: 0.24`. At 400 px the read is the same
  (`out/work/sun/hook/v-d7-23-400.jpg`: before, first run, cut).
- 06:38 second full after run started on commit 6e33a5d. The first run is kept in `after1-draft`, `after1-final`.
- `npx vitest run`: 15 files, 79 tests passed. Shader audit: the same 32 lines as main.
- Only `src/stops/sun/{ground,look,loops,set}.ts` and the two notes files differ from main 2b50ee2.

## Weak points I know of
- The feet clip to white while the surge leaves (frame 8) and lands (45 to 53): every strand converges there and
  the card was near white before; the clipped core grows from about 40 px to about 90 px wide at 1920.
- The front is a line of constant arch coordinate; only the per strand lag (`ragged`, `lanes`) breaks it up.
- The veil is a blurred copy of the loops card (mip 5), not a bloom of the picture.
- The ground flare is a radial lift of the existing glow map around the right foot, no new light on the cells.
- The surge times follow `film.hookSeconds` since c3c2118, but `look.opening.fade` of main (2.05 to 2.85 s) does
  not; it caps everything, so a longer hook would cut the surge off at 2.85 s.
- Frames 61 to 77 also differ from main (the flare dies away until 2.6 s); from frame 78 the picture is main's.
- Only draft and final tiers rendered, no review tier, no motion gate rerun (the change moves no geometry).

## Second full after run (commit 6e33a5d), 06:38 to 06:49: the one that is sent
- Draft sha256 of all 13 check frames equal to main again (90, 247, 360 and the ten frames of the other stops).
- Final tier frame 0: byte equal to main (7cd40c50cd2343864b2700d6a7e2a9ad30ed044020f59e4807c6c369172a7916).
  Final tier frame 60: changes by design, bf1840b913881b1a4752c3faf69b9b6dcb60b1228da726059974c35a6fb84861
  (main: 74654f280f7cdc1d8c2e1f53889ff47b3ea91c6c58f6aea60178c7796327fc00).
- After minus before at 400 px wide (pixels brighter by more than 16 levels), share of the frame and centroid x:
  8: 1.00 percent, x 158. 15: 3.57, x 175. 23: 5.48, x 202. 30: 6.19, x 228. 38: 5.27, x 252. 45: 4.42, x 266.
  53: 3.76, x 270. 60: 1.62, x 279. Feet at x 150 and x 286.
- Final tier cost: 53.9 to 54.9 s per frame against 53.6 to 54.5 s on main, under 1 percent.
- Sheets: `out/work/sun/hook/hook-before-strip-final-400px.jpg`, `hook-after-strip-final-400px-6e33a5d.jpg`.
- 06:50 commit c3c2118: the surge times became shares of `film.hookSeconds` (`from` 0.05, `land` 0.75, `rise` 0.1,
  `fade` 0.35, `peak` 0.09, `early` 0.05, `end` 1.3, `settle` 0.25 of the hook). With the hook at 2 s every product
  is the same double as the number it replaced. Proof: draft 23 and 30 byte equal before and after the change
  (8edafd66..., fdc89d7f...); harness stills of final 60 and final 0 compared below.
- 06:53 on c3c2118, a fresh session: final 60 = bf1840b9... (equal to the 6e33a5d render, so the final tier also
  repeats across sessions), final 0 = 7cd40c50... (main's bytes).
- The harness `npm run -s still` refused to start on this VM: "2.4 GB free, need 3". The finals were made with
  `out/work/sun/frames.ts`, which calls the same `openCapture` and `renderPng` with the full asset set. A bulk
  delete of old sequence folders under `out/work/seq` was not carried out (their origin is not established);
  the disk stays at 2.3 GB free until I clear my own scratch under `out/work/sun` by name.
- Looks pushed 06:51 (agent/sun-looks 2c538c60): both strips, finals of 0 and 60 at full size, native crops.
- 06:55 on c3c2118: the thirteen draft frames (90, 247, 360 and the ten of the other stops) again byte equal to main.
- 06:56 the shader audit on c3c2118 printed the same 32 findings, but one of them with another line number
  (ground.ts 206 became 208, the two new uniform lines sat above it). Decided: the audit text must be equal to
  main's, so `uLand` and `uLandOn` are declared on the existing lines (`uniform vec4 uBox, uLand;`,
  `uniform float uGlowBeat, uLandOn;`). `diff` of the audit output against main's is now empty.
- Same commit: `ground.land()` held a bare `(16 / 9) * 0.5` for the depth of the glow ellipse; it is now the
  second number of `look.opening.surge.reach` (`[0.06, 0.06 * (16 / 9) * 0.5]`), same float, so same bytes.
- 06:59 to 07:01 on that tree: final 60 = bf1840b9..., final 0 = 7cd40c50... (main's bytes), the thirteen draft
  frames equal to main, drafts 23 and 30 equal to the 6e33a5d drafts; build, tsc clean, vitest 15 files 79 tests.
  The pictures of the 6e33a5d set therefore stand for this commit.
