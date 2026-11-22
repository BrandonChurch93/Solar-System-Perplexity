# Neptune in the ending (round 31, section G)

Notebook of the branch `agent/neptune-ending`, cut from main 2b50ee2. It holds only the backlit Neptune of the ending (retreat 5025 to 5144, lookback 5145 to 5324, fade). The stop's polish stays on `agent/neptune` with its own notebook `NOTES.md`; this file is separate so the two branches do not meet in one file.

Order: MAIL 77 of the Builder (06:02 UTC) and `assets-src/shared/ROUND31-FIXES.md`, the rules and section G. Faults named by round 30: a doubled limb at 5235 (a thin bright contour plus a broader cyan glow on the same arc), the ring losing its shape through the swing at 5057 to 5079, a cloud strip inside the lit limb that reads as pasted on.

## Tools of this branch

- `assets-src/neptune/check/ending/phase.ts FROM TO STEP` (`npx tsx`): per frame the distance, the radius in pixels, the phase angle with the light the stop uses and with the true Sun, the light blend, the phase change per frame, the opening of the ring toward the camera, the height of the light over the ring plane.
- `assets-src/neptune/check/ending/probe.patch`: a temporary patch of `src/director/film.ts` (never committed): the lookback frames 5145 to 5224 in groups of ten show the globe centred at phase 90, 120, 150, 165, 172, 60, 136 degrees at distance 5.6 and 150 degrees at distance 9. Render 5150, 5160, 5170, 5180, 5190, 5200, 5210, 5220. `git apply` it, render, `git checkout -- src/director/film.ts`.
- One session for many frames: `npx tsx tools/repeat.ts --frames A,B --sessions 1 --runs 1 --tier draft --keep DIR` writes `FRAME-HASH.png`.

## Before, on main 2b50ee2

- Draft hashes (first 16 hex of sha256, `tools/repeat.ts`): 2325 fd128b1a999f76fa, 2427 5636a9764d87cc2e, 2580 7322ef9576f06ffb, 615 87bc2833573448d9, 1440 042b228fca024f70, 2010 0f2303a6ad7dc69c, 3150 e72d79cc2e062b27, 3720 9f5eaf40e03e8edc, 4290 dd5c7580afadd5b7, 4860 1ccc4a12760db30a, 4605 0b621fa06e44c52c, 4707 163d0630bb6f65e8, 5006 0f98d86afb926556.
- Review stills of 5057, 5068, 5079, 5085, 5235 in `out/work/end/a/`, the probe in `out/work/end/pa/`.
- The path today (`phase.ts`): frame, radius px, phase with the light used, phase with the true Sun, light blend, ring opening toward the camera, light over the ring plane: 5024 388, 90.1, 144.6, 0, 26.5, 53.2; 5057 373, 116.8, 152.8, 0.35, 18.6, 41.3; 5068 364, 141.6, 165.1, 0.56, 6.5, 30.2; 5079 356, 170.6, 173.8, 0.75, -12.5, 19.0; 5085 353, 169.6, 164.1, 0.84, -22.5, 14.1; 5235 315, 136.0, 136.0, 1, -49.4, 6.6. The camera crosses the ring plane at about 5072. The phase with the light used runs at up to 2.7 degrees per frame (5072 to 5078); 1.0 of that is the light itself swinging from the stop's fitted light to the true Sun in the first two thirds of the retreat.

## Causes found (pictures and numbers)

- Limb, 5235 (row through the widest part of the crescent, 8 bit): the lit sliver rises smoothly from the terminator to (73, 146, 204) at the limb, then a line 8 px wide of (140, 193, 230), whiter than everything round it, then a halo outside that falls from (88, 166, 213) with an e fold of about 20 px. The line is the two thin air layers (scale heights 0.009 and 0.0101 of the radius, 3 px, the first one nearly white) drawn inside and outside the limb; the halo is the wide layer (0.0417, 13 px). At lower phases the planet's own `rim` line at the very edge adds to it (on where the limb faces the light by more than 0.72, so below about 134 degrees).
- An even rim: the night terms of the air (`night` of layer 3 and of the line shell) and the planet's `forward` term (it reaches to 0.25 past the terminator) draw the limb all the way round at high phase. At 165 and 172 degrees the globe is a black disc with a dim blue rim and no bright crescent: the day edges of the layers are fixed numbers (0.7 to 0.9), and the limb faces the light by sin(phase) at the most, 0.14 at 172 degrees.
- Ring, 5068 and 5079: the ring is a rigid `RingGeometry`, the fault is its light. The bands are read from the map and squared after the filter, so where the ring is seen at a grazing angle (opening 6.5 and 12.5 degrees) the thin ringlets average out before the square and the body goes dark; only the arcs of the green channel (peaks 3 to 9 times the body) and the ansa on the Sun's side stay: the "coil" and the "spiral". A thin ring of dust would do the opposite, its surface brightness rises as it closes.
- Clouds, 5235: the cloud light curve holds (0.24, 0.245, 0.235) at the terminator where the deck under it is (0.002, 0.010, 0.027): clouds are 19 times the deck at the terminator and 8 times at 0.25, against 4 times in full light. So a row of white hooks stands on the dark side of the terminator.

## The change (what the branch holds)

- `src/stops/neptune/ending.ts`: the numbers of the backlit look, one object `ending`.
- A weight `end` in `set.ts`: 0 everywhere but the ending, `smooth(4u)` over the retreat (1 from frame 5055 on), 1 in the lookback and the fade. Every uniform the ending moves is written as `a + (b - a) * end` or `value * (1 - end)`, every shader term as `mix(old, new, uEnd.x)`, so the stop's own frames keep their bytes (checked by hash, see the proof).
- New methods `ending(...)` at the end of the classes `Air`, `NeptunePlanet` and `Ring`, called from `set.ts` after the `update` calls. No `update` signature changes, so the polish on `agent/neptune` merges without meeting these lines.
- Air: in the ending the three layers take scale heights of `ending.air.scaleHeight` (the two thin layers of 0.009 and 0.0101 were the white line), the day colours `ending.air.day`, no night term, no line shell. The day edge is no fixed number any more: `top = sin(pi - phase - asin(1 / distance))` is the most the limb can face the light from where the camera is (not sin(phase): from 5.6 radii at 165 degrees it is 0.082, at 172 degrees it is under 0, the Sun is behind the disc). The glow is full at the limb point that faces the light by `top` and gone where the limb faces it by `top - span * (1 + past)`, with `span` a smooth maximum of `top` and `ending.air.span`. So the glow is brightest toward the Sun and ends at the horns at every phase, and in an eclipse it is an arc of about 65 degrees to each side.
- Planet: no `rim` line, no dimming band at the terminator (`uTwi.x`), the cloud light curve bent toward the deck's (clouds 1 times the deck at the terminator, 4 times from 0.6 on), the night side's map blur wider (`night` 12 texels across the map in place of `look.night.texels`), and the forward term of the limb gated by the light (`uEnd.y`, `uEnd.z` on the cosine to the light) in place of the fixed reach of 0.25 past the terminator.
- Ring: in the ending the band map is read with a linear law (`sqrt` of the squared law, so a ringlet that the filter averages at a grazing angle keeps its mean light), the gains come from `ending.ring.band`, and the light of the thin sheet rises as it closes: `(1 - exp(-depth / |cos|)) / (1 - exp(-depth / open))` with the cosine between the line of sight and the ring's normal. The geometry was always one rigid ring; the planet's shadow on it is kept as it was.

## Takes (draft tier, `out/work/end/tN/`, sheets `/tmp/tN-probe.jpg`, `/tmp/tN-path.jpg`, in looks)

- Take 1 (06:26): edges of the glow from sin(phase); light of the retreat `smooth(u)`. Line and even rim gone, 5068 and 5079 show the ring as a thin ellipse. Wrong: at 150 the crescent thin and dim, at 165 and 172 a black disc (edge law, see above); ring body dim in the probe.
- Take 2 (06:30): edge law from `top`; light of the retreat back to `smooth(1.5u)` (the Sun's disc is in the frame from about 5080 on, 3.5 degrees off the axis at 5085, so the light on the globe has to be the true Sun by then; `check/ending/sunoff.ts` prints it); night map blur; ring gains [0.24, 0.05, 1]. 165 and 172 show an arc of air brightest toward the Sun, thinning to the horns. 5235 row through the limb: inside 28,96,167 (12 px in), 56,129,196, 51,132,197, limb 87,178,216, then 74,160,200, 55,129,175, 43,103,148 outward: still a step of 46 levels at the limb and the glow more cyan than the sliver. At 150 the sliver inside is dimmer than the glow outside (42,112,168 against 108,193,223 four pixels either side).
- Take 3 (06:36): planet forward term on in the ending with the light gate (0 to 0.2), air day colours 0.8 times and bluer, scale heights 0.014, 0.026, 0.014. 5235 row: 57,125,188 (12 px in), 67,141,202, 96,166,217, limb 118,184,227, out 72,155,204, 54,123,178: one cusp, but the last 4 px still stand 43 levels over the sliver 8 px in, and the glow outside is as bright as the sliver at the same distance from the limb. First commit b50e8c1.
- Take 4 (06:41): the planet's forward term wider (`forwardWidth` 0.6 in place of 0.25, so it lights the sliver and not only its last pixels) and 1.3 times, air day colours 0.75 times, scale heights 0.02, 0.032, 0.02. 5235 row: 75,137,192 (28 px in), 87,155,206, 94,163,212, 100,172,219, 121,186,227, limb 134,195,232, out 58,133,187, 47,112,167, 37,90,142. The sliver is the bright thing now, its edge is hard, the glow under it. But the sliver is smooth, the clouds washed out.
- Take 5 (06:43), kept: forward 1.1, clouds 5.5 times the deck from 0.4 on (4 from 0.6 before). 5235 row: 67,128,184 (28 px in), 79,147,200, 86,155,207, 91,165,215, 135,189,228, limb 145,198,232, out 58,133,187, 47,111,166, 37,90,142, 39,83,128. At 150 degrees: 18,46,86 (16 px in), 55,108,164, 97,162,208, 131,192,227, limb 150,209,236, out 85,165,209, 71,141,190, 54,113,165. At 165 and 172 degrees only the arc of air: peak 117,198,230 and 139,201,229, falling outward over about 25 px. Commit 703c4d7.
- Take 6 (06:54): the planet's shadow on the ring. In the review stills of take 5 the ring at 5068 and 5079 read as a hook and not as an ellipse: the shadow cut it with a ruler edge (`smoothstep(0.985, 1.025)` on the distance from the shadow's axis) and the shadowed part was at 0.006, so nothing let the eye finish the ellipse. In the 90 degree probe the shadow was a hard rectangle from the disc to the frame edge. In the ending the edge now runs from 0.9 to 1.12 radii and the shadowed ring keeps 0.07 of its light (`ending.ring.shade` [0.9, 1.12, 0.064], new uniform `uEndShade` in `ring.ts`; the third number is the share of the lit ring's light that is added back, 0.006 + 0.994 * 0.064 = 0.07). 5079, column x 100 to 170, median: the cut at y 560 to 580 (21,24,25 to 44,60,75) is now a ramp over y 560 to 620 (28,36,43, 36,48,60, 46,60,74, 50,68,81). At 5062 the ring is a whole ellipse across the dark disc, at 5074 a thin line across it with the ansa at the left. The near arm of the ring is soft in the review stills and crisp in draft: that is the shutter (the camera swings fast there), not the map.
- Take 7 (06:59), kept: the limb at 5235 again, at 6 times in a crop. The 'cusp' of take 5 was no shader term: a band 8 px wide with a hard inner edge and streaks in it (91,165,215 at 8 px in, 128,185,226 at 7 px in), a cloud of the map that lies along the limb at this pose, pressed flat by the grazing view: the critic's 'thin bright contour' in a new place. Cure for every angle: in the ending clouds lose their contrast toward the limb, `mix(deck, col, smoothstep(0.2, 0.5, mu))` with the cosine of the view angle (`ending.limb.cloudLimb`, uniform `uEndCloud`, one new line after `float graze` in `planet.ts`, in the lines the polish does not touch), as a long path of air does to cloud tops. 5235 row, every 2 px from 30 px in: 64,124,181, 67,128,184, 71,134,189, 72,136,191, 76,143,196, 79,147,200, 80,149,201, 83,151,204, 84,153,206, 86,157,209, 89,162,212, 94,168,217, 93,169,217, 98,173,220, 104,179,224, limb 110,183,227, out 59,137,190, 54,127,181, 48,116,171, 42,104,158. One ramp up to the limb, one hard edge, the glow under it. 90 and 120 degrees: clouds of many sizes on the lit side, soft toward the limb, dim toward the terminator. Draft hashes of 4605 and 5006 as before after both takes.

## Checks

- Draft hashes of 4605 and 5006 after every take: 0b621fa06e44c52c and 0f98d86afb926556, the numbers of before. The shader edits (`mix(old, new, uEnd.x)` in `ring.ts` and `planet.ts`) keep the bytes.
- The retreat as a strip (take 3, `out/work/end/s3/`, `/tmp/s3-strip.jpg` in looks): 5024 to 5054 the clouds dim and the ring comes up as the weight rises, no jump; 5072 the camera is in the ring plane (opening 0.4 degrees) and the ring is a line for about two frames; 5075 on the ansa at the lower left; 5090 to 5144 the arc and then the crescent at the right limb.
- 5079 on today's path is a black disc with the ring's ansa and nothing else: the light is 1.5 degrees behind the limb there (phase with the light used 170.6, the disc's angular radius 10.9 degrees) and the limb point that faces it is above the top edge of the frame. The law gives an arc of about 47 degrees to each side of that point, and a full even ring only when the light is dead behind the centre.
- Test merge with the polish: `git merge-tree --write-tree agent/neptune-ending agent/neptune` gives a tree with no conflict (b15049d for b50e8c1 and 3af6a54); that tree's `src`, `tools`, `tests` type check (`tsc --noEmit`). In the merged tree nothing but `ending()` writes `uRim`, `uTwi.x`, `uForward`, `uForwardShape.x`, `uCloud`, `uNight.w`, `uAirShape.x`, `uAirNight`, `uLineNight`, so at weight 0 they hold the polish's own values.

- Take 6 touched the `outColor` line of `ring.ts`, which sits beside a line the polish adds, and the test merge showed a conflict there (07:02). The law moved onto the `shadow` line alone: `mix(smoothstep(0.985, 1.025, miss), lift + (1 - lift) * smoothstep(from, to, miss), uEnd.x)`. Commit df8d8c4. The test merge with 3af6a54 is clean again (tree f88978f) and that tree type checks.

## Proof on df8d8c4 (07:02 to 07:11, `out/work/end/proof2.log`)

- Draft hashes of 2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860, 4605, 4707, 5006: all 13 equal the list of before (compared by `diff` against `before.log`).
- `npm run build` green (2.5 s). `npx vitest run`: 15 files, 79 tests passed. `python3 tools/shaderaudit.py`: 32 lines, the same text as on main 2b50ee2 (`diff` of the two outputs is empty; Neptune's two lines are `closeup.ts:125` and `closeup.ts:160`, both on main).
- The first run of the review stills refused to start (2.9 GB free, the harness needs 3): a copy of the merged tree in `/tmp` held 1.7 GB of assets. Removed with the rejected takes 1 to 4; 4.9 GB free. Next time type check a merged tree with `git archive TREE src tools tests config package.json tsconfig.json` and not the whole tree.
- Review stills of 5057, 5068, 5079, 5085, 5235 in `out/work/end/b/`, the probe at review in `out/work/end/pb/` (take 5's are in `b5/` and `pb5/`).

## Weak points

- 5079 on today's path is a black disc with the ring's ansa and nothing else (see Checks): by the law, not by a fault, but a frame with no limb is a weak frame. The camera of the ending decides it.
- The camera crosses the ring plane at about 5072: the ring is a line for about two frames.
- The ring in the planet's shadow keeps 7 percent of its light. That is a choice for the eye (the ellipse stays whole across the dark disc at 5057 to 5066), not the physics of a shadow; with 0.006 the ring ended at the shadow and read as a hook.
- The near arm of the ring is soft in the review stills of 5068 and 5079 and crisp in draft: the shutter, the camera swings by up to 2.7 degrees per frame there.
- The sliver at 5235 is smooth. At that pose the only cloud in it lay along the limb, and the fade toward the limb takes it. At 90 and 120 degrees the clouds show.
- Clouds lose contrast from 13 percent of the radius inside the limb (cosine 0.5) and are gone 2 percent inside it (cosine 0.2). On a wide crescent (5057) the outer band of the lit side is therefore plain blue.
- The ringlets are crisp: the grain of the polish branch is not on this branch.
- Only draft and review tiers were rendered, no final tier. The fade (5325 to 5399) was not looked at on its own; it has weight 1 like the lookback.
- The pictures of today's path use main's camera and main's light law; `ending_builder` changes the camera.

## For the camera of the ending

- The phase the globe shows is the angle between the camera and `normalize(lerp(plan.lightDir rotated, shot.sun.dir, smooth(1.5 u)))` over the retreat, the true Sun from two thirds of the retreat on. At 5024 the stop's light gives 90.1 degrees where the true Sun gives 144.6.
- The look's weight is `smooth(4 u)` of the retreat: full from 5055 on.
- Above a phase of `180 - asin(1 / distance)` degrees the Sun is behind the disc: only the arc of air shows, about 47 to 65 degrees to each side of the limb point that faces the Sun. If that point is out of the frame, the frame holds a black disc.
- The glow reaches about 0.1 radii past the limb. Ring: inner 1.28, outer 1.92 radii, centred on the planet in the ending; it is lit from behind and brightest when nearly closed, a line when the camera is in its plane.
- Today's path: 5057 phase 116.8, 5068 141.6, 5079 170.6, 5085 169.6, 5235 136.0; ring opening 18.6, 6.5, -12.5, -22.5, -49.4 degrees.

## MAIL 86 (07:07 UTC): the proof on the new camera path

Order: `agent/ending` 41e144e (holds main 7717f95) is the ending agent's delivery, with a new camera path for the retreat and the lookback. Prove the backlit Neptune there, in a scratch tree, not on this branch: review sheets of `ending.retreat` and `ending.lookback`, finals of 5085 and 5235, every cell looked at. Judge with this take in place what the ending agent saw with main's Neptune: the near arc of the ring as a bright streak that tapers to a point (5100 to 5140 and the lookback), the ring edge on at 5114, the dark oval darker than the night round it and grey white cloud streaks past the terminator (5075 to 5090), no rim on the night limb. Line 118 of `set.ts` (`lit`, `smooth(1.5u)`) is mirrored by the path as `LOOKBACK.glide.light` and stays as it is.

- Scratch tree: local branch `scratch/neptune-ending-proof`, 7c1dfff = `agent/neptune-ending` 2a5bbc8 merged with `origin/agent/ending` 41e144e, no conflict, type checks. Never pushed. This branch still holds only `src/stops/neptune/` and `assets-src/neptune/`.
- The new path (`phase.ts` in the scratch tree): phase with the light used 90.1 at 5025, 96.2 at 5055, 110.1 at 5075, 117.9 at 5085, 125.7 at 5095, 133.5 at 5105, 139.9 at 5115, 144.2 at 5125, 146.6 at 5145, 148.0 at 5235, 149.2 at 5315, at most 0.78 degrees per frame (2.7 on main's path). Distance 5.2 to 8.3 radii over the retreat, 8.3 to 8.9 in the lookback; radius 388 px at 5025, 266 at 5095, 213 at 5140, 205 at 5235. Ring opening toward the camera 26.5 at 5025, 33.4 at 5065, 23.6 at 5085, 13.3 at 5095, 7.5 at 5100, 1.4 at 5105, minus 4.1 at 5110, minus 8.2 at 5115, minus 14.5 in the lookback: by this tool the camera crosses the ring plane between 5106 and 5107 (the ending agent names 5114). The Sun stands 6.6 degrees over the ring plane from 5105 on. The phase never passes 150 degrees, so the Sun is never behind the disc and the black disc of main's 5079 does not occur.
- Chain `out/work/end/scratch.sh` (07:10:57): lookback sheet at review, finals of 5235 (16 samples, 38 s) and 5085 (64 samples, 100 s), retreat sheet at review.
- Review stills of 5080, 5105, 5115, 5125 after it (`scratch2.sh`, `out/work/end/n/rev-N.png`), cut at the crop origins of the ending agent's sheet (5080 at 192,394; 5115 at 0,385; 5125 at 0,351; 5235 at 0,323; each 700 by 640) and set beside its crops of main's Neptune: `out/work/end/send/new-path-N-main-and-take.jpg`. One review still of the fade, 5350: the picture of the lookback, nothing new.

### What the sheets show (every cell looked at)

- Retreat (5025, 5036, 5047, 5057, 5068, 5079, 5090, 5101, 5112, 5122, 5133, 5144): 5025 to 5047 the globe of the rise with its dark spot in the light, the ring wide (27 to 33 degrees); the lit part shrinks to a crescent at the top by 5068; 5079 and 5090 a crescent of about 110 to 120 degrees with the ring an open ellipse in front of the night side and behind the lit limb; 5101 the ring nearly closed, a thin line through the disc; 5112 on the crescent has turned to the right limb, the ring opens again on the other side; 5122 to 5144 the pose of the lookback. No jump between cells in the light, the ring or the glow.
- Lookback (5145 to 5324): one pose that drifts: a black disc, the crescent on the limb toward the Sun (the Sun is the bright point to the right), the far arc of the ring as a loop past the crescent, the near arc as a soft streak on the night side, the other ansa at the lower left.
- Final 5085 (phase 117.9): column through the top limb, from outside: 14,40,76 (14 px out), 21,55,101, 30,77,131, 40,101,159 (2 px out), limb 83,157,229, inside 107,183,239, 99,174,237, 96,173,236. One edge with the glow under it. Cloud streaks inside the limb fade toward it. The night side is a smooth navy, also at 4 times gain.
- Review 5226 (phase 148), row through the crescent: 1,11,30 (24 px in), 12,37,72, 46,94,150, 82,145,197, 110,176,218, 124,190,228, limb 139,203,234, outside 81,160,205, 60,123,175, 44,89,137, 35,68,105. One ramp, one edge, the glow under it.

### The five observations of the ending agent, judged with this take

1. The near arc of the ring as a bright streak that tapers to a point (5100 to 5140, lookback): changed, not gone. The streak is the lit part of the near arc; the planet's shadow lies on the rest. The Sun stands 6.6 degrees over the ring plane, so the shadow is a long strip one radius to each side of its axis and its edge cuts the annulus at a slant (51 degrees of azimuth at the inner edge, 31 at the outer): the lit part must end in a wedge. With take 6 the edge is soft (0.9 to 1.12 radii) and the shadowed ring goes on at 7 percent, so the wedge fades and does not stop at a point. It reads as a ring with a shadow across it. Nothing more to cure without leaving the geometry.
2. The ring edge on: at 5105 (opening 1.4 degrees) one thin line through the disc and past both limbs, dim where the shadow lies. The brightening law is capped at 1 / (1 - exp(-depth / open)) = 2.3 times, so the line does not flash.
3. The dark oval darker than the night round it (5075 to 5090): gone. The night side's map is read 12 texels wide in the ending.
4. Grey white cloud streaks a little past the terminator: gone. The cloud light curve stands at 1 times the deck at the terminator.
5. No rim on the night limb far from the Sun: kept so on purpose. Section G asks for one glow that thins to nothing at the horns and never an even rim all the way round. The far limb is drawn by the stars it hides.

### Not mine: warm white dots on the night side

- At 5080 to 5105 a few faint round dots sit on the night side: 5080 at 580,586 (plus 12.8, 12.7, 9.5 over the navy round it, about 18 px wide), 5085 at 639,594 (plus 13.2, 11.4, 6.2), 5105 at 477,832 (plus 19.3, 17.4, 14.6), and smaller ones (6 px, plus 10, 10, 7) at 631,656 and 455,686 of 5080. The small ones stand at the same pixels with the same values in the ending agent's crop of main's Neptune, so they are not drawn by the planet. They are warm white, not navy, and they move against the globe from frame to frame. They look like the lens flare of the post chain (`uFlare` in `src/post/chain.ts`) or star glare drawn over the disc: the engine's, reported to the Builder, nothing changed here.

### State

- No code change came out of the new path: the code head stays df8d8c4.
- Main moved to 2858db4 (only `kit/PROGRESS.md` and `out/stills/status` differ from 2b50ee2). Merged into this branch as b2057a6; `git diff df8d8c4 b2057a6 -- src public config tools tests package.json` is empty.

### Weak points on the new path

- The lit near arc ends in a soft wedge on the night side (see 1 above): geometry, softened, not removed.
- The ring is brighter than main's in the lookback (opening 14.5 degrees, the thin sheet law gives 1.47 times the light of the ring as the rise leaves it). It is the brightest thing after the crescent.
- The sliver of the lookback is smooth: at phase 148 the lit strip is 24 px wide and lies wholly in the zone where clouds have lost their contrast.
- The warm white dots on the night side (the engine's, see above) show more on a smooth night side than they did on main's mottled one.
- Sent at 07:25 and 07:26 as `PART` in two messages (ten section G files, ten new path files).

## Proof on the final head (07:26 to 07:29, `out/work/end/proof4.log`)

- Tree b2057a6 (df8d8c4 with main 2858db4 merged; the commits after it change this notebook only).
- Draft hashes of 2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860, 4605, 4707, 5006 (`tools/repeat.ts`, one session, 132 s): all 13 equal the list of before (`diff` against it is empty).
- `npm run build` green (2.5 s). `npx vitest run`: 15 files, 79 tests passed. `python3 tools/shaderaudit.py`: 32 lines, the same text as on main 2858db4 (`diff` empty).
- `git merge-tree --write-tree` with the polish head dd7f0f7 and with `agent/ending` 41e144e: no conflict.
- `DONE` sent after this.

## After DONE

- `DONE` sent 07:30 (head 6f9cf31) with the native crop of 5105 and a review still of 5350; the other twenty pictures went with the two `PART` messages of 07:25 and 07:26.
- MAIL 95 (07:32): DONE accepted, `agent/neptune-ending` 6f9cf31 goes into engine batch 20. The warm white dots are the old travel dust drawn over the body; the dust agent's new dust is held out behind bodies (0 changed pixels inside the dark disc at 5085 in its proof) and goes with the same batch. The Builder checks 5080, 5085 and 5105 on the merged tree. Nothing more is asked of this branch; if it is opened again, start from the weak points above and prove on the tree the Builder names.
- The scratch branch `scratch/neptune-ending-proof` (7c1dfff) is local only and can be deleted; its pictures are in `out/work/end/n/` and `out/work/end/send/`, and in looks.

## MAIL 112 (09:16 UTC Nov 22), word for word

"MAIL 112 from the Builder, 09:16 UTC Nov 22. Whole film round 31 (second of three) ran on main 07aabf5e. The surface critic scored the ending's two judged frames, 5085 (retreat) and 5235 (lookback), 6 of 10 with four majors; three of them are on your globe and rings as the ending shows them. Round 32 is the last whole film round; its batch is cut at about 10:30 UTC. Branch: agent/neptune-ending from origin/main, holding only this. Your polish branch (the border cure) goes on as it is for Phase 6; this comes first until 10:25.

The critic's words (1400 px wide copies):
Frame 5085:
- major: "the rings read as soft smeared brush strokes, like motion blur, with no sharp ringlet edges or gaps at native size; where the near arc crosses the night side it turns into a hazy ghost streak" (the near arc over the lower right of the disc and the far arc upper right). Fix named: "render the rings from a high-resolution radial profile with crisp ringlet boundaries and gaps, and give the arc in front of the disc proper opacity and lighting instead of a blurred overlay".
- major: "the day side is a smooth airbrushed blue with only a few faint cloud wisps, and the terminator is an even, mechanical band across the disc; the surface looks plastic" (lit upper part of the globe). Fix named: "add banded cloud structure at several scales and storm features, and break up the terminator with altitude and haze variation".
Frame 5235:
- major: "the disc is a flat, featureless black cutout behind a thin blue rim; it has no night-side texture, ringshine or limb darkening, so it looks like a flat mask". Fix named: "add faint ringshine and starlight shading, gradual limb darkening and a softer inner edge to the rim light".
- minor: "the ring strands crossing the unlit disc are as bright as the parts outside it, and the planet casts no shadow on them, so the ring looks pasted on top". Fix named: "apply the planet's shadow to the ring and dim the segment that crosses the night side".
- minor: "the bright star is a soft round blob with no diffraction or point core" (the Sun, near the centre). Fix named: "render it as a sharp point source with a tight bloom".
The whole film critic (minor): the Milky Way "competes with the crescent at the end".

What I see at native size. 5085 is taken while the camera turns (the retreat is a fast kind), so the rings are motion blurred while the stars stay points; that mismatch is what reads as brush strokes. 5235: the night side is pure black inside a hard rim, the rings pass in front of the dark disc at full brightness.

What I want:
1. Rings in the ending: the planet's shadow falls on them (the stretch that crosses or lies behind the night side goes dark as it would), ringlets with sharp edges and gaps at native size at 5235, and at 5085 a ring that reads as ring. Tell me in one line why the near arc at 5085 is a haze: shutter blur alone, or a soft texture as well. If it is the shutter, say how many pixels the ring moves across the shutter at 5085; I will take the turn rate up with ending_builder.
2. The night side at 5235: not a cutout. Faint detail a viewer finds at 1:1: a soft glow of scattered light inside the rim that falls off over a few percent of the radius, a trace of ringshine, limb darkening of the lit sliver. Blacks stay deep; the kit's line is "Blacks are deep but not crushed. Detail survives in the shadows of every lit body."
3. The day side at 5085: your hold's cloud bands and storms carry to this side at this light, with a terminator broken by haze and height, not an even band.
4. The Sun in the lookback, if it is drawn by your set: a point core with a tight glare and a small glint. If it is not yours, tell me whose.
Your stop's judged frames (hold, dive, terrain, rise) keep their bytes at final; say which you rendered to prove it. Do not change the camera or the timing of the ending; ending_builder owns them and has its own mail.

Proof (one render process at a time on your VM): finals of 5085 and 5235 before and after with native crops of the near arc on the disc, the far arc, the day side, the rim, the night side and the Sun; a draft strip of 5025 to 5324 every 25th frame. PART with the ring shadow and the night side at 5235 by 09:55 UTC; DONE by 10:25 UTC. What is not proved by then goes to the Phase 6 polish rounds."

### Start (09:12 VM clock, about 4 minutes behind the Builder's)

- Branch fast forwarded to main 616695b. Before pictures on that tree: `out/work/end/m112/before/final-5235.png` (16 samples, 45 s), `final-5085.png` (64 samples, 115 s), `draft-5085.png`, `draft-5235.png`.

### What the before finals show (native crops)

- 5235: night disc (inside 0.97 radii, left of the crescent) mean RGB 1.6, 3.6, 8.2; blue 5 to 7 over the middle, 20 just inside the top limb (the air). The night deck is the wrap map blurred to 12 texels times a constant, so the disc is one flat tone. The crescent's inner edge steps from 4, 14, 33 to 25, 60, 107 in 6 px. The near arc crosses the night side at 7 percent of its light inside the planet's shadow (my `shade` of the last round), the edge 0.9 to 1.12 radii wide: a streak that fades and never stops.
- 5085: draft (1 sample) against final (64 samples): the ring is softer in the final. Both causes are there: the shutter and a soft texture.
- Shutter at 5085 (`check/ending/shutter.ts`, new: projects ring points at shutter open and close, `config.shutterFraction` 0.5 of a frame): ring points in frame move 0.6 to 12.2 px; the near arc over the lower right of the disc (ring azimuth 270 to 330) moves 6.6 to 12.2 px, nearly along x, across ringlets whose gaps are 4 to 14 px wide there; the far arc at the upper right 2.6 to 5.0 px; the globe's centre 3.5 px. The harness counts 8.4 px for the frame (`npm run samples`). At 5235 nothing moves more than 0.3 px.
- The soft texture: the ending read the band map with gains R 0.24, G 0.05, B 1 times `bandUnit`. The B channel holds four ringlets with three empty gaps (rows 104 to 180, 208 to 232, 248 to 344, 400 to 455 of 512); the R channel is a smooth sheet across all of them and filled the gaps. And the mip level was chosen from the azimuth gradient (7.9 texels per pixel at the ansa of 5235) where the radial one is 3.9, so the ringlets were read one level too soft.
- The Sun of the lookback is not drawn by this set. It is the engine's sky pass, `src/space/sky.ts` lines 226 to 241 (disc, core and corona, scaled by `uSunGlare`), fed by the director: `LOOKBACK.glare` and `sunFor` in `src/director/film.ts`, the ending's path. Any glint is the lens chain's, `uFlare` in `src/post/chain.ts`.

### The change (takes 1 to 5 at draft, `out/work/end/m112/tN/`)

- Ring (`ring.ts`, `ending.ring`): the planet's shadow in the ending is the true one again, edge 0.975 to 1.04 radii from the shadow's axis and no light added back (`shade` [0.975, 1.04, 0], was [0.9, 1.12, 0.064]); band gains [0.1, 0.05, 1.3] (was [0.24, 0.05, 1]) so the gaps of the B channel are empty; new uniform `uEndCrisp` [0.25, 0.8] scales the azimuth and the radial gradient of the band read in the ending, so the mip level follows the radial footprint.
- Planet (`planet.ts`, `ending.limb`), all inside one loop that runs only when `uEnd.x > 0`, or scaled by `uEnd.x`:
  - Night side: the 12 texel flat tone is multiplied by the ratio of the map read 256 texels wide to the map read 12 texels wide (`nightMid`, `nightDetail` 1), so bands and the dark storm show at low contrast; ringshine `shine` [base, gain, from, to] on the cosine between the surface normal and the ring's normal on its lit side (passed from `set.ts` as `ringLit`), times `mu ^ nightLimb` (limb darkening of the night side, 0.35). The blur zone of the night side moves from the stop's edges (minus 0.1 to 0.25) to `nightEdge` minus 0.2 to 0, so the day side keeps its detail to the terminator.
  - Dusk: `dusk` (0.004, 0.014, 0.05) times `exp(ndl / duskWidth)` past the terminator, `duskWidth` 0.07 (at 5235 an e fold of about 3 percent of the radius), fading out over the first 0.3 of the day side.
  - Terminator: the light curve, the dusk and the gate of the forward term read `ndd = ndl + breakUp * (rel - 1 + breakCloud * cloud)` with `rel` the same band ratio and `cloud` the cloud alpha of the 256 texel read: bright bands and high cloud hold the light longer, dark bands lose it sooner (`breakUp` 0.09, `breakCloud` 1.2).
  - Day side: the forward term and the dusk are multiplied by the deck's own detail (deck texel over the 12 texel read, `detail` 0.8); the deck's albedo by that ratio to the power `deckBoost` 1.2; cloud alpha times `cloudGain` 1.6; clouds reach their full ratio at 0.25 of the light (`cloudTo`, was 0.4).
  - Lit sliver: `limbDark` [0.35, 0.25]: the surface loses up to 35 percent over the last cosine 0.25 toward the limb (2 percent of the radius), the air over it is not dimmed.
- Take 1 (09:22): shine [0.7, 1.6, -0.25, 0.55]: 5085 night side 51 to 57 blue in the ring lit zone (22 to 34 before). Take 2: [0.55, 1, -0.6, 0.5], limb power 0.5: 5235 darker than before (13 blue at the top). Take 3: [0.7, 2, -0.8, 0.4], limb power 0.35: 5235 17 to 29 blue in the upper half, 5085 59 to 64. Take 4: [0.6, 1.4], detail 1: 5235 final night disc mean 1.8, 4.5, 10.7 (before 1.6, 3.6, 8.2), still close to a flat tone below the ring line. Take 5 (09:30): [0.9, 1.8, -0.8, 0] and the day side terms (`deckBoost`, `cloudGain`).

### PART (09:36 VM clock), head f1df579

- Finals on f1df579 against main 616695b (`out/work/end/m112/after/` and `before/`), pairs in `out/work/end/m112/send/` and in looks.
- 5235, ring at radius 1.65 against the night disc beside it (`check/ending/arc.ts FRAME` prints for every 5 degrees of ring azimuth the pixel of three radii, the distance from the shadow's axis, whether the point is in front of the disc or hidden; `out/work/end/m112/arcmeasure.py` reads the finals there): inside the shadow (azimuth 255 to 275, 0.42 to 0.91 radii from the axis) before 2, 5, 12 on a night of 1, 2.5, 6.5; after 2, 6, 17 on 2, 6, 17, the ring is gone. Outside the shadow (azimuth 280 to 300, 1.03 to 1.4 radii) the near arc is sunlit and stays: 42, 74, 105 on the disc. The Sun is 32 degrees off the line of sight, so the shadow covers only the left part of the arc that crosses the disc.
- 5235 far loop, column x 600: gaps 46 to 76 blue between ringlets of 103 to 128 (before 61 to 90).
- 5235 night disc (inside 0.97 radii, left of the crescent): mean 2.5, 6.8, 16.6, blue p5, p50, p95 3, 15, 42 (before 1.6, 3.6, 8.2 and 3, 6, 21). Column x 200 from the top limb down every 40 px: 28, 30, 24, 19, 17, 15, 12, 9, 6, 5, 3 blue (before 22, 10, 7, 10, 6, 5, 5, 4, 4, 4, 5). Row y 643 through the inner edge of the crescent every 6 px: 23, 24, 28, 30, 29, 33, 34, 37, 44, 56, 87, 188, 217 (before 17, 18, 22, 21, 20, 23, 24, 26, 26, 30, 65, 178, 219).
- 5235 Sun crop (x 1196 to 1356, y 294 to 454): 0 pixels differ. Right of x 760: 25 pixels differ by 1 level.
- 5085: day side high pass (sigma 12 px, x 330 to 720, y 455 to 560) 12.1 to 15.1; night side column x 524 every 40 px from y 440: 244, 197, 191, 97, 58, 62, 61, 18 (the storm), 58, 39, 19, 17, 19, 13 blue (before 240, 206, 159, 47, 34, 28, 22, 19, 14, 9, 8, 7, 6, 6).

### MAIL 125 (09:38 VM clock), word for word

"MAIL 125 from the Builder. PART read and the six pairs looked at. Accepted in direction: at 5235 the night disc now has depth (bands, the storm, the fall to black at the far limb) and the ring ends cleanly at the shadow edge; the ringlets hold their gaps. One change, your one number: at 5085 the night side in the ring lit zone is too light at 58 to 62 blue, the terminator stops reading as the edge of the light. Bring it to about 40 to 45 there (the storm and the lower limb fall with it), and leave 5235 as it is if that is a separate number; if it is the same number, tell me what 5235's night becomes and keep its p50 at 12 or more. Then DONE by 10:25 with the byte proofs as you list them; batch 21 is cut at about 10:30. The Sun of the lookback is noted as the engine's; nothing for you there."

- It is one number for both frames (`shine`). A plain cut that brings 5085 to 43 would take 5235's p50 from 15 to about 10 (the levels follow `air + deck * factor`: 5085 about 12 + 19 * factor, 5235 about 6.5 * factor). So a second number: the ringshine is scaled by the phase angle, `shineNear` (0.46) at `shinePhase[0]` (100 degrees) and below, 1 at `shinePhase[1]` (146 degrees, the lookback starts at 146.6) and above; at 5085 (117.9 degrees) the scale is 0.64. At the start of the retreat (phase 90) the night side then stands near the stop's own level and comes up as the camera goes behind the globe and the crescent thins, as an exposure set for the crescent would do. Uniform values only, no shader text changes.
