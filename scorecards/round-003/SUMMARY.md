# Round 3 · Phase 3 · mars · look lock round 1 of 5

- Build: main at 696e228 (engine hash ebbd4eca3efac9a3, mars hash 9efcf2aa3f2debf4), master format, final tier for judged stills, review tier for sheets, full asset set.
- Machine checks before the pack: G6 and G11 were red, fixed on the first attempt (see `kit/PROGRESS.md`), then G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15 green.
- Measures ran on a supporting agent's VM on the same commit (732 s). G17 was recomputed on the Builder's VM from the agent's stills and matched.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 claude_opus_5_5. R3 part 1 gpt_6_2_sol, part 2 gemini_4_carbon. R4 claude_opus_5_5. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon.

## Measures

| Check | Result | Numbers |
| --- | --- | --- |
| G5 | pass | 0 invalid frames. Coverage 0.496 hold, 0.922 dive, 0.917 terrain, 0.517 rise |
| G13 | pass | 0 of 463 frames over 0.02. Worst frame 2422 at 0.003 percent |
| G17 | pass | hold median 1.064, p25 0.959. terrain median 1.008, p25 0.984 |

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 6 | no | 0 | 3 | 2 |
| R2 | | yes | | | |
| R3 | 4 (part 1: 5, part 2: 4) | no | 3 | 4 | 3 |
| R4 | 6 | no | 0 | 2 | 4 |
| R8 | | yes | | | |

R2 votes (a = film or game cinematic). Controls: approved close a a d a a, approved hero b a d d b, pooled share 5 of 10. Judged: terrain a a b a a, hold b b b a b, pooled share 5 of 10. Pass: the judged share is not more than 0.2 under the control share. The hold gets the same vote as the approved hero. Jurors name the centered globe and the blue limb glow as stock.

R8: judged hold named Mars by 2 of 3 (one said Mars or Phobos). Control hero named Mars by 1 of 3 (two said Phobos). Pass.

## Issues and what changes next

1. R3 severe, dive frame 2427 and rise frame 2726: heavy smear, no sharp anchor. Cause: the old timing put half the descent before the cover, so the judged frames sat at 25 px (dive) and 11 px (rise) of travel per shutter. Next: retime both moves so the speed peaks inside the cover and the judged frames are near still (ladder "Fast motion breaks into ghost copies", rung 3). R4 names the same blur as a minor.
2. R3 severe, rise frame 2726: polar cap pixelated and blocky. Seen through the smear. Next: check the cap again in a sharp frame, then decide.
3. R1 major and R3 major: limb glow is a thin hard cyan line, the approved hero has a wide soft pale haze. Next: a second, wide haze layer and a less saturated day color, fitted to the hero by measured profiles across the limb.
4. R1 major and R3 major: the Milky Way is fainter, soft and blotchy, and the star points are too even, large and bright. Next: wider band, fewer medium stars, more fine ones.
5. R3 major: stars are short dashes near the limb. Cause: the sky was drawn once per time sample while the lens zoomed. Next: draw the sky with the mid-shutter lens and turn in every sample so stars stay points, as `kit/04-LOOK.md` says.
6. R1 major, terrain: a white blob with a curved streak under the right mesa. Cause: the far relief grid won the depth test inside a band it should hide behind. Fixed by the relief agent (`agent/mars-relief`), to verify by render.
7. R4 major, terrain: no depth, the near cliff and the far rim move the same 20 px. Next: a real glide with forward travel, so the near ground moves against the rim.
8. R4 major, terrain: nothing flows. Next: drifting valley dust and horizon haze.
9. R3 major, dive: color fringes on bright ridge edges. Next: find the source at 2427 in a sharp frame.
10. Minors: the globe does not turn in the hold (R4); stars pop through the dust at 2704 to 2706 (R4); horizon height and curve change inside the dive cover (R4); reddish speckles near the lower limb (R1); terrain sky lost its faint band (R1); banding in the horizon haze, soft shadowed walls, grain streaks on Phobos (R3).

Checked and not an issue: the rectangular seam above the canyon system that one juror named is in the approved hero itself.
