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

## Still weak
- Rocks are in frame only from 2767 to 2801 (hero 2769 to 2798, near 2770 to 2787, far1 2767 to 2801, far2 2774 to 2791). No rock while Mars is in frame, none over the grown Jupiter.
- The near rock is a soft pale shape with a dark side that barely separates from the sky; it reads as a near rock in the whole frame, less so in a tight crop.
- far2 is a dark shape with a thin lit edge at any tilt (it sits on the Sun side of the frame).
- The belt adds about 3.4 s per frame at review where rocks are in frame (hero: up to 64 draws with a 26 step shadow march).
- Dust motes are drawn after the belt, so far motes show in front of rocks. At review the motes leave dotted trails in the pan (engine, not belt).
- About 92 MB of half float render targets at 1080p while the segment is prepared, on top of 36.7 MB of textures.
- The web set is softer (half size maps); only a draft still was checked with it.
- The belt test is outside `tests/`; `npm run looks -- --push --folder belt` does not accept `belt`.
