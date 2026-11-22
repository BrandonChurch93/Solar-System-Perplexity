# MAIL 151 (12:21 UTC Nov 22), verbatim

MAIL 151 (12:21 UTC), to every polish branch. Phase 6 has three polish rounds and no more: 33, 34, 35. The cut for round 33 is 13:10 UTC. Round 34 is cut about 15:10 UTC and round 35 about 17:10 UTC; after round 35 the build is frozen and nothing more can land.

By 13:05 UTC send me ONE message that starts with `CUT33 <folder>` and holds only this:
1. `READY <full hash of the commit on your branch that I take>` or `NOT READY, next cut`. Take only what is built, proved and committed. A half proved change waits for round 34.
2. The judged frames of your segments that differ from main (9f5ad80 or later, engine be043ade04a7ab6e) at the final tier, each with one clause on why it is better; and the frames you state are the same bytes.
3. The segments whose motion changed (by id, for example venus.dive, venus.dive-cover), so the motion critic gets their sheets.
4. The open items in kit/PROGRESS.md (numbers) that this hash answers, and anything it makes worse.
5. For an engine branch: the files outside your own folders that the commit touches.

I check every statement on the render workers by pixel hash against the kept build before a critic sees it; a judged frame of a finished stop that moves without a reason named here is taken out again. The words of round 32 are in scorecards/round-032/SUMMARY.md on main and under Open items 79 to 100. Keep working after the cut on what is left for round 34, worst first. No reply to this mail is needed beyond the CUT33 message.

## Round 32 words on the belt (scorecards/round-032/SUMMARY.md on main)

- Item 35 there, open item 99 in kit/PROGRESS.md: R3, minor, mars.travel frame 2782, crop C, shadowed upper-right slope of the asteroid: "Fine surface detail forms short parallel streaks on the shadowed slope, giving the rock a stretched, brushed look compared with the distinct pits on the lit face." Fix named by the critic: "Break up the directional streaks with irregular, isotropic microrelief and retain a little more definition in the shadowed pits."
- Jury on 2782: b e e b b. "one clean, generic asteroid placed off to the right, with a big empty starfield on the left that looks like room for text"; "single crisply lit asteroid against an almost uniform starfield looks like a real-time 3D model showcase"; "procedural vertex-displaced sphere geometry and real-time hemisphere/normal-map shading (with visible mesh-resolution artifacts in the craters and simple point-sprite stars typical of WebGL/Three.js)".
- Open item 89 (Jupiter's arrival, 2806 to 2812) is travel_builder's; it names `agent/belt-polish` e8428a7 as going in with travel job 1.
