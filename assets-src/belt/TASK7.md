# Task 7 from the Builder (saved verbatim): MAIL 75 of 06:02 UTC Nov 22, then the rules and section E of assets-src/shared/ROUND31-FIXES.md at main 2b50ee2

MAIL 75 from the Builder, 06:02 UTC. Whole film round 30 is closed. Frame 2782 was the weakest of the film jury (five of five jurors: a real-time web 3D demo) and the surface critic gave it two majors (the hero rock soft, stretched and faceted; the near rock's streak striped with stars showing through). Your next task is in the repo on main (2b50ee2d): `assets-src/shared/ROUND31-FIXES.md`. Fetch and merge origin main into `agent/belt`, then read "Rules for every agent on this list" and section E. A message that starts `PART` at 07:30 UTC with what is proved and pushed by then, `DONE` when all of it is. No questions needed: decide, note, continue.

# Round 31 fixes, briefs for the supporting agents

Written by the Builder (`/root`) at 06:00 UTC on 2026-11-22, after whole film round 30 (the first of three). Scores: film 5, hook 7, compression 8, jury pass, surfaces 4, motion 5; three severe and 21 major issues. Every issue with the critic's words is in `scorecards/round-030/SUMMARY.md`. Each cause below goes to one agent. Round 31 starts when the fixes are proved on the render workers.

## Rules for every agent on this list

- Base: `origin/main` as it stands now (7ff3d07 or later). Fetch and merge it first. Your branch holds this change and nothing else.
- One owner per file. Edit only the files your section names. If you need a change in a file that is not yours, write the exact lines in your report and carry on.
- Nothing a finished stop shows may change. The 30 judged hold, dive and terrain frames (Sun 0, 60, 90, 247, 360; Mercury 615, 717, 870; Venus 1185, 1287, 1440; Earth 1755, 1857, 2010; Mars 2325, 2427, 2580; Jupiter 2895, 2997, 3150; Saturn 3465, 3567, 3720; Uranus 4035, 4137, 4290; Neptune 4605, 4707, 4860) keep their bytes, unless your section says a frame changes by design. Your own check: draft tier sha256 before and after for 2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860. The Builder proves all of them at the final tier on the render workers before anything reaches main. Saturn's 3465, 3567 and 3866 may differ by one level in a few pixels: known, not yours.
- Stills: `npm run -s still -- --frame N --tier draft|review|final` writes `out/work/stills/fNNNNN-16x9-<tier>-full.png`. Sheets: `npm run sheet -- --segment ID --tier review`. `npm run build` and `npx vitest run` stay green. `python3 tools/shaderaudit.py` prints no new line. At most one render process at a time; long jobs detached with a log you poll.
- Shaders: no `Math.random`, `Date.now`, `performance.now`; no `fract(sin(...))` hash on a pixel (integer hash only); no derivative and no `texture()` without an explicit level on a value first assigned after a `discard` or inside a per pixel branch.
- Judge fine detail only in crops at native size (no scaling), never from a whole frame.
- Text: no em dashes and no exclamation points in any file or file name. Almost no code comments.
- Report to `/root` with a message that starts `DONE` when the section is finished: branch and commit, what changed, your own weak points, the files below as attachments (at most 10 per message, JPEG, long edge at most 1400). If you are not finished at 07:30 UTC, send a message that starts `PART` with what is proved by then, pushed, and carry on to `DONE`. Do not wait for an answer in between: decide, note it in your notebook, continue.

## E. The belt (agent `belt_builder`, branch `agent/belt`)

Frame 2782 is the judged frame of `mars.travel` and the weakest frame of the film jury: five of five jurors called it a real-time web 3D demo.

- "the lit surface is soft, airbrushed, and diagonally stretched/smeared at native resolution, while the lower-left lit limb has faceted low-poly straight segments with stair-stepped pixel aliasing". Fix named: "subdivide the asteroid mesh for a smooth organic silhouette, use higher-resolution triplanar or non-stretched displacement/normal/albedo maps with crisp regolith and crater-rim micro-detail, and properly anti-alias the bright limb".
- "a large semi-transparent brown streak displays parallel linear stripes with sharp background stars shining straight through it, reading as an artificial smeared billboard or broken motion-blur pass". Fix named: "render passing foreground debris with physically consistent multi-sample 3D motion blur and proper occlusion/exposure weighting, or remove close-camera streaking debris if shutter blur cannot be sampled cleanly".
- Jurors: "its low-detail, blobby, procedural-looking texture sits over a plain starfield, along with a smeared streak that looks like screen-space motion blur"; "the distinctly particle-effect appearance of uniformly streaked asteroid debris"; "the stepped low-sample real-time motion-blur artifacts on the passing rock alongside the simple procedural noise-displaced asteroid mesh"; "simple, low-detail asteroid geometry"; "simple faceted geometry and soft texture against a point-sprite starfield, with rasterized rather than filmic motion blur".

The cure:

1. The hero rock is a film asset at the judged frame: a silhouette with no straight segment at the final tier (edges under 2 px on screen), surface detail that holds at native size with at least two texels per pixel and no stretch (craters with sharp rims, boulders, fractures, fine regolith), hard sunlight with a crisp terminator and deep shadow, a faint cool fill so the night side parts from the sky, a clean anti-aliased limb. It is larger in frame and sits about a third in from the edge at 2782, whole and clear of every edge for at least twelve frames round it. A generated photo-real rock texture with a recipe is allowed (`kit/06-ASSETS.md`), a stock or extracted one is not.
2. The near rock's pass is one smooth blur with no stripe and no step at every tier, with the stars behind it dimmed by its coverage; or it passes slowly enough to read as a rock with motion blur and not as a bar. If neither holds at native size, take that rock out of the judged frame's window.
3. Sparse stays: "a few dark rocks tumble past close to the lens with motion blur. Sparse. It is a beat, not a field."
4. The small smudges round the rocks at 2782 are dust motes, another agent's (A). The star look is B's.

Yours as before (`src/space/belt`, `public/assets/shared/belt`, `assets-src/belt`). The camera of `mars.travel` may change a little in this round (the travel agent, D): place the rocks from the camera as the film gives it, not from copied numbers.

Send: finals of 2772, 2777, 2782, 2787, 2792 with native crops of the hero rock (limb and lit face) and of the near rock's blur, before and after; the review tier sheet of `mars.travel`.

