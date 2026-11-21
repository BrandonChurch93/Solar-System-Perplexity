# Round 5 · Phase 3 · mars · look lock round 3 of 5

The last round before the Mars review, by Brandon's change of plan (logged under "Decisions made by the Builder"): motion first, small items dropped, rounds 6 and 7 not used.

- Build: main at 0ee8c76 (engine hash 73b844358c466906, mars hash 353338cc5c905af5, browser 147.0.7727.15), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack, on the Builder's VM: G1 G2 (22 tests) G3 G4 G6 G7 (47 judged frames) G10 G11 G12 G14 G15 green.
- Measures ran on a supporting agent's VM (4 cores) on the same commit (1245 s). G17 was computed again on the Builder's VM from the returned stills and gives the same numbers.
- The pack was rendered in three parts on supporting agents' VMs with `npm run pack -- --only` (16, 29 and 31 minutes) and assembled on the Builder's VM with no rendering. The tiles of every crop grid are exact copies of the frame's pixels.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gemini_4_carbon. R3 part 1 grok_4_7, part 2 claude_sonnet_5_5. R4 gpt_6_2_sol. R2 five jurors per judged image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors on the judged hold: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Control votes are reused from round 3, as `kit/07-QUALITY-BAR.md` says. Two jurors finished without sending their answer and were asked once to send it, with no other words. Long dashes in the jurors' answers are written as commas in `jurors.txt`.

## Measures

| Check | Result | Numbers |
| --- | --- | --- |
| G5 | pass | 0 invalid frames. Coverage 0.496 hold, 0.624 dive, 0.917 terrain, 0.347 rise |
| G13 | pass | 0 of 463 frames over 0.02 |
| G17 | pass | hold median 1.167, p25 1.027 (80 tiles). terrain median 0.951, p25 0.881 (76 tiles) |

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 7 | no | 0 | 3 | 3 |
| R2 | | yes | | | |
| R3 | 5 (part 1: 7, part 2: 5) | no | 0 | 8 | 5 |
| R4 | 6 | no | 0 | 2 | 1 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no major open. It does not hold. No severe issue.

R2 votes (a = film or game cinematic). Controls, from round 3: approved close a a d a a, approved hero b a d d b, pooled share 5 of 10. Judged: terrain a a d a d, hold b b d a b, pooled share 4 of 10. Pass: the judged share is not more than 0.2 under the control share. The jurors who did not vote (a) name the globe with a moon staged in front as a stock composition, and painterly rock strata under a hard starry horizon as generated art.

R8: judged hold named Mars by 1 of 3; two jurors named Phobos, the moon in front. Control hero named Mars by 1 of 3 (round 3, two said Phobos). Pass, level with the control. In round 4 the judged hold was named Mars by 3 of 3.

Against round 4: R1 8 to 7, R3 5 to 5, R4 6 to 6, R2 4 of 10 to 4 of 10, R8 3 of 3 to 1 of 3. No score rose. A different critic family judged each rubric than in round 4, so the one point on R1 cannot be told apart from the difference between critics; it is not counted as a gain or a loss. Not raised this round: the dust painted over black space outside the limb at both covers, the 75 degree roll after the rise cover, the hook strokes at 2427, the feather and plume shapes in the canyon. Down from major to minor: Phobos' softness and outline, the airbrushed plains. Still major in other words: the limb on both sides, the polar cap in the rise, both covers. The terrain view drew no motion issue.

## What Brandon asked for in this round

1. The dive between 2440 and 2460. Before: the whole plunge ran ahead of a thin cover and the frames were blur. Now: a readable growing globe to 2447, streaming dust from 2448, the limb band swinging level by 2453, the canyon through thinning dust from 2456. R4 no longer reports the picture going soft or dust over space. What R4 still reports there is issue 2 in the list below.
2. The terrain view. Measured travel from 2490 to 2669 at 1920 x 1080: near escarpment 626 px, mesa cap 136 px, far rim 47 px. R4 raised nothing against it.

## Issues, all left open for the Mars review

1. R4 major, rise cover 2695 to 2706: "The nearly level terrain horizon disappears into a stationary-looking horizontal haze band. As that band clears, a curved orbital limb and a different-looking star field register within two frames, so the pullback reads as a concealed cut rather than the same camera move."
2. R4 major, dive cover 2456 to 2460: "The radial streaks fade over an already recognizable canyon image, whose foreground cliffs and horizon resolve almost in place. The dive appears to stop under a blur dissolve rather than ease into the terrain glide."
3. R1 major, hold 2325, sunlit limb: "the planet disc terminates in a hard, stair-stepped aliased circular cutout against the outer glow", and the blue glow fades out near the bottom left frame edge.
4. R1 major, hold 2325, night limb: "a razor-sharp dark geometric cutout slicing abruptly into the starfield", dim blue cloud detail lost at the lower right, one stray soft blue-white spot outside the upper right limb.
5. R1 major, hold 2325, inside the lit limb and on the cap: "a blocky speckled orange noise patch next to the upper volcano, a bright orange-white angular glitch mark in the lower-left clouds", stretching smudges, stepped rings across the cap.
6. R3 major, hold 2325 and dive 2427 (part 1): the dust storm spiral "is a soft painted layer: smeared wisps, no self-shadow, and a frequency disconnect from the sharp canyons under it". The spiral is in the approved hero.
7. R3 major, rise 2726 (part 2), four items: the surface away from the hero's own view "looks melted and smeared"; the swirl is "a tight, painterly whorl"; the cap is "a blown-out, nearly pure white blob" with a ragged edge and flecks; the dark side shows "faint vertical striations and a grid-like texture" and no soft terminator.
8. R3 major, terrain 2580 (part 2), two items: the shadowed lower terrain is "muddy and smeared with little real detail"; the horizon glow is "a flat, hot band with a fairly hard lower edge".
9. Minors: the moon's speed change at 2408 to 2424 (R4); aliased Phobos outline with a double rim, soft cliff striations and stars, valley haze lifting the darks (R1); airbrushed plains, Phobos softer than the planet (R3 part 1); far terraces repeat, a uniform cyan rim with a doubled edge at the bottom, uneven stars with one stray pink dot (R3 part 2).

Checked by the Builder after the answers: the grid and striations in near-black areas, reported in rounds 4 and 5, are not in the frame's pixels. A Fourier check of dark crops of frames 2726 and 2325 shows no peak at 8 pixels, and the pack tiles are exact copies of the frame. The grid images are 1400 pixels wide; a viewer that resamples them turns fine grain into a pattern. Logged as open with that note.

No fix follows this round. The build goes to the Mars review as it is, with these items under "Open items" in `kit/PROGRESS.md`.
