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

- 03:16 baseline done, four hashes above.
- 03:20 `bake.py` (numpy, procedural) and `preview.py` (offline ray cast of the baked maps). Take 1 too noisy (ridged relief hid the craters), take 2 lowers the relief and the regolith noise. Takes live in `out/work/belt/bake/takeN/`.
- 03:30 found: the dust offset in the travel moves dust particles toward Jupiter (probe: flow direction dot Jupiter direction = +0.987). The rocks use the same closed form with the sign flipped (`flow: -1`), so they come from Jupiter's side toward the lens. Tell the Builder.
- 03:35 planner `npx tsx assets-src/belt/plan.ts [--all]` prints per frame screen position, radius, circle of confusion, speed and whether a rock touches Jupiter. With the first layout: hero in frame 2769 to 2798, near 2770 to 2786, far1 2767 to 2801, far2 2774 to 2791, no rock on Jupiter.
- 03:40 module written (`motion.ts`, `store.ts`, `rock.ts`, `belt.ts`), hook in `src/core/engine.ts` (5 lines, saved as `engine.patch`). First draft still of 2782 shows all four rocks. Draft cost 22.0 s with the belt against 19.4 s without.
- Weak now: rocks too pale and too yellow, near rock reads as a flat tan blob, dark sides almost black, craters could be crisper. Assets (take 2) are in `public/` locally only, not committed yet.

## Next
1. After the baseline finishes: bake.py, module, hook, first draft stills, message the Builder.
2. Composition at 2782, sheet, crops, diag views.
3. Review tier sheet, final 2782, cost with and without, byte identity proof, patch, requests, recipe, web set, vitest, DONE.
