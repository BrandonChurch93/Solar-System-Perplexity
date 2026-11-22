# Dust notebook (agent dust_builder, branch agent/dust)

Brief: `assets-src/shared/ROUND31-FIXES.md` section A. After a compaction read the brief, then this file.

## 2026-11-22

- 06:02 UTC start. Base 2b50ee2. Own VM, 4 cores. Draft still 17 s, final still of 1642 90 s (64 samples).
- Draft sha256 on the base (before any change), my probe `assets-src/dust/stills.ts` (one fresh page per frame, same bytes as `npm run still`, checked on 2325):
  - 2325 fd128b1a999f76fa079027e50ace59ac82ec5083c1c53b65667f23176a9a98cf
  - 2427 5636a9764d87cc2e1d50589c7806279c2e71f94d990003e475686d17ce196781
  - 2580 7322ef9576f06ffb418698ffa8b0a82fe155aa5542608d8d4122681ea5700d5a
  - 615 87bc2833573448d9e29907b0e4fa5cf2d391cba5999a18f819952d68dcaa4551
  - 1440 042b228fca024f7022777c9189b8cef8137d3e3acb472e2c0e5729016466e960
  - 2010 0f2303a6ad7dc69c62396ab58fbbc88786672af500cf21ec0e569e7aa4db0569
  - 3150 e72d79cc2e062b27ece99096e4be2ddf7e4b6c54d444c2083b844c8dcfb88578
  - 3720 9f5eaf40e03e8edcfe4eec4bcfbdb578cb06cbeb73cd1f7fafb607d23a7bb915
  - 4290 dd5c7580afadd5b7ada24b83b6abb0c7cc65cd6a4c8b95a2e405b76154f86c20
  - 4860 1ccc4a12760db30ae5e643c7a97954c4e9fef571747def3603d6e58aa55d4fa1
- Work folders outside the repo (not committed): `../dists/base` (build of the base), `../dists/nodust` (base with `DUST.gain` 0, the sky alone), `../shots/` (stills). A mote's level is measured as the still minus the same still without dust.

### What the old dust did (read from `src/space/dust.ts` at 2b50ee2 and `assets-src/travel/rates.ts` numbers)

- 12000 motes in two wrapped cubes round the camera (span 7 and 2.4). Each is one quad from its screen place at shutter open to shutter close. Radius = core 1.5 to 3.1 px plus a focus disc that grows with nearness (bokeh): the soft ovals of 35 to 50 px. A streak was a capsule with a flat level: the pills.
- 30 percent of the camera's turn across the shutter went into every streak (`DUST.pan`). The travels turn 1.3 to 2.0 degrees across the shutter in their middle (probe `rates.ts`: venus 1623 to 1659, uranus 4485 to 4505), which is 48 to 70 px at the 30 degree lens. So every mote carried the same 15 to 20 px dash with the same tilt: the parallel pills of 4492 and 2212.
- Drawn last, after the world and the belt, with no depth test: motes over Neptune's night side at 5085.

### Decisions

1. Grain: one Gaussian core, sigma 0.40 to 0.56 px at 1080 (full width at half height 1.2 to 1.5 px after the pixel filter), own size, level and tint per mote. No focus disc at all.
2. Streak: an anisotropic Gaussian, sigma along the path = sqrt(core^2 + (0.27 x length)^2). It has no end cap and no flat part, it fades to nothing at both ends, and its peak falls as core / length (same energy). One more factor 1 / (1 + (length / 28 px)^2) puts it under one level past 20 px.
3. No share of the camera's turn in the streak (was 0.3). Reason: the stars carry none (the kit draws the sky at mid shutter), the travels turn 50 to 70 px across the shutter, so a true share makes every mote an invisible 60 px line for the whole middle of a travel, and a part share makes the field of parallel dashes. A mote now turns with the sky like a star and streaks only along the stream, out of the point of flight, with a length that depends on its depth.
4. Many depths: each mote has its own wrap cube, span log-uniform from 2.2 to 48 units (was two cubes, 2.4 and 7). The stream moves up to 0.0147 units across the shutter (about 30 px at one unit of depth): near motes are long faint hairlines, motes at 5 to 20 units are grains that drift 3 to 12 px a frame. At a slow place the near ones drift and the far ones stand with the stars.
5. Hold-out by drawing order: the dust call moved in `engine.ts` to right after the sky, inside the sky block (same lens, same mid shutter turn as the stars), with the sky's stencil rule (drawn only where the stencil is 0). Solid bodies either were drawn before the sky and marked the stencil (capture path) or are drawn after the dust and cover it (live path). Transparent things (air, rings) and the belt layer are drawn after it and dim it as they dim a star. The Sun's disc is drawn by the sky itself, so the dust shader cuts a disc of 1.12 x the Sun's radius plus 2 px round the sky's Sun direction (per pixel). The belt's own mask for the dust (`belt.cover`) is no longer read by the engine.
6. Level in levels of 255: `DUST.level` [base, spread, power], soft cap `DUST.cap` 10, `DUST.unit` = linear value per level (measured). Brighter toward the Sun: `DUST.side` [0.8, 0.3, 0.3], 0.8 away from the Sun and 1.4 at it (the first build kept the old curve, see the calibration). Amount: `(shot.dust / travel.dust.level) ^ 0.5`, so the travel windows stay and the retreat (amount 0.045) keeps a quarter of the level.
7. Glint: 18 percent of the motes swing between 0.55 and 2.75 of their level with a period of 1.1 to 4 s (cos^8 lobe, at least 6 frames wide); the others breathe 0.8 to 1.2. The clock is the film time at mid shutter.
8. `config/showcase.json` not touched. `src/director/film.ts`: one line, see MAIL 84 below.

### Calibration (frame 1642, still minus the same still without dust, `motes.py`)

- Old dust at the final tier: 74,185 changed pixels, 175 marks, 121 of them over 15 levels, largest 56 levels, largest mark 66 x 37 px, median 26 px over half the peak.
- Try 1 (review tier, unit 0.0012, level [1.6, 9, 3], share 0.5): 61 marks, largest 20 levels. Too bright by two.
- Try 2 (review, unit 0.00062, level [4.5, 6, 2], share 0.6): 82 marks, 37 at 3 to 6, 20 at 6 to 10, 9 over 10 (largest 16).
- Try 3 (final tier, unit 0.00052, share 0.9, amplitude divided by the share of a grain's light that lands in its brightest pixel, 0.46 + (sigma - 0.42)): 1,299 changed pixels, 96 marks at 2 or more, 44 at 3 to 6, 14 at 6 to 10, one at 10, none over. Largest mark 3 x 3 px, median 2 px over half the peak. On spec.
- The measured level of one grain moves with the sky behind it (the film curve's toe: about 860 levels per unit on black, 1150 on a level 40 sky) and with where it sits in the pixel grid (a factor up to 2 for the smallest grain). The soft cap is set for the worst case.
- Probe `grains.ts` (the shader's arithmetic on the CPU) showed the old Sun curve (0.32 to 1.22) put half the grains at 6 to 10 when the camera looks toward the Sun (4492: 45 at 6 to 10, 46 at 3 to 6) and made the retreat as bright as a travel. Changed: `DUST.side` [0.8, 0.3, 0.3] (0.8 away from the Sun, 1.4 at the Sun), level [4.4, 5.6, 2.5], share 1. Predicted grains at nominal 3 or more: 1612 4, 1642 43, 1670 8, 495 45, 2212 31, 3352 36, 4492 62 (14 at 6 to 10), 5085 5.
- Streak lengths of the drawn grains at 1642 (nominal 1 or more): 60 under 2 px, 41 at 2 to 5 px, 7 at 5 to 10 px, none longer (longer ones are under one level). The grains that show sit 0.6 to 16 units deep, median 6.
- Ten draft hashes after the change: all equal to the base list above (run on the first build; the later value changes are in `DUST` only).
- `npx vitest run` 79 passed. `python3 tools/shaderaudit.py` prints the same lines as on the base.

### MAIL 84 from the Builder (06:49 UTC)

- The retreat's `dustOffset` line read `wp`, a local of the ending block that the ending agent redefines. Now `dustOffset.copy(forward(pose.quaternion)).multiplyScalar(-6 * smoother(u))`: `u` is the segment's own progress, zero slope at 5025 and at 5144, rising all the way. The three dust lines stay together under the ending's block; only that one line changed.
- Fact for the Builder: `shot.dustOffset` is read by no code (`rg dustOffset src` finds only `film.ts` and `types.ts`). The grains move by `src/space/travel/flow.ts`, which integrates the camera's real travel (direction times a logarithmic function of the real speed) and is cached per segment. So the retreat's grains follow the ending agent's new camera path by themselves.
- Trial merge of `origin/agent/ending` (c185994) into this branch in a scratch worktree: clean. `npx tsx assets-src/dust/rates.ts 8 ending.retreat` there gives the stream's step across the shutter, in units: 5033 0.0013, 5041 0.0019, 5049 0.0024, 5057 0.0028, 5065 to 5105 0.0029 to 0.0032, 5113 0.0029, 5121 0.0024, 5129 0.0017, 5137 0.0009. No stall, no jump; the amount is zero at both ends. On this branch alone: 0.0004 at 5033, 0.0032 at 5073 to 5081, 0.0003 at 5137.
- Asked to check the hold-out in the belt travel (2782) and at 5085 and 5235. See the results below.
