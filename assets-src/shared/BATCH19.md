# Engine batch 19: frames that do not repeat

Branch `agent/engine-batch19`, cut from `agent/engine-batch18` 3189ca82, main `a67c9c34` (engine batch 18) merged in at `482de8a`. Task from the Builder's mails 59, 61 and 62 (22 Nov, 02:53 to 03:10 UTC). PART at 04:00 UTC, DONE when the audit, the shared fixes, the stop lists and the shared check are in.

## Working notes (read after a compaction)

State at 03:52 UTC (VM clock): items 1 to 4 of mail 62 stand, the report is below. Commits on the branch after the merge `482de8a`: `0d8172c` notes, `65e7d63` `tools/repeat.ts`, `d4a7ab6` relief, `206ada0` sky band, then the audit script and this report. Main held: `0622510` (a67c9c34 plus three progress commits). Main has moved on to `76825c7` (progress commits only, no `src`, no config); not merged, the Builder says when.

Scratch (untracked): `out/scratch/tr3.ts` (reads the sample target back after each draw, can patch shader text in the page), `/tmp/rep/` (pictures of every run), `/tmp/aud2/` (the `src` tree of every stop branch as fetched at 03:36 UTC).

## The cause

The harness GPU (Chrome with SwiftShader) shades 2 x 2 pixel quads, four lanes at a time. A lane that hit `discard`, or that sits outside a per pixel `if` or `for`, keeps running but stops storing to local variables and to function parameters. `dFdx`, `dFdy`, `fwidth` and `texture()` without a level read the neighbour lanes of the quad. If the value they read was first assigned after the discard or inside the branch, the dead lane holds whatever the memory held before, and the live neighbour gets a wrong derivative or a wrong mip level. That is undefined: it is often stable from run to run, and sometimes it is not.

What I measured before the Saturn agent's finding reached me, on Saturn 3594 at draft: the stream of WebGL calls is the same in every render, the sky and the stars are equal after their draws, the first draw that differs is always Saturn's haze shell, whose fragment shader discards first and then calls `ringShadowAt`, which takes `dFdx(rho)`. With the discard moved to the last statement the five Saturn frames gave one hash each in 17 renders. So the two findings agree.

Two classes follow from it, and the lists below use these letters:

- R, real: the operand of the cross pixel operation is first assigned after a per pixel `discard` or inside a per pixel branch. Dead lanes hold stale memory. Must be fixed.
- F, formal: the cross pixel operation is inside a per pixel branch or after a discard, but its operand is a varying or a variable assigned before, in flow that every lane runs. All lanes hold the right value, so the result is defined. No frame was seen to change from these. They are one edit away from R, so the fix is cheap insurance.
- D: only the texel map of diag 2 is touched (`diagTexels`), no beauty pixel.

## Audit of shared code

Every fragment shader in `src/core`, `src/space` (sky, stars, flight, belt passes, rock, dust), `src/terrain`, `src/bodies`, `src/post` and the accumulator, read by hand and with `tools/shaderaudit.py`. All fragment shaders of the film are our own `ShaderMaterial` sources in `src/**/*.ts`.

| Where (lines of main a67c9c34) | What | Class | Done |
| --- | --- | --- | --- |
| `src/space/sky.ts:130` | `gradTexel(uBand, bc.xy, dx, dy)` called inside the per pixel band loop (`bc.z > 0.0`). Inside the call `uv` is a parameter, stored only in live lanes, and `gradTexel` takes `dFdx(uv)` and an implicit `texture()` | R, latent: the band weight is near 0 where the quads straddle the edge, no frame was seen to differ | Fixed, `206ada0` |
| `src/terrain/relief.ts:218, 234` | `diagTexels(uv * uSize)` after `if (alpha < 0.004) discard;` | D | Fixed, `d4a7ab6` |
| `src/core/texel.ts:30` | implicit `texture()` inside the per pixel `plain` loop of `gradTexel` | F when the caller is in uniform flow | Left: this is the fast path of capture mode. Rule for callers below |
| `src/space/sky.ts:106` | `patchTexel`: implicit `texture()` inside the `p.z > 0.0` loop (capture mode, `PATCH_IMPLICIT`) | F: `p`, `dx`, `dy` are assigned before the loop | Left: hoisting costs 8 lookups on every sky pixel |
| `src/space/sky.ts:18, 19, 125, 126`, `src/terrain/relief.ts:199`, `src/core/accumulator.ts:14` | derivative or lookup inside `a ? b : c` | F (seam choice on values assigned before) or uniform condition | Left |
| `src/bodies/haze.ts:105` | early per pixel discard, nothing cross pixel after it | clean | A trap if a derivative is ever added below it |
| `src/space/belt/belt.ts:49` | flagged by the script | false positive: the loop bound is a constant | |

Clean: `src/bodies` planet, moon, globe, stand in (every branch on uniforms, `fwidth` at the top, discard last), `src/space/belt/rock.ts` (its per pixel `break` has no cross pixel operation near it), the belt passes, the dust, the post chain and the accumulator (uniform flow, no mip maps), the Sun glare of the sky (`fwidth` in a uniform loop), the air shader of the relief (uniform discard). No variable declared without a value is used in a cross pixel operation anywhere in `src`.

Rule for every caller of the shared helpers: `equirect`, `equirectGrad`, `gradTexel`, `texelPlan`, `diagTexels`, `diagTexelsDir` and `patchTexel` hold a derivative or an implicit lookup. Never call them inside a per pixel branch or after a per pixel discard. Call them before, keep the result, and gate the result.

## The two fixes

1. `d4a7ab6` `src/terrain/relief.ts`: the texel measure is taken before `if (alpha < 0.004) discard;` and passed to `diagOut`. The early discard stays where it is, because it saves the valley work and nothing cross pixel follows it now.
2. `206ada0` `src/core/texel.ts`, `src/space/sky.ts`: `gradTexel` is split. The new `texelPlan(tex, uv, dx, dy)` holds the `dFdx(uv)` and returns the choice (implicit or gradient lookup, and the bias). The sky calls `texelPlan` before the band loop and does the lookup inside it on `bc.xy`, which every lane holds. `gradTexel` itself calls `texelPlan`, so its other callers get the same result as before.

## Proof

Reference: the tree equal in `src` to main a67c9c34, 53 draft frames, three renders each in one session (`/tmp/t10-main-sweep.txt`, 734 s). 49 frames gave one hash. Four did not repeat: 3465 (2 pictures in 3), 3594, 3840, 3866 (3 pictures in 3). 3567 repeated in that sweep.

With the two fixes (`206ada0`), same 53 frames, one fresh session, one render each (254 s): all 49 frames that repeat today are byte equal to the reference. No frame changed, so there is no pixel count to list. The four Saturn frames stay as they were, because their cause is in the stop folder: 3465, 3594 and 3840 gave one of the pictures the reference had, 3866 gave a fourth.

A second run on the committed tree, the same 53 frames over two fresh sessions, one render each (492 s): the 49 frames again one hash each and byte equal to the reference; 3465 gave the same picture twice; 3594, 3840 and 3866 gave two pictures in two renders. So over the three fresh sessions with the fixes every frame that repeats on main keeps its bytes, and the only frames that do not repeat are Saturn's.

Mars's four at the final tier, against the stored baselines, all equal:

| Frame | Role | sha256 | Samples | Seconds |
| --- | --- | --- | --- | --- |
| 2325 | hold | `9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d` | 16 | 33.6 |
| 2580 | terrain | `a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8` | 16 | 41.6 |
| 2427 | dive | `0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814` | 64 | 77.6 |
| 2726 | rise | `79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05` | 64 | 66.3 |

Mars's four at draft: 2325 `fd128b1a999f76fa`, 2427 `5636a9764d87cc2e`, 2580 `7322ef9576f06ffb`, 2726 `d408b434a0b12d9f`, equal before and after.

`npx tsc --noEmit` clean. `npx vitest run`: 15 files, 79 tests, all pass.

## Lists for the stop folders

Lines are those of each stop's own branch as fetched at 03:36 UTC; where the branch equals main the lines are main's. The stop agents had the cause by then and several had already cured their part.

### Venus (`agent/venus` 97b2155)

Cured by the Venus agent in `47d7c6b`, and the cures are the ones my probes had proved on b6f5426 with shader text patched in the page:

| File and line on b6f5426 | What was wrong | Class | Change | Proof |
| --- | --- | --- | --- | --- |
| `src/stops/venus/globe.ts:297 to 305` | `equirect(uMap, from)` inside `for (inner < (ring > 0.0 ? 1 : 0))`, `from` first assigned inside | R | Run the block for every pixel (the weight is 0 where `ring` is 0), or take `from` and the lookup above the loop | First draw that differed on 1300 and 1307 was the globe, 9 to 13 limb pixels. With the loop unconditional 1300 gave one hash in 8 renders (4 pictures in 4 before). The cure moved 2 to 4 pixels by 1 level |
| `src/stops/venus/veil.ts:91, 120 to 122` | `dFdx(uv)`, `dFdy(uv)` inside `for (pass < (mask > 0.0 && uAmount > 0.0 ? 1 : 0))`, `uv` first assigned inside | R | Loop on `uAmount > 0.0` alone (lines 144 and 145 already multiply by the mask) | On 1307 with the globe cured the veil draw differed in 3 pixels at (196 to 197, 940 to 941) by hundreds of half float codes, and the bloom spread that to about 1100 pixels. With the loop on `uAmount` alone 1307 gave one hash in 6 renders. The cure moved about 2270 pixels on 1307, 38 levels at most |
| `src/stops/venus/relief.ts:176, 181` | `diagTexels` after `if (alpha < 0.004) discard;` | D | Take it above the discard | |

On 97b2155 the script flags nothing in `src/stops/venus`, and `npx tsx tools/repeat.ts --frames 1300,1307 --sessions 2 --runs 3` on that tree gives one hash per frame in 6 renders over two fresh sessions (1300 `54956204382588fc`, 1307 `d7e529f228d83dea`, 86 s).

Still open, formal only: `globe.ts:324` takes `dFdx(bq)` and `dFdy(bq)` inside `bn > 0.3 && ... ? ... : vec3(0.0)`; `bq` is assigned on the line above, so every lane holds it (F). Cheap insurance: take the two derivatives into locals above the line. `globe.ts:234, 235` is the seam choice (F, leave).

### Saturn (`agent/saturn` eae3b0e)

On main a67c9c34 Saturn still has the cause of the frames that do not repeat (3465, 3567, 3594, 3840, 3866): `src/stops/saturn/globe.ts:243, 247` (the haze shell discards, then `ringShadowAt`, whose `dFdx(rho)` is in `profile.ts:41`), R, proved. Also on main: `rings.ts:230, 246` discards followed by `dFdx(rq)` at 247 (F), `dFdx(q)` at 290 and 291, `dFdx(miss)` at 346 (R if assigned after 246), implicit `texture(uPolarWarp, ...)` at 257 and 258 inside a per pixel loop on `ua`, `re`, `e1` first assigned inside (R), 224 and 311, 312 (F), `globe.ts:146, 147` (F and D).

On the Saturn branch all of these are cured. Moving the shell's discard to the end moves pictures, as measured here on main: 3 to 8 pixels by 1 to 2 levels on 3465, 3567, 3594, 3840, and 36 pixels by up to 26 levels on 3866 (limb pixels whose random part was large).

Still open on eae3b0e, formal only: `rings.ts:400, 401` and `417, 418` take `dFdx` and `dFdy` of the varying `vLocal` and of `rp` (assigned at 305, before) inside the per pixel loops at 396 and 414 (F). Change: take the four derivative vectors above the loops.

### Mercury (`agent/mercury` 5ba7f45, equal to main in these files)

| File and line | What is wrong | Class | Change |
| --- | --- | --- | --- |
| `src/stops/mercury/sunplate.ts:33, 34, 40` | `uv` is assigned at 34, after `if (p.z > -1e-3) discard;` at 33; `texture(uMap, uv)` at 40 reads it across the quad | R in principle. A live pixel next to one behind the plate has `uv` far outside 0 to 1 and is cut at 35, so I could not make it show | Assign `uv` before line 33, or join the three discards into one after the last statement |
| `src/stops/mercury/lens.ts:33, 36, 40` | `uv` is assigned at 36, after `if (d < 1e-4) discard;` at 33; `texture(uMap, uv)` at 40 | R in principle (only where `d` is under 1e-4); the discard at 37 is F | Same: one discard at the end |
| `src/stops/mercury/skyplate.ts:39, 43, 44` | `dFdx(uv)`, `dFdy(uv)` after the discard at 39 and inside the `inside > 0.0` loop; `uv` is assigned at 35 | F | Take `gx`, `gy` above line 39 |

`globe.ts:337`: discard is the last statement, clean. `globe.ts:263, 271, 272`: uniform condition and seam choice, leave.

### Jupiter (`agent/jupiter` 54dee1b)

`src/stops/jupiter/deck.ts:164 to 167`: `dFdx(vGround)`, `dFdy(vGround)` inside `for (k < (nearby * alpha > 0.0 ? 1 : 0))` (F, a varying). Change: take `wx`, `wy` above the loop. `io.ts:79`: `fwidth(pm)` inside `front < depth ? ... : 1.0`, `pm` assigned before (F): take `fwidth(pm)` into a local above. `globe.ts:257, 258`: seam choice, leave. The discards at `globe.ts`, `deck.ts` and `io.ts` are on `uDiag` only.

### Neptune (`agent/neptune` 7c74466)

`src/stops/neptune/closeup.ts:133` and `168`: `diagTexels(...)` inside the per pixel loops at 120 (`deckHit`) and 143 (`slabHit`) on coordinates assigned inside (D: the texel map of diag 2 only, it can flicker on the deck edge). Change: compute the two `diagTexels` values above the loops from coordinates every lane holds, or accept it for the diag map. `planet.ts:228, 229, 286, 287`: seam choice, leave. `air.ts`: early discard, nothing cross pixel after it.

### Earth (`agent/earth` 3b3819e)

Cured by the Earth agent in `3b3819e` (discards moved behind the last statement). On main a67c9c34 it was: `air.ts:89, 90` implicit `texture(uMap, vec2(turn, uRows.y))` inside `if (h < 0.0)`, `turn` assigned before (F); `relief.ts:136, 139` `diagTexels` after `if (texel.a < 0.004) discard;` (D). The script flags nothing on 3b3819e.

### Sun (`agent/sun` ce1994c), Uranus (`agent/uranus` 19b03e1), Mars

Nothing to change. Sun: the script flags `ground.ts:206` (`surface()` in a per pixel loop), which is a false positive: `surface` uses `textureLod` and `textureGrad` only. `ground.ts:166` picks between `diagTexels` values by `bare` (D, complete operands); `corona.ts:76, 77` and `globe.ts:147, 148` are the seam choice. Uranus: `deck.ts:193, 194` seam choice; its early discard has nothing cross pixel after it. Mars has no shader of its own with the pattern (it runs on the shared relief, sky and bodies).

## The check

`npx tsx tools/repeat.ts` (or `npm run repeat --`):

- `--frames a,b,c` (default: the middle frame of every segment that is not travel; `--stop ID` narrows that to one stop)
- `--sessions N` fresh browser sessions (default 2), `--runs N` renders of the whole list inside each session (default 2)
- `--tier` (default `draft`), `--format`, `--assets`, `--diag`
- `--keep DIR` writes one PNG per distinct picture as `FRAME-HASH.png`

It prints one line per frame, `frame F distinct K of N HASH xCOUNT ...`, then `repeat: ... not repeatable: ...`, writes `out/work/repeat/result.json` and exits with 1 if any frame gave more than one picture. It repeats both ways, inside one session and over fresh sessions. Saturn's frames already differ between runs inside one session; a fresh session starts from other memory, so it is the harder test.

Time on this VM (4 cores) at draft: about 4.6 s per render, plus about 11 s for the first frame of a fresh session. Measured: 53 frames, 1 session, 3 runs, 734 s; 53 frames, 1 session, 1 run, 254 s; 2 frames, 2 sessions, 3 runs, 86 s. 53 frames, 2 sessions, 1 run, 492 s. A stop agent that checks its own six frames with the defaults (2 sessions, 2 runs, 24 renders) waits about two minutes.

`tools/determinism.ts` is a different check: it compares forward against reverse order at the review tier, once.

`python3 tools/shaderaudit.py [ROOT] [path prefixes]` is the static side: it reads the GLSL template strings under `ROOT/src` and prints every `dFdx`, `dFdy`, `fwidth`, implicit `texture()` and every call of a helper that holds one, where it sits inside a per pixel `if`, `for` or `while` or after a per pixel `discard` or `return`. A condition counts as uniform when it is made of `uName` uniforms, constants and loop counters only. It takes under a second. Its limits: it does not tell R from F (read the operand), it matches helpers by name over the whole tree (so `surface` in the Sun's ground and the loop bound `n` in `belt.ts:49` are false positives), and it does not look inside `a ? b : c`; for those, search for a `?` followed by one of the operations.

## Weak points

- The fixes in shared code cure a latent case and a diag map; no frame on main was unstable because of shared code. The frames that do not repeat on main are Saturn's, and they stay so until the Saturn branch lands.
- A static audit cannot prove the absence of the pattern, and a repeat count cannot prove repeatability: 3567 repeated three times in the reference sweep and is known to differ. A frame is cleared only by both: nothing real in the audit and one hash over several fresh sessions.
- The F cases left in shared code (`gradTexel`'s fast path, `patchTexel`, the seam choices) rest on what SwiftShader does: dead lanes still compute, they only do not store. That holds for the harness GPU of this film; on a real GPU derivatives inside non uniform flow are undefined by the standard, but those paths are the capture mode's.
- The Mercury cases marked "in principle" were not reproduced.
- Main moved to `76825c7` while I worked (progress commits only); the branch holds `0622510`.

## Mail 66: main merged, the travel branch tried (03:52 to 04:00 UTC)

Working notes: step 1 done (`5462ce8`, main 76825c7 merged). Step 2 done, below. Step 3 waits for the Builder's word that `builder/b19-pre` is pushed: then `npx tsx tools/repeat.ts --frames 482,495,1625,2772,3912,4502,5085,5235 --sessions 3 --runs 2` on that tree (about 11 minutes, travel frames take about 12 s each at draft) and one line per frame back.

Scratch merge of `agent/travel` fd4fad6 into this branch (not committed, not pushed): `src/space/sky.ts` merges clean (automatic), `npx tsc --noEmit` clean. `python3 tools/shaderaudit.py` over the merged tree flags nothing new: the same lines as before in shared code and in the stop folders of main.

The two new shader parts, read by hand:

- The dust veil in the sky shader: inside `if (uFlightGlow.w > 0.0)`, a uniform branch; the map is read with `textureLod` at level 0; the dither is `fract(sin(dot(gl_FragCoord.xy, ...)) * 43758.5453)`, a function of the pixel's own position. No discard, no derivative, no implicit lookup. Clean.
- `DEEP_FRAG`, the second point set: `gl_PointCoord`, two varyings, one `exp`. Clean. Its material is a clone of the star material and is fed the same way as the first flight set (pixel size, exposure and the two patch textures every frame, the patch uniforms shared).
- `src/space/travel/field.ts` holds no shader. The veil map and the second point set are built on the CPU from seeded streams and `hash01`, in a fixed order, so they are the same in every session.

Measured on the scratch merge: the eight travel frames over two fresh sessions, one render each, 227 s, one hash per frame (482 `6d20b8c85f00e654`, 495 `6c902577dcb78811`, 1625 `5ec0dae7cd3a0888`, 2772 `7b6281cc532b870c`, 3912 `2a334ee7272dc582`, 4502 `589c5246dcfda7cb`, 5085 `f9e1eb89d9f3a6aa`, 5235 `99cdf5b608e5cb3c`).

One thing that is not about sessions but about machines: the dither multiplies `sin` of a number up to about 1e5 by 43758 and keeps the fraction, so the last bit of the GPU's `sin` decides the value. On one machine that is the same every time. Between machines with another CPU type or another Chrome build it need not be, and no other shader of the film leans on the last bit in that way. An integer hash of `uvec2(gl_FragCoord.xy)` (multiply, shift, xor on `uint`) gives the same bits everywhere. The pattern is also fixed to the screen and equal in every sample and every frame, by design of a dither. I did not render stop frames on the merge.

## Mail 70: the check on the candidate (04:14 to 04:29 UTC)

`builder/b19-pre` 90e5294 (main 45c3e55, this branch at 1a62f85, `agent/travel` 4681511 with the dither as an integer hash). `npx tsx tools/repeat.ts --frames 482,495,1625,2772,3912,4502,5085,5235,3465,1586 --sessions 3 --runs 2`, 807 s, none loose, six renders per frame over three fresh sessions:

| Frame | Pictures | Hash |
| --- | --- | --- |
| 482 | 1 of 6 | `baa1a86f77233ac2` |
| 495 | 1 of 6 | `5427fe2de8c15b0e` |
| 1625 | 1 of 6 | `87f2dc2b6aab8174` |
| 2772 | 1 of 6 | `eab741fd766b6df3` |
| 3912 | 1 of 6 | `d37fb4125effdb8d` |
| 4502 | 1 of 6 | `ba614dbb7dca7ded` |
| 5085 | 1 of 6 | `adbae17d86bcf871` |
| 5235 | 1 of 6 | `99cdf5b608e5cb3c` |
| 3465 | 1 of 6 | `9a5e9f2fe36a984e` |
| 1586 | 1 of 6 | `29f813e000c03a5c` |

3465 did not flip in these six renders. Its two pictures `9a5e9f2fe36a984e` and `703aa40f17b90e2a` are the same two that main a67c9c34 gave in the reference sweep before any travel change (2 and 1 of 3), so the flip the travel agent saw is Saturn's stale lane and no new fault. Six equal renders do not clear the frame; it stays loose until Saturn's cure lands.

## Mail 73: step 4, check of the stop branches (working notes, not committed by order: "nothing is committed anywhere by this step")

Batch 19 is on main at 7a880ac6. Task (04:38 UTC): for each stop branch, on a scratch merge of the branch head into today's main (a45a07bc), report one block per branch as soon as it is done (high priority mail to /root): (1) files that differ from main outside `src/stops/<stop>`, `public/assets/<stop>`, `assets-src/<stop>`; (2) `npm run build`, `npx vitest run`; (3) `python3 tools/shaderaudit.py` lines left in the stop folder with class R, F, D; (4) repeat of its own frames, 3 sessions, 2 runs; (5) the other stops' frames and eleven travel and ending frames at draft against main, one render each. Order: venus 42b9111, jupiter (79fb6eb at fetch), neptune (6c4c455), saturn (c5a7fa2; item 4 is what matters: 3465, 3567, 3594, 3840, 3866), sun (8249c1b), mercury (5ba7f45), earth (1303ecf), uranus (2c9990a). A merge that conflicts: say where, go on.

How: scratch tree `/home/user/workspace/dev` (never commit there). Driver `/tmp/gen/step4.sh STOP BRANCH MAIN` run detached, results in `/tmp/s4/STOP/` (progress.txt ends with ALLDONE; merge.txt, conflicts.txt, outside.txt, outside-stat.txt, config.txt, build.txt, vt.json, audit.txt, own.txt, others.txt, compare.txt). Main reference: `/tmp/s4-main.log` (53 stop frames from `/tmp/gen/f53.txt` plus travel and ending 495, 1072, 1642, 2212, 2782, 3352, 3922, 4492, 5085, 5235, 5362 from `/tmp/gen/ftravel.txt`), pictures in `/tmp/rep/s4-main`. Own frames of a stop are its frames in the 53 list (they hold the judged ones: hold 0.5, dive 0.3, terrain 0.5, rise 0.75). Saturn's 3465, 3567, 3594, 3840, 3866 are loose on main, so a difference there in another stop's merge is not that stop's fault.

Own frames now also hold the dive and rise middles (driver changed after Venus). Main moved to 2621f00 (kit/PROGRESS.md only); reference stays a45a07bc. Heads at 05:00: jupiter 46d808a, neptune 26ca948, saturn a4340f0, sun 21c5e09, mercury ff0c7f2, earth eb7a529, uranus 4bfd924 (take the newest head when a branch's turn comes).

Blocks sent: venus (05:02; clean, 1072 moves by Venus's own sky patches). jupiter 46d808a (05:12; clean). neptune 26ca948 (05:23; own files clean, 8 own frames repeat, but Uranus's judged rise 4436 and travel 4492 move: the sky behind turns, because film.ts takes the sky turn of a rise and of travel from the next stop's orbit turn and Neptune's plan.ts now steadies its hold; ending 5085, 5235, 5362 move by Neptune's own body). saturn 68ae940 (05:35; clean, no audit line left, 8 own frames one picture in 6 renders, 58 of 58 others equal; promised: more sessions on 3465 after the list, report only if it flips). sun f34c042 (05:44; clean; outside files are main 439cffd's own; ground.ts helper renamed surface to boiled, honest: textureLod and textureGrad only; 6 own frames repeat; 55 of 59 others equal, rest Saturn's loose). Sun moved to b8d0f88 (globe.ts boil, look.ts): promised a second run at the end. mercury 1a18e50 (06:05; own clean, 8 own frames repeat; moves 1072 (other view), 495 (stars shift), Sun 0, 60, 90, 247, 360 at rounding level: rise params changed in plan.ts, world pinned at Mars so Sun and Mercury are placed anew; proved with /tmp/probe.ts on /tmp/m0 and /tmp/m1, a node print of director.frames and sky.orbits). earth 3afb552 (06:08; clean; 1642 moves faintly by its own sky-hold patch; placement equal). Mail 78 (06:04): the Builder accepts the moves of Mercury (1072, 495, Sun) and Neptune (4436, 4492) as coming with the merge, nothing asked of the stops; after step 4, round 31 fix branches (agent/dust, flightsky, ending, travel, belt, sun-hook, neptune-ending; briefs in assets-src/shared/ROUND31-FIXES.md on main) will be sent for shader audit and repeat on a scratch merge, first about 07:30 UTC. uranus d40f476 (06:15; clean, 54 of 58, placement equal). All eight blocks sent, with a summary; later heads venus 209bf6d, jupiter 4bfe0c9, neptune 3af6a54, earth 9f49c8b, mercury 2843962 add no src or public file. Sun block 5b sent 06:23 (aea8bf5: clean, 6 own frames repeat, 55 of 59, placement equal). Saturn 3465: 24 of 24 one picture 342bc5667acea0b2 (06:28), reported. STEP 4 FINISHED, all sent. Waiting for the round 31 branches (mail 78): shader audit and repeat on a scratch merge, as for batch 19; driver /tmp/gen/step4.sh and probe /tmp/probe.ts can be reused.

## Mail 83: trial merge 1 of the round 31 branches (06:44 to 06:50 UTC, no renders, nothing pushed)

Local branch `scratch/trial1` in `/home/user/workspace/dev` at 7731493 on main cade3821: belt afc615a9, sun-hook a01cc33e, neptune-ending b50e8c16, dust efb0a85c, travel 5540b792 clean; ending c1859944 conflicts only in config/showcase.json (the one line `travel.sky`: travel adds patchFrom.uranus 0.6, ending changes retreat and retreatGlare and deletes retreatGlow, retreatOpen, retreatClose, retreatLead; resolved by hand, both). Build, tests, tsc pass; audit equals main's list. Placement and sky turns equal to main (probe). Found: sun-hook conflicts with agent/sun in src/stops/sun/set.ts (lines 46 and 47, keep both); ending redefines `wp` that the retreat's dustOffset line reads; dust no longer passes `this.belt.cover(shot)`. TRIAL 1 sent 06:50. Next (mail 83): at 07:30 UTC the Builder sends final heads for the full audit, repeat run and second trial merge (flightsky was not pushed yet). Results of trial 1 in /tmp/t1/.

## Mail 87: audit 1 of sun-hook 739ae28 and ending 41e144e (07:07 to 07:16 UTC)

Local branch `scratch/audit1` in the scratch tree at 74f8cfa on main 6133663 (nothing pushed). Both merge clean, build and tests pass, audit list equals main's, placement equal (probe). Repeat 3 x 2 at draft, one picture each: 0 `0679ccde53820e23` (equal to main's frame 0), 30 `fdc89d7f3249edac`, 60 `19d4cd51636e1052`, 90 `bf614a99e8524fbe`, 5030 `290409dd1a1be6d3`, 5085 `85a1f01f88faf779`, 5140 `e6f43e322bb4f451`, 5235 `acf614dcbbded727`, 5362 `70ba318c3225d571`. Kept frames equal to main: 90, 247 `88c6f79c3b1fff8d`, 360 `fcbfbf2f25bffb63`, 5006 `0f98d86afb926556`, 5024 `57de63d6b8da41ee`. AUDIT 1 sent 07:16. Next: the other five heads (belt, neptune-ending, dust, travel, flightsky) at about 07:30 UTC, same audit, then TRIAL 2 on all seven. Method: main reference of the kept frames first, then merge in the scratch tree, build, test, audit against an archive of main, `tools/repeat.ts`, probe; results under /tmp/a1/.
