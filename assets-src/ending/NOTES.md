# Ending notebook (agent `ending_builder`, branch `agent/ending`)

Task: `assets-src/shared/ROUND31-FIXES.md` section C. After a compaction: read that section and the rules above it, then this file.

Mine: in `src/director/film.ts` the ending only (`LOOKBACK`, `lookback()`, the ending branch of `shotAt`, the `OPEN.retreat*` terms, one line of `aimSky()`, see below), `config/showcase.json` keys `travel.sky.retreat*`, this folder. The three lines `dust = `, `dustLook = `, `dustOffset` inside the retreat block belong to `dust_builder`: untouched, and they still read `wp`.

## Tools

- `npx tsx assets-src/ending/probe.ts --from 5025 --to 5150 --step 5 [--md] [--quiet]`: per frame turn, phase angle against the light Neptune's set really uses, its change, radius, Neptune, Sun and Triton on screen, star level, sky exposure, roll, `psi` (screen angle of the lit limb), `ring` (opening of the ring plane to the lens, 0 is edge on). `LB=key=value,glide.key=value` overrides `LOOKBACK` for one run. `GRID='{"key":[...]}' ... --scan` ranks combinations by peak phase change.
- `npx tsx assets-src/ending/geom.ts`: where the Sun, the stop's own light, the exit pose, Triton and the ring sit.
- `bash assets-src/ending/rt.sh LABEL TIER frames...`: syncs the tree to `/tmp/work` and renders stills there into `out/work/ending/LABEL/`, so sources can change while a chain runs. One chain at a time.
- `/tmp/base`: clean copy of main (2b50ee2) for before pictures. `/tmp/bytes.sh TREE LABEL frames...` prints draft hashes.

## Findings (06:05 to 06:20 UTC)

- Hashes before (draft, main 2b50ee2): 5024 57de63d6b8da41ee, 5006 0f98d86afb926556, 4860 1ccc4a12760db30a, 2325 fd128b1a999f76fa, 2427 5636a9764d87cc2e, 2580, 615, 1440, 2010, 3150, 3720 9f5eaf40e03e8edc, 4290 dd5c7580afadd5b7, 5020 ba6e1b67c1f383a0, 5000 ed7ed9ec14c269ce. Full list in `bytes-before.txt`.
- The stop's own light (`plan.lightDir`) and the real Sun (`sunWorld`) are 67.6 degrees apart at Neptune. `src/stops/neptune/set.ts` line 118 swings the light from one to the other with `lit = smooth(u * 1.5)` over the first 80 frames of the retreat. With a camera that does not move at all this alone closes the phase from 90.1 to 144.6 degrees at up to 1.2 degrees a frame. So the phase the viewer sees is light swing plus camera, and the probe measures against the swung light.
- Old path: slerp from the exit direction to the old lookback place, 87 degrees of arc that ran 7 degrees past the anti Sun point: phase 90 to 172.7 to 137, peak change 2.74 a frame at 5074, Sun behind Neptune 5075 to 5081, roll flipped 163 degrees between 5080 and 5090. That is the critic's jump.
- The exit pose is radial (speed 0.1 a second straight out), phase to the real Sun 144.6, Sun 35 degrees from Neptune toward the upper left of the frame. The lookback wants the Sun right of Neptune. That needs either a roll of about 137 degrees or a sweep round the Sun to Neptune axis; the sweep turns the camera against the stars (the band enters from an edge), a roll would spin the sky about the frame centre. Decision: sweep.
- The sky of the ending is fitted in `aimSky()` from the camera at the judged lookback frame, and Neptune's rise uses the same turn. A new lookback camera would move the sky of 5000 to 5024. Cure: `skyAnchor()` keeps the old fitting pose (aim 14 degrees off the Sun, roll 13) only for that fit, so `sky.orbits.ending` keeps its seven decimals (-0.3431989, 0.361269, -0.6940428, 0.5196189, checked with `geom.ts`). One line of `aimSky()` changed for it.
- Ring plane: the lens crosses it at azimuth +60 and -100 degrees round the Sun axis (0 is the exit side). Any sweep to the other side crosses it once.

## Design (first take a1)

- Place of the camera in Sun coordinates: phase (angle Sun, Neptune, camera), azimuth round the Sun axis from the exit side, distance. `lookbackPlace(t)` gives the lookback's values (constant rates, so it never stops), `nightSide()` turns them into a position.
- Lookback aim: the Sun at `LOOKBACK.sun` (in half frame heights off the lens axis, right and up), Neptune on the line through the Sun at `lineDeg` on screen. Both drift at constant rates.
- Retreat: phase, azimuth and log distance go from the exit values to the lookback's with `glide` (constant speed in the middle, eased ends, C1), minus a wide swing `wideDeg` toward the day side in the middle so the light swing and the camera do not add up. Aim: Neptune tracked with the Sun axis as up, the offset from that frame slerped from the exit's to the lookback's.
- Sky: star level stays at the rise's lift (1) through the whole ending, so nothing opens or closes. Exposure eases from the rise's to `LOOKBACK.skyExposure` over `retreat` [0, 1]. Glare eases over `retreatGlare` [0.3, 1]. Keys removed: `retreatGlow`, `retreatOpen`, `retreatClose`, `retreatLead`.

## Take a1 seen (06:20 UTC)

- Strip of 5025 to 5145 every 15: the move reads, Neptune shrinks, the band and the Sun come in from the top edge about 5112 to 5135. Lookback 5235: crescent whole at the left, Sun at 1283,379 inside the band. Good base.
- Weak: phase rate had two humps with a stall at 5105 (0.72, 0.83, 0.05, 0.50) because the set's light swing ends at frame 5105 and the camera's own closing came later.

## Design now (a2, a3)

- The retreat place is now measured round the light Neptune's set really uses: axis = `plan.lightDir` lerped to the Sun with `smooth(u * LOOKBACK.glide.light)`, `light` 1.5 mirrors `src/stops/neptune/set.ts` line 118 (`smooth(state.u * 1.5)`). Phase round that axis glides from the exit's 90.1 to the lookback's with `glide(u, 0.4)`: one hump, plateau 0.78 degrees a frame from 5070 to 5100, eased both ends. Azimuth round the same axis glides 0 to 127 over the whole retreat (`turn` 0.5, `turnFrom` 0). From u 0.667 on the axis is the Sun, so the end meets `lookbackPlace` exactly. The `wide` terms are gone.
- If the Neptune agent changes the 1.5 in set.ts, `LOOKBACK.glide.light` must follow, or the phase rate gets a second hump again. With `smooth(state.u)` there and `light: 1` here the camera would be dragged less and the turn peak would fall.
- `glide(u, e)` needs e at most 0.5 (above it the eased ends overlap and it steps).
- Camera turn: rises to 1.2 degrees a frame by 5070, 1.19 to 1.35 until 5105, eases to 0.006 by 5144. The price of a steady phase rate while the light swings 67.6 degrees: the camera follows the light round.
- The Sun enters at the top edge about 5115 in every variant tried: it is set by the elongation (180 minus phase), not by the azimuth timing.
- Triton leaves the frame on the right about 5068 and cannot sit in the lookback frame honestly (14 radii out, 67 degrees from the Sun line, the frame holds 30 degrees each side).
- Lookback drift: `sunPerSecond` raised to [-0.012, 0.003]: Neptune drifts right about 76 px and the Sun left about 53 px over 5145 to 5395, radius 214 to 194.
- Sky: star level 1 from the rise on (the rise already hands over lift 1 at exposure 0.45), exposure eases 0.45 to `LOOKBACK.skyExposure` across the whole retreat. Trying 0.36 with glare 4 so the Sun is the one bright star.

## Proved (06:38 UTC, commit a5b688f plus merge 6726a7c, pushed)

- Draft hashes after equal before for all 14: 5024, 5020, 2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860, 5006, 5000 (`bytes-after.txt`).
- `npm run build` passes, `npx vitest run` 79 of 79, `tools/shaderaudit.py` prints the same lines as main.
- Table: `table-5025-5150.md`. Peak turn 1.356 at 5104, peak phase change 0.786 at 5097, peak change of the phase rate 0.024 a frame.
- Chosen: `skyExposure` 0.36, `glare` 4. The engine keeps the flight stars at the same level whatever the exposure (`setStarLift` divides by it), so exposure only moves the band's glow; 0.45 to 0.36 took the band mean from 68.8 to 61.6 of 255.
- Chain running in `/tmp/work` (`/tmp/chain.sh`, log `/tmp/chain.log`): review sheets of the three segments, draft strip 5050 to 5083 every third into `out/work/ending/strip`, finals of 5235, 5085, 5362 into `out/work/ending/final`.

## Final state (07:00 UTC)

- Kept the diff of `film.ts` in five places: the `LOOKBACK` line with `basis` and `glide` right under it, the field `lookbackSide`, two lines in the constructor, `aimSky()` one line plus `skyAnchor`, `lookbackPlace`, `nightSide`, `lookback`, and the ending branch of `shotAt`. The import line is as on main again (`nightSide` uses `slerpDir`). `travel.sky.retreatGlare` is a number again (0.3, the glare eases from there to the end), so `assets-src/travel/joinpose.ts` still works; it also writes `retreatLead`, which nothing reads now.
- After this tidy up 5115 and 5235 draft are byte equal to the frames the sheets were made from, and all 14 check frames were rendered again on this code and equal main (`bytes-after.txt`). Build, vitest 79 of 79 and the shader audit were run again on it.
- Review sheets, the draft strip and the finals were seen: the terminator closes from cell to cell, the band and the Sun come in at the top edge from about 5108 and are in place by 5135, the lookback holds the whole crescent 49 px clear of the left edge at 5145 and drifts right, the fade ends black (max 0 in the last cell).
- For the Neptune agent: 5100 to 5140 and the whole lookback, the near arc of the ring crosses the night side as a bright streak that tapers to a point where the planet's shadow takes it; ring plane edge on at 5114. 5075 to 5090: the dark oval reads darker than the night side round it, and the cloud streaks at the terminator stay grey white a little past it.
- Weak points: turn stays 1.2 to 1.35 degrees a frame from 5065 to 5105 with a corner at 5105 (the set's `smooth` ends there); the band is only in the last quarter of the retreat; Triton is gone by 5065; exposure is a weak lever because the engine holds the star level against it.

## Mail 103 (07:48 UTC): on builder/b20

- Branch fast forwarded to builder/b20 (a514fd3), where all seven branches meet. The flight sky now draws its strip band, strip points and halo wherever `skyStars` is 1, so the whole ending draws them at `LOOKBACK.skyExposure` 0.36.
- Rendered 5235, 5085, 5362 final on it. Lookback band mean 66.3 of 255 (62.1 on my own branch before), lower sky 12.3 (12.7), the Sun still the brightest point, crescent whole. Answer: stands, no exposure or pose change.
- Seen there: the ring is brighter now and its outer arc on the left runs off the frame edge at about y 590 in 5235. Holding the whole ring would need Neptune about 150 px further right, away from the left edge, with the Sun moved or the crescent thinner. Left for batch 21 if wanted.
- Tidy up, bytes unchanged: the dust line reads `smoother(u)` now, so `wp` is folded into the one line that used it; `glide.turnFrom`, `glide.aimFrom` and `azimuthPerSecond` were all 0 and are gone (`ramp(0, 1, u)` is u). The table is the same to the digit.
