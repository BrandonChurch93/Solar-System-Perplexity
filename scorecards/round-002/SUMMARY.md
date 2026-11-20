# Round 2 · Phase 2 · blockout

- Build: main at 612ae01, preview format, draft tier, full asset set.
- Machine checks before the pack: G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15 green.
- Measures: none in a blockout round.
- Critic: R4 blockout, one fresh agent on its own VM, eight attached sheets, the rubric word for word. Family: gemini_4_carbon. Round 1 used gpt_6_2_sol.
- This was the last blockout round (`quality.blockoutMaxRounds` is 2).

## Score

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R4 blockout | 5 | no | 1 | 4 | 2 |

Round 1 scored 7 from a different family. The two critics name the same three places (the sameness of the stops, `mars.travel`, `ending.lookback`), so those are real. The lower number is this critic's harder line on the hold framing, which the kit fixes.

## Issues and what was done

1. Severe, whole film: every planet stop repeats one 19 second cycle with the globe centered in the hold. Not changed: the hold framing is the approved hero image (kit/08 Phase 2 step 3 says to match it at every judged hold), and the segment times come from `config/showcase.json`, which Brandon sets and reviews in the rough cut. Changed after the round: every arrival now also starts off center and drifts to the hero framing (`arrive.offset` in each plan), on top of the swings from round 1. Open item 1.
2. Major, `ending.lookback`: camera nearly frozen on a dark frame. Changed after the round: the camera never stops. It pulls back 1.2 percent a second, circles Neptune by 3 degrees and pans 4.5 degrees toward the Sun on one ease that runs to the last frame. The real sky map is in, so the Milky Way now sits behind the Sun. Open item 2 until a critic sees it in Phase 5.
3. Major, `mars.travel`: Mars leaves in six frames, then empty sky, then Jupiter grows on axis. Changed after the round: the turn away from Mars is 30 percent longer, and Jupiter comes in from the upper right and drifts to center. The sheets are draft tier with one sample, so the turn shows without its motion blur. Open item 3 until Phase 5.
4. Major, `sun.terrain`: nearly static. The stand-in is a flat plate, so a larger glide only slides and crops the picture. The Sun's relief in Phase 4 gives the opening its parallax. Open item 4.
5. Major, `mars.dive`: on-axis zoom, Phobos pushed out of the bottom, a pitch snap at the cover, a stall after it. The dive is rebuilt in Phase 3 with the patches, the relief and the dust cover: arc past Phobos, carry the horizon angle through the cover, keep gliding. Open item 5, closed or carried by the Mars rounds.
6. Minor: dive frames clip the poles against the frame edge. Taken into each stop's dive in Phases 3 and 4.
7. Minor: every terrain view has a level horizon in the upper quarter. That is how the approved close images are composed. Camera height, bank and sweep are varied per stop in Phases 3 and 4.

## Next

The limit is reached. The open items are in `kit/PROGRESS.md`. Phase 2 goes on to its preview film, proof and gate.
