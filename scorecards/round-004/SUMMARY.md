# Round 4 · Phase 3 · mars · look lock round 2 of 5

- Build: main at 1d1a55c (engine hash 0e093b3edf98f5cc, mars hash 817821f71e13abe3), master format, final tier for judged stills, review tier for sheets, full asset set.
- Machine checks before the pack: G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15 green.
- Measures ran on the Builder's VM on the same commit (1150 s). A first run on a supporting agent's VM at 24c2334 was green too; the sky was then changed inside the round, before any critic saw a pack, and the measures were run again.
- The pack took about nine hours on the Builder's VM (two cores). From round 5 on the pack is split across supporting agents' VMs with `npm run pack -- --only`.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gpt_6_2_sol. R3 part 1 claude_opus_5_5, part 2 kimi_k3. R4 gemini_4_carbon. R2 five jurors per judged image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors on the judged hold: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Control votes are reused from round 3, as `kit/07-QUALITY-BAR.md` says.

## Measures

| Check | Result | Numbers |
| --- | --- | --- |
| G5 | pass | 0 invalid frames. Coverage 0.496 hold, 0.624 dive, 0.917 terrain, 0.348 rise |
| G13 | pass | 0 of 463 frames over 0.02 |
| G17 | pass | hold median 1.074, p25 0.999. terrain median 0.950, p25 0.899 |

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 8 | no | 0 | 2 | 7 |
| R2 | | yes | | | |
| R3 | 5 (part 1: 5, part 2: 7) | no | 0 | 5 | 6 |
| R4 | 6 | no | 0 | 2 | 2 |
| R8 | | yes | | | |

R1 returned `pass: true` with a score of 8 and two majors. The pass bar asks for 9 with no major open, so R1 does not pass.

R2 votes (a = film or game cinematic). Controls, from round 3: approved close a a d a a, approved hero b a d d b, pooled share 5 of 10. Judged: terrain a a d b a, hold b a b b d, pooled share 4 of 10. Pass: the judged share is not more than 0.2 under the control share. Jurors name the centered globe with a moon parked in front, the even outer glow and the painterly rock strata.

R8: judged hold named Mars by 3 of 3. Control hero named Mars by 1 of 3 (round 3). Pass.

Against round 3: R1 6 to 8, R3 4 to 5, R4 6 to 6, no severe issue left. The smear on the judged motion frames, the blocky cap, the star dashes, the terrain blob and the sky band are gone from the lists.

## Issues and what changes next

1. R4 major, both covers (frames 2449 to 2451 and 2702 to 2705): the dust is a full-frame wash that also paints over black space outside the curved limb. Next: on the orbit side the dust is held inside the planet's air, so space above the limb stays dark until the horizon has left the frame.
2. R4 major, dive 2440 to 2449 and rise 2705 to 2724: the canyon's direction and the horizon do not carry across the covers; the globe rolls about 75 degrees in under 20 frames after the rise cover, with a burst of motion at 2703 to 2705. Next: the roll is spread along the whole move so the heading before and after each cover is one line, and the climb out eases under the dust.
3. R4, the dive between 2440 and 2460 (Brandon's note, and what the round 4 sheets show): the picture turns to mush ahead of a thin cover. Cause: the whole plunge ran in frames 2430 to 2453. Next: a steady approach, the plunge inside a cover that holds, dust that streams from the direction of travel.
4. R4, terrain (Brandon's note; the round 4 sheet shows a near-static view): next, a glide that travels 1.65 camera heights with the relief extended at its edges, so the near cliff moves against the far rim along the whole view.
5. R1 major and R3 major, hold: the lit limb ends harder and speckled, the surface next to it reads airbrushed, stars sit too close to the rim. Next: grazing haze fitted to the approved limb, an oblique taper on the detail near the limb, sky patch with the approved image's own star points next to the rim.
6. R3 major, rise 2726: the polar cap is a soft smear with detached bright fragments. Next: repaint the cap.
7. R3 major, hold: Phobos is soft with a cut-out edge. Next: repaint the ground behind it; its own softness stays open.
8. R3 major, hold: a feather-like blob and a dark plume in the canyon. Both shapes are in the approved hero. Logged as open, not painted out, because R1 holds the frame to the hero.
9. R3 major, dive 2427: hook-shaped bright strokes on the dark side near the terminator. Next: the night floor is checked at 2427.
10. Minors: speed step at 2670 where the rise begins (R4); Phobos is not in the pullback (R4); 8 px block grid in the near-black sky and soft stars (R3, R1); bluish wisps on the night side (R3); muddy shadowed mesa and lifted warm shadows in the terrain (R3, R1); storm swirl soft with a halo (R3); amber haze too high at the left of the terrain horizon (R1).

By Brandon's change of plan (logged under "Decisions made by the Builder"), round 5 puts the motion first, small items such as the 5 pixel outline fit are dropped, and Mars goes to its review after round 5.
