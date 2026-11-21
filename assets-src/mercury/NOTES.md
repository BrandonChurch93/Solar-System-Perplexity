# Mercury notes (stop agent memory)

Read `assets-src/shared/STOP-AGENT.md` first, then this file.

## Where things stand

- Branch `agent/mercury` (code, JSON, notes). Looks go to `agent/mercury-looks` through `npm run looks -- --push --folder mercury --note "..."` only.
- Parent is `/root` (the Builder). Milestone messages: orbit view, terrain view, dive and rise, then `READY`. Each with commit, measured numbers, weak points.
- VM: 4 cores, 7 GB RAM. `npm ci` done, `npm run build` passes. One render process at a time.

## Log

- 02:42 UTC Nov 21: cloned, branched, read the brief and the kit. Stand-in compares rendered (draft). First looks pushed (421bb9f5 on `agent/mercury-looks`).
- Read the engine: types, moves, film, standin, planet, relief, cover, sky, aim, post chain, haze, rig, timeline, the Mars set and plan.
- Merged origin/main 9602aca (status only).

## Segments and judged frames (30 fps)

- hold 18 to 23 s, judged frame 615. dive 23 to 26 s, judged 717. terrain 26 to 32 s, judged 870. rise 32 to 34.5 s, judged 1016. travel 34.5 to 37 s (not mine).

## What the approved images show

- Hero (2816x1584): globe center-left, lit from upper right, diagonal terminator, night side lower-left dark with faint detail. Grey, bronze and blue-tinted surface, bright ray craters. Enormous blown gold-white Sun at the upper-right edge with fringe and prominences, wide warm glow. A thin warm glow hugs the lit limb (lens bloom, the image wins over the words). Faint horizontal streak left of the Sun near the top. Small lens ghost lower left (about x 230 y 625 of 1400x788). Dense stars and Milky Way.
- Close (2816x1584): oblique high view, convex horizon tilted (high at left, falling to the right). Sun a small blown blob with glow at the top edge left of center (about x 370 of 1400), just above the horizon, warm glow on the horizon near it. Large terraced crater right of center with black shadowed floor and a central peak crater. Pale ray crater upper left center. Small sharp pits lower left. Stars and faint Milky Way upper right. Razor shadows toward right and bottom.

## Stand-in state (what the compare showed)

- Hold: hero-derived stand-in globe is in place, but the Sun is a flat disc with no fringe or flare and the sky is too bright and blue.
- Terrain: flat plate of the close image.

## Plan

1. Orbit view: wrap from hero pixels (2x copy, tone-coded resample, faded to the limb, view cosine 0.42 to 0.2), far side painted at dive-patch detail, polar caps on polar projection, measured light curve, height relief strongest at the terminator, clean sampled limb, hero sky patch, Sun glare that breathes in a stop-local `near` layer, globe turns.
2. Terrain view: relief of the close image, aprons past every edge, terrain sky patch, `skyAim.terrain`.
3. Dive and rise: patch levels at most 2x apart from a predictor, Sun glare cover that sweeps and thins over 10 frames or more.
4. Checks: measure, compare at final, sheets at review, crops.

## Engine facts that matter here

- `StopSet.near` is a second scene drawn after `world` with depth cleared: the place for a stop-local lens glare and cover layer.
- Engine `Cover` is a dust band pass driven by plan fields; without `coverLow` it is a full-frame color with fbm streaks and the upper half darkened (`uTop` 0.3). Sky exposure is multiplied by (1 - cover)^2.
- The Sun is drawn in `src/space/sky.ts` from `shot.sun` (`sunRadiusDeg`, `sunGlare`); streak flare from `light.flare` in the post chain (threshold 14 on the level 3 bloom buffer, horizontal).
- Post: bloom 6 levels, filmic, vignette 0.45 default, grain, sharpen 0.6.

## Budgets (config/showcase.json)

- Texture memory with mips: full 1400 MB, web 450 MB. Disk: full 150 MB, web 40 MB. Max file 95 MB. Max 6 takes per asset per round. 3 rounds.
- Sizes: full wrap 8192, relief 5632, sky 8192. Web wrap 4096, relief 2816, sky 4096.
