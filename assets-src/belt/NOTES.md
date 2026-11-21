# Belt lab notebook

After a compaction: read `BRIEF.md` first, then this file from the top.

## State (update on every push)
- Started 02:56 UTC, Nov 21. Branch `agent/belt` from origin/main `2cbceef`.
- Looks pusher: `npx tsx assets-src/belt/pushlooks.ts --note "..."` (the stock `npm run looks -- --push --folder belt` throws "expected --folder STOP" because `belt` is not a stop id; this script does the same git steps for the folder `belt`). Tell the Builder in the first report.
- Probe: `npx tsx assets-src/belt/probe.ts` prints camera, sun and Jupiter per frame.

## Baseline hashes (plain origin/main 2cbceef, `npm run still -- --frame N --tier final`)
- 2325: 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d
- 2427: 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814
- 2580: a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8
- 2726: 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05
- Files kept in `out/work/belt/base/` (not committed). Draft baseline of 2782 without the belt: 19.4 s.

## Measured facts about mars.travel (frames 2745 to 2819, judged 2782)
- vfov 30 all through, 1920x1080 master, about 36 px per degree. Exposure 1.0.
- Mars disc leaves through the top of frame by about 2761. Jupiter approach begins u 0.2964 (frame 2767).
- Camera turn per frame in degrees: 2755 2.2, 2760 5.1, 2765 8.6 (peak, about 310 px per frame), 2770 4.7, 2775 2.0, 2778 0.9, 2780 0.42, 2782 0.14, 2784 0.15, 2786 0.36, 2790 1.1, 2795 2.1, 2801 2.69, 2805 2.5, 2810 1.67, 2815 0.59, 2819 0.01. Calm window 2779 to 2787. Sky content moves left and up in the first turn and left in the second.
- Jupiter screen centre and radius in px: 2768 (1833,1096) 0.27; 2775 (1395,575) 3.5; 2780 (1333,471) 14.5; 2782 (1322,464) 23.5; 2784 r 36; 2790 (1251,478) 104; 2795 r 192; 2800 (1103,508) 292; 2805 r 379; 2810 r 434; 2819 (960,539) 461.
- Sun in camera space at 2782: (-0.96, 0.19, -0.18), from the left and slightly up. At 2819: (-0.71, 0.13, 0.69). Sun colour (1, 0.9, 0.72), intensity 3.
- Travel is a fast kind: samples per frame draft 1, review 16, final 64.

## Design (decided before code)
- One belt image per film frame: at engine sample 0 the module renders all rocks with its own time steps across the shutter (shot queried through `director.shotAt(frame, time)`), caches the premultiplied layer, and composites it over `sampleTarget` in every engine sample. Compositing is linear, so this equals compositing on the average. Raw diagnostic views draw the meshes directly with `diagOut`.
- Per rock: T time steps (by motion in px and tier), each drawn to a scratch target and summed; one directional blur along the screen motion with length equal to the step spacing closes the gaps, so the streak is continuous at every tier. Then a disc blur by the circle of confusion, then composite far to near.
- Depth of field only on the near side: coc = K * max(0, 1/d - 1/dFocus).
- Motion in a camera centred, world oriented frame: p(t) = P + W (t - tj) - F S(t). F points at Jupiter at the judged time, so rocks stream away from it. The pan carries rocks in from the right and bottom, the second swing carries them out to the left.
- Tumble: closed form axis and angle per rock.
- Geometry: cube sphere displaced by baked heights, LOD grids per face. Not a sphere, not a card.
- Assets baked offline by numpy (`bake.py`): per rock normal times AO cube and albedo cube, height cube for ray marched self shadow, shared detail tile, vertex heights. Recipe in `RECIPE.md`.
- Shading: sun from `shot.sun.dir`, Lommel-Seeliger and Lambert mix, self shadow, thin rim on the sunward limb, faint cool fill times AO, gain 1 / exposure. Style target Phobos in `references/approved/mars-hero.png`.
- Hook: field `belt`, `prepare`, `ready`, one `render` call in `renderSample` before `if (raw) return`. Saved as `engine.patch`.
- All rock numbers and the segment id in `src/space/belt/belt.json`.

## Log
- 02:56 clone, npm ci, build ok. Read kit and code.
- 03:00 baseline final renders started detached (`/tmp/baseline.sh`, log `/tmp/baseline.log`).
- 03:05 probe written and run, facts above.
- 03:08 notebook and looks pusher written. First push.

- 03:12 baseline done, four hashes above.
- 03:14 `bake.py` (numpy, procedural) and `preview.py` (offline ray cast of the baked maps). Take 1 too noisy (ridged relief hid the craters), take 2 lowers the relief and the regolith noise. Takes live in `out/work/belt/bake/takeN/`.
- 03:17 found: the dust offset in the travel moves dust particles toward Jupiter (probe: flow direction dot Jupiter direction = +0.987). The rocks use the same closed form with the sign flipped (`flow: -1`), so they come from Jupiter's side toward the lens. Tell the Builder.
- 03:19 planner `npx tsx assets-src/belt/plan.ts [--all]` prints per frame screen position, radius, circle of confusion, speed and whether a rock touches Jupiter. With the first layout: hero in frame 2769 to 2798, near 2770 to 2786, far1 2767 to 2801, far2 2774 to 2791, no rock on Jupiter.
- 03:25 module written (`motion.ts`, `store.ts`, `rock.ts`, `belt.ts`), hook in `src/core/engine.ts` (5 lines, saved as `engine.patch`). First draft still of 2782 shows all four rocks. Draft cost 22.0 s with the belt against 19.4 s without.
- Weak now: rocks too pale and too yellow, near rock reads as a flat tan blob, dark sides almost black, craters could be crisper. Assets (take 2) are in `public/` locally only, not committed yet.

- 03:28 first report sent to the Builder (commit 322bd06). Light retuned in belt.json: tint cooler so sun colour times tint is a warm grey, gain 0.24, fill up five times, detail tiles 1.1 and 4.3. Bake take 3 started: more and sharper small craters, albedo streaks along the groove axis, darker pits, brighter slopes.

- 03:31 diag views run at 2782 (`out/work/belt/diag-*.png`): texels yellow on hero and far rocks (counted, above 2 texels per pixel), near rock red without the counted flag (coc 47 px), layers colour (0.6, 0.4, 0.8), depth grey. The raw path works.
- 03:33 take 3 installed in `public/.../full/` (28 MB). Shader: `light.seeliger` 0.25, `light.contrast` 1.7 (power on the albedo tone), `light.lift` 1.5, bump 1.25. Hero now darker with readable craters.
- 03:39 draft strip of 12 frames 2767 to 2800 (`out/work/belt/s1/strip.jpg`): all rocks enter and leave, Jupiter never covered. Bright points seen "through" rocks are dust motes drawn after the belt (in front of the rocks), not stars: checked at (1029,248) against the baseline.
- 03:42 streak filter changed from a box of one step spacing to a tent of two (linear reconstruction between time steps), max steps 64. Fill raised to (0.034, 0.038, 0.05) so the night side reads against the sky. Detail 0.7.
- 03:46 near rock: at [0.86, 0.93], tilt [-80, 10, 200] after four tilt tests (`out/work/belt/tilt*.png`), shows a lit crescent and a large dark side instead of a pale blob.
- Wrote `web.py`, `RECIPE.md`, `ENGINE-REQUESTS.md`.

- 03:46 pushed 39783f6 and looks. Review sheet of the segment started (`/tmp/sheet.log`), about 70 s per frame at review on this VM (16 samples), 12 frames: 2745, 2752, 2758, 2765, 2772, 2779, 2785 or 2786, 2792, 2799, 2805 or 2806, 2812, 2819.
- 03:48 `npx vitest run` green (6 files, 24 tests). The repo config only runs `tests/`, which is not mine, so the belt test lives in `assets-src/belt/belt.test.ts` and runs with `npx vitest run --config assets-src/belt/vitest.config.ts` (4 tests: rock count, closed form, every rock outside the frame at both ends of the segment and one visit each, all rocks in the judged frame and Jupiter never touched at four times per frame). Green. The Builder may move it to `tests/`.
- 03:49 `see()` in belt.ts now tests the rock sphere against the frame planes (plus half a circle of confusion); before, a rock beside the camera with small depth got a huge screen radius and was drawn for nothing in frames 2751 to 2757.
- Cost plan: `npm run seq` at review over a short run of frames with and without the hook, per frame seconds are in the `.png.json` records; drop the first frame of each run (asset load).

- 03:59 review sheet done (`out/work/sheets/mars.travel-16x9-review.png`). Rocks are in 2772, 2779, 2785, 2792, 2799 of the 12 sheet frames; Mars is still in frame up to 2758. Per frame seconds at review with the belt (from the sheet records): 2745 83.3, 2752 69.5, 2758 61.7, 2765 53.3, 2772 59.7, 2779 57.0, 2785 57.4, 2792 61.5, 2799 67.1, 2806 69.4, 2812 71.7.
- 04:00 web set derived (`python3 assets-src/belt/web.py`, 6.9 MB on disk); draft still of 2782 with `--assets web` loads and renders, softer than full as expected (`out/work/belt/d2782-web.png`).

- 04:12 review sheet with the belt on the merged main: 3 minutes for 12 frames (the sky pass of engine batch 1 is much cheaper; before the merge the same sheet took 13). Records in `out/work/belt/sheet2/`. Engine hash with the hook 6ec52800c697524e; with the hook reversed but the belt files present 737dd9e204c8e41e (main alone is 434d0a5e367a62fd, so the hash counts the new files under `src/`).
- 04:19 byte proof done at the final tier with the hook and the module on the merged main (`out/work/belt/proof/`). All four equal the baseline made on plain main 2cbceef:
  - 2325 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d
  - 2427 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814
  - 2580 a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8
  - 2726 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05
  - The baseline was not rendered again on plain b4ae65c; the Builder states batch 1 is byte identical, and the equal hashes agree with that.
- 04:23 review sheet with the hook reversed (`out/work/belt/sheet0/`). Seconds per frame at review, with the belt and without, same 12 sheet frames, same VM, merged main:

| Frame | With belt | Without |
| --- | --- | --- |
| 2745 (first, asset load) | 33.5 | 33.3 |
| 2752 | 17.7 | 18.2 |
| 2758 | 14.6 | 14.7 |
| 2765 | 9.7 | 9.6 |
| 2772 | 13.8 | 8.4 |
| 2779 | 11.4 | 8.5 |
| 2785 | 11.0 | 8.6 |
| 2792 | 11.3 | 8.2 |
| 2799 | 11.6 | 9.4 |
| 2806 | 11.6 | 11.6 |
| 2812 | 12.4 | 12.2 |
| 2819 | 12.6 | 12.5 |

  - Mean of the 11 frames after the first: 12.51 s with, 11.07 s without. Mean of the five frames with rocks (2772 to 2799): 11.81 s with, 8.61 s without, so the belt costs about 3.2 s per frame where rocks are in frame (5.3 s at 2772, the fastest pan with the most time steps) and nothing elsewhere.
- 04:20 final 2782 (51.4 s) looked at whole and in native crops. Hero holds up. far1 read as a dark shape with only a thin lit edge, so four tilts were tried at draft (`/home/user/workspace/view/ft.jpg`, logged as a look); far1 tilt is now [140, 20, 60], a lit cratered face. far2 keeps its tilt (dark shape with a lit left edge against the Milky Way glow; it sits toward the Sun side of the frame so its crescent is thin at any tilt).
- Faint thin streaks near the hero in 2782 are the film's dust motes, not the belt.
- 04:26 chain started (`/tmp/run3.sh`): final 2782 again, review sheet again (`out/work/belt/sheet3/`), review stills of 2772 and 2796.

- 04:31 final 2782 with the new far1 tilt, review sheet (`out/work/belt/sheet3/`), review stills of 2772 and 2796 at native size: hero streaks smooth, no copies of an edge. Dotted short trails of bright points near the rocks and in open sky at review are the film's dust motes (16 samples), not the belt. Crop pages of 2782 at final made with `npm run crops` (`out/work/crops/`): hero, far1, far2, Jupiter, near rock, sky hold up.
- 04:33 the Builder says main moved to 9f78a4e (engine batch 2: sky and stars not shaded under opaque objects in capture, engine hash 05c29d3a1588e95f). Merged, hook applied again without conflict, patch regenerated, build ok, vitest 28 green, belt test 4 green. The hook still sits after the near scene, so the belt layer goes over the finished sample.
- 04:34 chain started again on the new main (`/tmp/run4.sh`, log `/tmp/run4.log`): review sheet with the belt (`sheet4`), four proof frames at final, final 2782, then hook reversed, review sheet without (`sheet5`), hook applied again and build.
- 04:41 byte proof again on main 9f78a4e with the hook and the module (`out/work/belt/proof2/`): 2325, 2427, 2580, 2726 at final give the same four sha256 as the baseline on plain 2cbceef (listed above). So: four baseline hashes, four hook hashes, pairwise equal, checked on b4ae65c and on 9f78a4e.
- 04:42 final 2782 on 9f78a4e: `out/work/belt/f2782.png`, 55.0 s, sha256 453c2129c026490da2e66a46a7d4e596bc55a57115409a5bc5426c56cdf0a288. The review sheet with the belt has the same bytes before and after the batch 2 merge.
- 04:45 cost at review on 9f78a4e, sheet frames, seconds per frame (`sheet4` with, `sheet5` hook reversed; engine hash with the hook bf9e533c3bea77c1, reversed cdec05916ee737d7; the record of 2819 was not caught by my copy loop):

| Frame | With belt | Without |
| --- | --- | --- |
| 2745 (first, asset load) | 32.4 | 32.3 |
| 2752 | 16.2 | 16.3 |
| 2758 | 13.8 | 13.6 |
| 2765 | 9.9 | 10.0 |
| 2772 | 14.0 | 8.7 |
| 2779 | 11.6 | 8.9 |
| 2785 | 11.8 | 8.9 |
| 2792 | 11.8 | 8.3 |
| 2799 | 11.8 | 9.0 |
| 2806 | 10.3 | 10.3 |
| 2812 | 9.9 | 9.9 |

  - Mean of the ten frames 2752 to 2812: 12.10 s with, 10.40 s without. Mean of the five frames with rocks: 12.18 s with, 8.78 s without (plus 3.4 s; plus 5.3 s at 2772). Frames without rocks cost the same.
- 04:47 DONE sent to the Builder.

## Task 2 (Phase 5 preparation), Nov 21 from 07:40 UTC

The Builder's task: fit the rocks to the travel agent's new camera of `mars.travel` (main 558e3a5), near rock with real detail, far2 readable, dust order, evidence (review sheet every third frame, finals of 2772, 2782, 2796), byte proof of 2325 and 2580 at draft. Never change `turnDeg` or `side`.

- 07:40 merged main (fast forward to 558e3a5, the hook is on main now, so the working tree had no shared diff). Old proof frames no longer hold: the pan is now 2.3 to 3.7 degrees per frame from 2760 to 2802 with roll in it, Mars leaves the frame by 2766, Jupiter is a point at (1306,947) in 2782 and grows from 2793 (r 28 px) to r 473 at 2817. `assets-src/belt/probe2.ts` prints camera turn, discs, sun and flow per frame.
- The dust now lives in a flow space (`src/space/travel/flow.ts`): 0.93 units of travel over the segment, motes within 3.5 units, a near layer within 1.2, 30 percent of the pan drawn as blur.
- Decided: a new motion model in the dust's flow space (`src/space/belt/motion.ts`). Per rock an anchor `frame` and a screen position `at` in that frame, a `distance`, and `hold`: 0 means fixed against the stars, 1 means fixed in the frame, negative means it crosses faster than the sky. The flow travel is subtracted, so rocks shift against the stars by parallax like the motes (0.93 units against 1 unit of distance for the near rock, 15 for far2). `smear` is the share of a rock's own screen motion that is drawn as blur (0 like the stars, 0.3 like the dust); blur from parallax and spin is always drawn. Old keys `flow`, `enter`, `exit` are gone.
- `assets-src/belt/plan.ts [--all]` prints per frame position, radius, circle of confusion and speed of every rock, and per rock the frames in frame, largest share of the frame, smallest gap to a disc (with the disc and the frame) and the smallest clear depth.
- Layout after eight planner rounds and three draft sheets (`out/work/belt/s1`, `d1`, `d2`):

| Rock | Asset | Anchor | At | Distance | Radius | Hold | Smear | In frame | Largest share | Nearest disc |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| far3 | c | 2760 | 0.80, 0.35 | 12 | 0.33 | -0.08 | 0 | 2754 to 2773 | 0.6 percent | Mars, 798 px |
| far1 | c | 2782 | 0.60, 0.20 | 11 | 0.30 | -0.05 | 0 | 2769 to 2796 | 0.5 percent | Jupiter, 603 px |
| hero | a | 2782 | 0.36, 0.50 | 3.5 | 0.20 | 1 | 20 px per frame, down left | 1.1 | 70 | 2757 to 2804 | 72 px per frame at the entry |
| near | b | 2782 | 0.86, 0.15 | 1.05 | 0.16 | -1.6 | 0.3 | 2774 to 2792 | 15.8 percent | Jupiter, 357 px |
| far2 | d | 2800 | 0.08, 0.69 | 15 | 0.36 | -0.1 | 0 | 2779 to 2802 | 0.4 percent | Jupiter, 131 px at 2788 |

  - Rocks are in frame from 2754 to 2802 (before: 2767 to 2801). Before 2754 the camera turns less than a degree per frame with Mars filling the left half, after 2802 the pan dies and Jupiter fills the middle; a rock there could neither enter nor leave by the pan.
  - hero hold 0.25 made it graze the bottom edge twice (planner: NOT CONTIGUOUS), hold 0.3 kept it in the corner over the grown Jupiter until 2802, hold 0.55 never left. 0.2 it is.
  - near: distance 1.2 with radius 0.135 read as a second hero. 1.05 with 0.16 gives r 330 px at 2782 against 174 of the hero, cut by the top edge, 19 frames in frame.
  - aperture 22 to 16 to 12: circle of confusion of the near rock 8 px at 2782 (11 px at 16 was mushy at native size in the final still).
  - far2 first passed 64 px from Jupiter's point at 2787 (`at` 0.08, 0.62); moved to 0.08, 0.69, now 131 px at 2788.
- Dust order: `Belt.cover(shot)` gives the belt layer and one sphere per drawn rock; with `assets-src/belt/dust.patch` applied the dust hides motes behind a rock by the layer's alpha. Described in `ENGINE-REQUESTS.md`. Not committed (shared files); the old `engine.patch` is removed because the hook is on main.
- Belt test updated to the new model (five tests: count, closed form, one visit inside the segment, hero plus two in the judged frame, off the discs of Mars and Jupiter, clear depth over 0.3, share under a fifth). `npx vitest run` green (the default reporter crashes on this Node with `Map.groupBy`; use `--reporter=tap`).
- `assets-src/belt/sheet.ts --tier T --name N [--step 3]` renders every third frame of the segment in one browser session and builds a 5 by 5 sheet with `sheet.py`.
- Draft cost in one session: 1.2 to 2 s per frame without rocks, 4 to 6 s with the hero and the near rock in frame.

- 08:02 pushed bed0727 (model, planner, sheet tool, dust patch file) and looks (draft sheet `d2`, draft 2781).
- 08:06 review sheet `out/work/belt/r1/sheet.jpg` (every third frame, 10 to 17 s per frame in one session, first frame 32 s): far3 with Mars, then hero, near, far1, far2, last rock out at 2802, Jupiter alone from 2805. Step 1 milestone sent.
- 08:07 final 2782 at native size: hero crisp with a readable dark side; near rock at aperture 16 soft and flat lit (its lit face toward the lens, few shadows). Six tilts of the near rock at draft with aperture 12 (`out/work/belt/p5/nt.jpg`, order: [-80,10,200], [10,40,0], [100,-50,30], [-30,150,70], [200,80,-60], [60,-120,140]). Kept [10,40,0]: the terminator crosses the face, a ringed crater sits in the middle, the dark side is a blue grey that stands off the sky. `fill` of the near rock 2.2 to 2.0.
- 08:15 finals of 2782, 2772, 2796 with the dust patch applied (`out/work/belt/p5/f*.png`, 56 to 63 s each), looked at whole and in four native quarters each:
  - 2782: hero left of the middle, near rock top right cut by the top edge (soft from focus plus a short vertical smear, craters and rim read, dark side blue grey), far1 between them, far2 lower right, Jupiter's point at (1306,947) clear, 210 px left of far2.
  - 2772: fastest pan. far3 leaving top left, far1 right, the dark top of the hero just entering at the bottom edge. Far rocks do not streak (smear 0, like the stars); the dust does.
  - 2796: Jupiter r 62 px in the middle, far2 lower left with a lit cratered face, the hero leaving through the top left corner.

- 08:22 review sheet with the final layout: `out/work/belt/r2/sheet.jpg`. Seconds per frame in one session: 34.8 (2745, asset load), 17.1, 18.2, 18.2, 15.6, 14.9, 13.5, 10.8, 10.8, 10.8 (2772), 13.2, 15.9, 16.8, 15.9, 16.4, 18.0 (2790), 15.3, 14.0, 13.2, 13.2, 12.2, 11.6, 10.5, 10.3, 10.4 (2817). Frames with only far rocks cost what empty sky costs (10.8); with the hero and the near rock in frame 13 to 18 s, so the belt adds 3 to 7 s per frame at review there.
- 08:27 byte proof at the draft tier (`out/work/belt/p5/proof/`), three states: plain main 558e3a5 in a separate worktree (`/tmp/mainwt`, own build), the branch as committed (dust patch reversed), the branch with the dust patch applied. All three states give the same sha256 per frame:
  - 2325: fd128b1a999f76fa079027e50ace59ac82ec5083c1c53b65667f23176a9a98cf
  - 2580: 7322ef9576f06ffb418698ffa8b0a82fe155aa5542608d8d4122681ea5700d5a
  - 2212 (middle of earth.travel, dust on, no belt): 42e37b819356cf0c7b4a4e054a1eaaf1ec8bf62b44d50a85d6b3f0e3dc0482b5
- Dust order checked at final 2782 with and without the patch (`out/work/belt/p5/dust-order-2782.png`, left without, right with): 512 pixels differ by more than 2 of 255; motes behind the near rock are gone from its face, motes in front of it stay. 81 of those pixels were over far1: the first margin of the sphere test (2.5 radii) reached far1, and the single mask then hid motes that are in front of far1. Margin cut to 1.25 radii, patch file regenerated, finals and sheet rendered again (`g*.png`, `r3`).

- 08:31 finals again with the 1.25 margin, patch applied (`out/work/belt/p5/g*.png`), looked at whole and at native size:
  - 2772: e000f94b937d431b0294a9d69579af0c1e8a010e84d26dfd79833141da4cf945 (same bytes as with the first margin)
  - 2782: a09f04992e2b2bfa203f55923da465793421c4b53f936078fec5a03cfd51ede1 (39 pixels over far1 differ by more than 2 from the first margin: its motes are back)
  - 2796: 88c4582a3831a96deea45b3ce42606ab95cd7b1582d1d1076a0dbd208dc987c9 (same bytes as with the first margin)
  - 2782 on the branch as committed, without the patch: 54ac7b032848cce37004ee07096520c02ee24874cfc899c1814659d700032003. Against the patched frame 473 pixels differ by more than 2: all on the near rock except 42 on the hero (one mote behind it).

- 08:38 review contact sheet of the final state: `out/work/belt/r3/sheet.jpg` (25 frames, every third, patch applied). Seconds per frame: 31.8 (2745), 15.5, 16.1, 16.0, 14.9, 13.3, 12.1, 10.3, 9.6, 10.1 (2772), 11.8, 14.3, 15.3, 14.7, 15.3, 16.1 (2790), 14.1, 12.7, 12.2, 11.9, 10.8, 10.5, 10.1, 10.3, 10.4. Draft proof of 2325, 2580, 2212 repeated with the final patch: same three sha256 as main.
- 08:39 looks pushed, DONE sent. Working tree keeps `dust.patch` applied (two shared files modified, never committed). `/tmp/mainwt` was a worktree of plain main for the proof, removed.
- 16:57 the Builder's answer to the UPDATE (no reply needed): the sheet reads as a beat; two notes. (1) The hero sits at nearly the same screen place from 2775 to 2793 and reads as attached to the camera: let it pass, a steady drift across at least a quarter of the frame width over its time in frame, with its tumble, while the near rock crosses in front. (2) The travel agent makes the sky sparser and the dust fainter: check the dark sides on a draft with about half the stars and say what is seen.
- 16:58 hero drift. Killed the review sheet `t3r3` (old hero path; 2745 to 2778 exist). Hero: `at` 0.36, 0.50, `velocity` -0.6253, -0.8337, 0 (12 px left and 16 px down per frame at the anchor, 20 px per frame), `ease` 6 to 1.1. Planner: in frame 2757 to 2804 (48 frames), enters at the top edge at x 1438 with 72 px per frame, 20 px per frame from 2778 to 2787 (10 px of blur), leaves at the bottom at x 358. Screen places: 2760 (1317, 72), 2769 (1003, 398), 2775 (823, 476), 2781 (707, 529), 2784 (660, 566), 2793 (533, 744), 2802 (358, 1081). So it crosses 1080 px in x (56 percent of the width) and the whole height, never slower than 20 px per frame; from 2775 to 2793 it moves 290 px left and 268 px down where it moved about 60 px before. Other rocks unchanged. Jupiter gap 440 px at the least (2793).
- Test changed: "lets the hero drift across" (at least 20 frames under 16 px of blur, never under 15 px per frame while in frame, x range over a quarter of the width). 9 belt tests green.
- 16:59 half star check (note 2). `sky.flightStars.count` 800000 to 400000 in `config/showcase.json`, working tree only, restored from a copy right after the still (`git status` shows no shared file). Draft 2782: `out/work/belt/t3/half2782.png`. Star maxima counted in two sky rectangles (500 x 300 at 100,700 and 400 x 400 at 1400,600), luma over 40: 1275 and 1941 with half the stars against 2126 and 3189 with all (bright ones over 120: 300 and 501 against 549 and 798). So the sky is at 60 percent of its points.
  - Seen at native size: the hero's dark side (upper right, about 150 x 120 px) is still a clean black shape, its outline carried by the stars it hides (roughly one star per 12 x 12 px around it). The near rock's dark side is a soft black hole about 250 px wide beside the warm streak; it reads. far1 and far2 read by their lit halves; their dark halves are too small to count as holes.
  - What does not hold: there is no rim on the dark limb. `rim` is a grazing term times `smoothstep(-0.25, 0.35, dot(normal, sun))`, so it lights only the Sun side of the limb. The dark side reads by hidden stars alone. At a quarter of the stars or with a soft dark band behind it the hero would read as a half rock (lit face with a straight terminator), which is how Phobos reads in the approved hero, but its full outline would be gone.
  - Not changed now: a rim that wraps onto the dark limb is a shader change and needs its own look (rim 1.5 gave a bright contour line at 16:43). Knob if wanted: the lower edge of that smoothstep, or `fill` (0.016, 0.018, 0.024 now).

## Still weak (after task 3)
- The near rock is in frame for 11 frames (2776 to 2786) and stays in the upper right quarter; it does not cross the middle of the frame. Its face is not readable, by design (65 to 85 px of streak, 9 to 17 px circle of confusion): it reads as a soft warm streak with a black side.
- The middle rocks ride with the camera (`hold` 1) and their own path is slow at the anchor and faster at the ends (`ease`, a cubic in time). That is a made path, not an orbit. Since 17:00 the hero drifts (never under 20 px per frame, 1080 px in x over its 48 frames), but the sky still whips past behind it at about 100 px per frame in the fast pan while it moves at 30 to 70.
- Far rocks carry 30 to 50 px of streak in the fastest pan (2766 to 2778): at native size they are smears there, shapes again from 2781.
- Tone: the hero's lit face is under Phobos (83, 71, 58 against 134, 106, 88) and warm, but with the Sun nearly behind the camera (2758 to 2772) the face is flat lit and reads lighter (about 90, 80, 65).
- The dark side is black (fill 0.016, 0.018, 0.024). It was judged against the dense star sky of bf74284. Against the new flight sky with sparse stars there is less to hide; the rim is only on the Sun side of the limb, so the dark limb has no line of its own.
- Dust: motes in front of the hero (it is at 3.5 units, the motes live within 3.5) draw on its face, which is right but busy. Behind the near rock the outer part of its streak does not dim the motes (sphere margin 1.25 radii).
- The middle rock and the near rock share asset b.
- The web set was not rendered in task 3 (assets unchanged, layout new).
- Review cost: plus 5.5 s per frame in the 11 frames of the pass, plus 2 to 3 s elsewhere. Frames 2754 to 2766 and 2799 to 2808 cost 27 to 85 s at review because of the sample law of main, with or without rocks.
- The belt test is outside `tests/`; `npm run looks -- --push --folder belt` does not accept `belt` (own `pushlooks.ts`).

## Still weak (after task 2)
- No rock before 2754 or after 2802. The pan is under a degree per frame there, so a rock could only cross with a speed of its own (`approach` exists in the model but is 0 for all rocks).
- The rocks' lit faces are a light grey, lighter than Phobos in the approved Mars hero. `light.gain` 0.36 was kept from task 1.
- The far rocks carry no pan blur (smear 0, the rule of the stars), so in the fastest pan (2760 to 2775) they are crisp while the dust streaks. The hero carries a tenth of its motion as blur, the near rock three tenths.
- The hero enters at the bottom edge with its dark side first (2770 to 2773), where it reads only by the fill.
- The near rock is soft from focus (circle of confusion 8 px at 2782, up to 12 px at 2790) plus a short smear; its craters read at native size, its fine regolith does not.
- Dust order needs `dust.patch` in two shared files. Without it every mote draws over the near rock. With it one mask serves all rocks (see ENGINE-REQUESTS.md, Limits).
- The belt adds 3 to 7 s per frame at review where the hero and the near rock are in frame.
- About 92 MB of half float render targets at 1080p while the segment is prepared, on top of 36.7 MB of textures.
- The web set was not rendered again in task 2 (assets unchanged).
- The belt test is outside `tests/`; `npm run looks -- --push --folder belt` does not accept `belt`.

## Still weak (task 1, kept for the record)
- Rocks are in frame only from 2767 to 2801 (hero 2769 to 2798, near 2770 to 2787, far1 2767 to 2801, far2 2774 to 2791). No rock while Mars is in frame, none over the grown Jupiter.
- The near rock is a soft pale shape with a dark side that barely separates from the sky; it reads as a near rock in the whole frame, less so in a tight crop.
- far2 is a dark shape with a thin lit edge at any tilt (it sits on the Sun side of the frame).
- The belt adds about 3.4 s per frame at review where rocks are in frame (hero: up to 64 draws with a 26 step shadow march).
- Dust motes are drawn after the belt, so far motes show in front of rocks. At review the motes leave dotted trails in the pan (engine, not belt).
- About 92 MB of half float render targets at 1080p while the segment is prepared, on top of 36.7 MB of textures.
- The web set is softer (half size maps); only a draft still was checked with it.
- The belt test is outside `tests/`; `npm run looks -- --push --folder belt` does not accept `belt`.

## Task 3 (Phase 5 work started early), Nov 21 from 16:09 UTC

The task is saved verbatim in `assets-src/belt/TASK3.md`. Findings of the Builder on finals 2772, 2782, 2796: no beat (nothing close, nothing blurred), rocks pale against Phobos, far rocks without blur in the fast pan, hero enters dark side first, dust order as a request only, cost up to 10 s per frame at review.

- 16:10 dust patch reversed in the working tree, merged origin/main bf74284, `npm ci`, build. The dust order is already on main (ffe0a2d): `git diff origin/main` of the two shared files is empty.
- 16:15 final 2782 of the merged state before any change (`out/work/belt/t3/main-f2782.png`, 80.5 s, 64 samples): the task 2 picture, near rock r 330 px top right, soft from focus, almost no streak; hero crisp. So the near rock was there but read as a second big rock, not as a pass.
- Decided, model (`src/space/belt/motion.ts`, `belt.ts`):
  - `smear` is gone. Every time step of a rock is drawn with the camera of its own time, so the layer holds the rock's full screen motion as blur (pan, own speed, parallax, spin). No star convention for rocks.
  - New per rock: `velocity` (own speed in units per second, in the camera axes of the anchor frame: x right, y up, z toward the lens) and `ease` (the own path runs at `dt (1 + ease dt dt)`: slow at the anchor, faster away from it; closed form of film time). `approach` stays (radial).
  - With `hold` 1 a rock rides with the camera and crosses the frame by its own speed alone, so it can cross while the pan is slow.
- Phobos tone, measured: rectangle 220 x 150 at (1320,1090) of `references/approved/mars-hero.png`, wholly on the lit face: mean sRGB 133.6, 106.2, 87.6. The hero of task 2 in the same kind of rectangle: 101, 97, 95. Luma is close; the rocks read pale because they are neutral grey where Phobos is a warm grey brown, and their brightest parts are as bright (p95 luma 170 against 177).
- 16:21 first layout with the new model, draft 2782 (`out/work/belt/t3/a2782.png`), draft sheet `out/work/belt/t3d1/sheet.jpg`: the near rock is a smooth streak, no copies; far1 sat right beside the near rock at 2782 and the hero was as large as the near rock, so the near rock did not read as near. Changes: hero radius 0.26 to 0.20 (r 115 px), mid 0.25 to 0.21, far1 lane moved left and 5 frames later with an own speed upward so it leaves by the top before Jupiter is large.
- Layout now (planner, `npx tsx assets-src/belt/plan.ts --all`):

| Rock | Asset | Anchor | At | Distance | Radius | Hold | Own speed at the anchor | Ease | Spin | In frame | Fastest |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mid | d | 2762 | 0.80, 0.42 | 5.5 | 0.21 | 1 | 10 px per frame, down left | 14 | 80 | 2748 to 2777 | 115 px per frame at the exit |
| hero | a | 2782 | 0.34, 0.52 | 3.5 | 0.20 | 1 | 7 px per frame, down left | 6 | 70 | 2758 to 2804 | 93 px per frame at the entry |
| far1 | c | 2787 | 0.45, 0.16 | 11 | 0.30 | 0.35 | 8 px per frame, up | 0 | 40 | 2764 to 2798 | 101 px per frame |
| near | b | 2782 | 0.78, 0.30 | 0.7 | 0.059 | 1 | 129 px per frame, up left | 0 | 120 | 2776 to 2786 | 175 px per frame |
| far2 | c | 2794 | 0.12, 0.72 | 13 | 0.33 | 0.3 | none | 0 | 30 | 2779 to 2798 | 70 px per frame |

  - Rocks are in frame from 2748 to 2804. Nothing in 2745, nothing from 2805 on (Jupiter r 301 px at 2805, 385 at 2808).
  - hero: under 24 px per frame (12 px of blur) for 22 frames around 2782 (9 px per frame from 2781 to 2785), 93 px per frame when it enters at the top edge at 2758 and 90 when it leaves at the bottom left. It moves down and left, toward the Sun in the frame, so its lit side leads (test).
  - near: enters at the right edge low at 2776, leaves through the top at 2786. r 143 px at 2776, 177 at 2782, 184 at 2783 (the last frame it is whole in frame), 193 at 2784 (cut by the top edge). It grows because the flow carries the camera toward it (0.96 to 0.60 units). Blur along the path 65 to 85 px, circle of confusion 9 to 17 px.
  - far rocks: hold 0.35 and 0.3, so they cross at about two thirds of the pan (up to 100 px per frame, 50 px of blur in the fastest pan).
- Tone: `light.gain` 0.36 to 0.24 to 0.21, `tint` from the blue grey 0.55, 0.57, 0.66 to the warm 0.61, 0.54, 0.50, `fill` cut to 0.016, 0.018, 0.024 (was 0.034, 0.038, 0.05 with 2.0 on the near rock), `rim` 0.9 to 1.5 so the rim keeps its level under the lower gain. At gain 0.24 (review 2782, `out/work/belt/t3r1/f02782.png`) the hero's lit face, rectangle 100 x 95 at (570,525): mean sRGB 91.1, 80.4, 65.2 against Phobos 133.6, 106.2, 87.6.
- 16:25 review stills 2766, 2772, 2782, 2783, 2796 (`out/work/belt/t3r1/`): 2766 took 103 s with 105 samples (the new sample law of main with Mars moving fast; not the belt), the others 13 to 18 s with 16 samples.
- 16:30 pushed ca4b1a1 and 8 looks. Dust order: `assets-src/belt/dust.patch` regenerated with the context of bf74284 (it reverse applies on main: main has the order), ENGINE-REQUESTS.md restated.
- 16:43 review sheet of that layout at gain 0.21: `out/work/belt/t3r2/sheet.jpg`. Seconds per frame in one session (samples in brackets): 46.4 (2745, asset load, 16), 20.2, 22.1 (20), 39.5 (39), 59.4 (62), 75.0 (84), 85.4 (104), 78.8 (2766, 105), 13.2 (2769, 16), 13.5, 14.8, 16.6 (2778), 16.6, 17.0 (2784), 14.7, 14.8, 15.2, 16.2 (2796), 27.3 (23), 37.0 (29), 41.9 (2805, 32), 34.6 (24), 24.8, 25.4, 23.6 (2817). The slow frames are the engine's sample law for fast frames (Mars moving, then Jupiter growing), with or without rocks in frame.
- Read at native size: near rock at 2778, 2781, 2784 is one smooth soft streak, lit lower left, its dark side a hole in the stars. Two faults: the early middle rock (asset d, mesh 64) had a bright contour line on its lit limb and a blotchy face (`rim` 1.5 was too much on the darker face); its outline was wobbly. Fixed: `rim` 1.0, the middle rock uses asset b (512 px maps, mesh 128, tilt 100, -50, 30; asset b is also the near rock, which is blurred past recognition and never beside it). Near rock radius 0.059 to 0.056 so it is 350 px tall at 2783 (32 percent of the frame height). Draft stills 2754 to 2772 checked (`out/work/belt/t3d2/`).
- 16:43 UPDATE sent to the Builder with the sheet; looks pushed.
- 16:47 finals of the final layout, one session (`out/work/belt/t3f/`, 64 samples each, 76.4 s with the asset load, then 51.8 and 51.9 s):
  - 2782: 8ac2aeb47b99e7570f39762bb2d57fbf433a2b7da53e865e74aef9c5e9f94f24
  - 2783 (near rock at its nearest while whole in frame, r 175 px, 350 px tall): 289b3f780de57bcd621799ab267fd499142d6274388f0b546c19a5d8aa597055
  - 2784: f37a246f9854b100bfd71ac986dc66fd4ec297d7b76dce45c42588d51707fbff
  - Read at native size: hero crisp left of the middle (craters, ridge shadow, dark side black against the stars), far1 above the middle with about 15 px of streak, the near rock top right as one soft streak toward the upper left, far2 at the bottom edge. Jupiter's point at (1306,947) in 2782 is clear.
- Tone, final numbers (`python3 assets-src/belt/tone.py FILE x,y,w,h`, mean of a rectangle wholly on the lit face):
  - Phobos, `references/approved/mars-hero.png` 1320,1090,220,150: mean sRGB 133.6, 106.2, 87.6 (luma 110.7, p95 177.0).
  - hero, final 2782, 575,530,95,90: 83.4, 71.1, 57.6 (luma 72.8, p95 127.4). Final 2783, 575,535,95,90: 79.6, 67.7, 54.7.
  - near rock, final 2783, 1280,190,150,150 (blurred lit part): 61.6, 52.8, 43.5.
  - hero in the fast pan, review 2772 at gain 0.24: 98.4, 87.2, 70.9; at the final gain 0.21 about a tenth lower.
- Cost at review, same session, rocks moved out of frame against rocks in frame (`out/work/belt/t3nobelt/`): 2782 12.5 s without, 17.8 s with; 2783 11.9 s without, 17.6 s with; 2796 14.0 s without, 16.2 s with. So the belt adds about 5.5 s per frame while the near rock passes and 2 to 3 s with the hero and far rocks alone.
