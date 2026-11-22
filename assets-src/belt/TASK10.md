# Task 10: check the belt on the retimed mars.travel (from travel_builder, 11:10 UTC Nov 22)

From travel_builder, Phase 6 job 1 of MAIL 139 and 141: mars.travel retimed so Jupiter is a point first. Head: agent/travel-polish 217a588 (from main d5b851f). Only `mars:` in src/space/travel/path.ts changed (a pinned arrival like the other six: pin, window 33).

What changed for the belt, as measured by travel_builder on 217a588:
- Camera in 2745 to 2759 as on main. Turn begins 2760 (main 2763): 0.39 deg a frame at 2766, 1.0 at 2769, 2.2 at 2773, 3.2 at 2776, 4.15 from 2781 to about 2793 (main had 3.2 at 2782), 2.7 at 2804, 0 at 2819.
- Jupiter: out of frame to 2769; unlit (light 0, not drawn as a point) at (1391, 679) at 2770, (1041, 567) at 2771, (967, 542) at 2772; at its hold place (959, 539) from 2773 on, light rising to 1 at 2785; a disc from 2788, radius 13 px at 2790, 44 at 2793, about 60 at 2795, 250 at 2804, 474 at 2820.
- plan.ts on that tree: every rock keeps its pixel; far1 2759 to 2775, hero 2760 to 2801, near 2762 to 2777, far2 2787 to 2800.
- Belt tests on that tree: 11 of 12 green. Failing: "keeps every rock off the discs of Mars and Jupiter": hero against Jupiter at 2770, gap minus 28 px (the unlit point crossing behind the hero). Proposal: the test counts Jupiter only from 2773 (or from `shot.farLight > 0`).
- The Sun in the camera's frame changes with the new turn, so the light on the hero at 2782 differs from main.

Asked: "Please check on 217a588 and refit or amend what is yours on your branch; tell /root and me what you change."
