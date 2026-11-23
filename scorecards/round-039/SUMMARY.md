# Round 39 · Phase 6 · neptune · round 1 of 3

- Build: main at 9972260 (engine hash 743c10b0a56aaca7, neptune hash 838c580b3fc2090e), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gpt_6_2_sol. R3 part 1 claude_opus_5_5, part 2 gemini_4_carbon. R4 grok_4_7. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: judged in this round.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | fail |
| G17 | pass |

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 8 | no | 0 | 1 | 6 |
| R2 | | yes | | | |
| R3 | 4 (part 1: 4, part 2: 4) | no | 4 | 4 | 5 |
| R4 | 6 | no | 0 | 2 | 0 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b a d b b; terrain a a d d b, share 3 of 10. Judged: hold b b b b b; terrain d a d a d, share 2 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-05.png (neptune.dive frame 4707), storm eye at centre (crops A, Q in image-06/07): "the eye has stray electric-blue pixels and specks that look like compression or shader noise, and the white cloud fragments inside the eye have hard, cut-out edges" Fix named by the critic: "remove the saturated blue speckle, re-render the eye with real cloud detail, and blend the inner cloud fragments into the vortex"
2. R3, severe, image-05.png (neptune.dive frame 4707), lower right clouds (crops V, W, E in image-06/08): "clouds break into blocky square patches; you can see the tile or texture blocks at native size" Fix named by the critic: "raise the cloud texture resolution or filtering so the cloud edges are continuous rather than made of square blocks"
3. R3, severe, image-13.png (neptune.rise frame 5006), left, central, and terminator globe regions (crops image-14.png A, B, H; image-15.png J, O, P, Q): "most of the planet cloud deck is heavily smeared and directionally blurred into soft, airbrushed streaks with linear comb-like stepping near the terminator, leaving only a small patch near the upper-right vortex sharp" Fix named by the critic: "use a uniformly sharp high-resolution spherical cloud map across the full globe without directional blur or stretched streaks"
4. R3, severe, image-13.png (neptune.rise frame 5006), ring system on right half and dark lower-right limb intersection (crops image-14.png C, E, F, I; image-15.png M, Q, R; image-16.png V): "at native size the rings break into short, straight parallel brushstrokes that cut across the curved ring plane rather than following concentric orbital arcs, and fade out in a fuzzy gap near the dark planet limb" Fix named by the critic: "generate ring striations and particle density along true elliptical orbital coordinates and occult them cleanly against a crisp planet silhouette"
5. R1, major, pair-02-b.png (neptune.hold frame 4605), hold crop B and H at the upper-left shadow limb, and crops E, G and I down the right limb: "The atmospheric rim is more outlined than the target. On the shadow side a narrow blue stripe borders a cutout-like dark edge; down the bright right side a smooth, dark inner band separates the surface from the blue rim." Fix named by the critic: "Feather the blue rim into the sky on the left and blend the dark inner band into the lit cloud deck on the right, retaining the target's peak brightness and more gradual falloff."
6. R3, major, image-05.png (neptune.dive frame 4707), whole frame, especially the cloud bands (crops C, G, L, R, M): "a heavy radial or zoom blur smears everything into streaks; the cloud edges turn into comb-like smears and nothing is sharp anywhere, so the frame looks like a stretched low-res texture rather than a real close-up" Fix named by the critic: "cut back the zoom blur a lot, keep a sharp focal area around the eye, and add true high-frequency cloud detail"
7. R3, major, image-05.png (neptune.dive frame 4707), upper right limb and sky (crops M, N in image-07): "the stars and sky at the limb are a warm, grainy smudge that does not match the starfield in image-01, and the limb line is soft" Fix named by the critic: "use the same crisp starfield and a clean atmospheric falloff at the limb"
8. R3, major, image-09.png (neptune.terrain frame 4860), opaque blue and shadowed cloud deck across the planet surface (crops image-10.png A, D, E; image-11.png N, O, P, R; image-12.png S, U): "stray pinpoint white star-like dots are scattered directly on top of the opaque cloud deck and dark storm bands where background stars cannot appear" Fix named by the critic: "mask the starfield strictly outside the opaque planet disc and remove stray white pixel specks from the cloud layer"
9. R3, major, image-13.png (neptune.rise frame 5006), sunlit upper-left/upper-right limb and shadowed right limb (crops image-14.png A, G; image-15.png J, K, L, Q): "a thin bright cyan rim line separates from a soft outer halo, terminates abruptly partway down the dark right limb, and has undimmed pinpoint stars sitting directly on the bright atmospheric edge" Fix named by the critic: "replace the doubled rim-and-halo edge with a smooth atmospheric scattering falloff that tapers naturally into the nightside and attenuates stars behind dense limb haze"
10. R4, major, sheet-02.png (neptune.dive sheet, frames 4680 to 4769), upper right star, frames 4688 and 4696: "fast motion splits the star into a black core and a separate ghost copy that drifts off the flare" Fix named by the critic: "keep the star one point and replace the double image with a single smooth blur"
11. R4, major, sheet-02.png (neptune.dive sheet, frames 4680 to 4769), whole frame, frames 4688 to 4696: "dive speed and field of view jump: the star shifts about 12px over the previous 8 frames and about 76px over these 8, and the planet lunges from a slow approach toward filling the frame" Fix named by the critic: "ease the start over more frames so position, speed, and field of view ramp instead of lunging"
12. R1, minor, pair-02-b.png (neptune.hold frame 4605), hold crops D and I, foreground rings over the lower-left nightside and in the lower-right sky: "The foreground strands are sharper and more parallel than the target, especially where they cross the dark disk; the target breaks them up into faint, uneven wisps." Fix named by the critic: "Reduce strand contrast and continuity, vary the opacity along each arc, and soften the bands where they pass over the nightside."
13. R1, minor, pair-01-b.png (neptune.hold frame 4605), hold frame, upper-right sun: "A tiny dark notch interrupts the bright source core; the target has a clean white center." Fix named by the critic: "Fill the notch into the white core without increasing the flare's size or overall brightness."
14. R1, minor, pair-01-b.png (neptune.hold frame 4605), hold frame, upper-left moon: "The illuminated disk reads rounder and slightly squatter, with a softer mottled transition instead of the target's more irregular, cratered terminator and deep lower-left shade." Fix named by the critic: "Bring the silhouette and terminator closer to the target and restore crisp, localized crater relief where the warm cap meets the cooler light."
15. R1, minor, pair-04-b.png (neptune.terrain frame 4860), terrain crops A and G, central storm eye and the inner turn of its left shoulder: "Extra bright-blue filaments fill the inner eye, making the core look mottled and the boundary less distinct than the target's broad, smooth dark center." Fix named by the critic: "Suppress the high-frequency texture and slightly deepen the center, keeping most of the spiral texture on the eye's outer wall."
16. R1, minor, pair-04-b.png (neptune.terrain frame 4860), terrain crops A, D, E and H, foreground cloud crest and its shadow: "The cloud curls and trailing filaments are softer, with less fine separation between the sunlit crest, its wisps and the blue-black shadows." Fix named by the critic: "Restore local microcontrast and fine wisps on the crests and tails while holding the shadow floor and the overall light direction."
17. R1, minor, pair-04-b.png (neptune.terrain frame 4860), terrain crops C and F, fine star field and diagonal galactic dust above the horizon: "The faintest stars and small dusty knots are less crisp than in the target, though their alignment is unchanged." Fix named by the critic: "Recover faint point definition and dust texture without lifting the black sky or adding stars."
18. R3, minor, image-01.png (neptune.hold frame 4605), dark lower left, rings and night side (crops T, D, O in image-03/04): "a faint square grid or tile pattern and slight banding show in the near-black gradient" Fix named by the critic: "add dither or noise to the dark gradient and remove the tile seams in the background layer"
19. R3, minor, image-01.png (neptune.hold frame 4605), rings (crops I, X, U): "the rings are thin, ghostly streaks that look painted on rather than solid, and they fade out unevenly" Fix named by the critic: "give the rings a consistent structure and opacity, and make them cast or take shadow from the planet"
20. R3, minor, image-01.png (neptune.hold frame 4605), moon at upper left (crop J): "the moon's surface is smooth and slightly airbrushed, with little crater detail and a weak terminator" Fix named by the critic: "add higher-resolution surface detail and a sharper day-night boundary"
21. R3, minor, image-09.png (neptune.terrain frame 4860), lower-right foreground end of the white cloud band (crops image-10.png E; image-12.png U): "the near-camera cloud wisps become soft and smeared compared with the crisp mid-ground cloud tops" Fix named by the critic: "maintain crisp high-frequency cloud filament detail through the lower-right foreground or use physically consistent depth-of-field across the entire near plane"
22. R3, minor, image-09.png (neptune.terrain frame 4860), bright atmospheric limb band and sky above right limb (crops image-10.png C; image-11.png J, K): "several pinpoint stars shine unattenuated inside the bright lower atmospheric haze band and the brightest star in tile C/K shows a slightly smudged asymmetric blob" Fix named by the critic: "attenuate background stars proportionally to atmospheric optical depth near the horizon and render bright star point-spread functions cleanly"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: (b) stock image, confidence 60. Main influence: it's a polished, generic Neptune-like space scene (Great Dark Spot, Triton-like moon, starburst sun, Milky Way backdrop, faint rings) built for broad appeal and visual drama rather than scientific accuracy. That points to stock/editorial space art, not a textbook diagram or a film frame. The photoreal rendering quality rules out amateur art and a rea
- hold, gpt_6_2_sol: b, 64/100. The strongest cue is the self-contained, wallpaper-like composition: a dominant planet framed by a small moon and a starburst.
- hold, gemini_4_carbon: b Confidence: 85 Most influential factor: It exhibits classic commercial space-stock photobashing ("Elements furnished by NASA" style),repurposed NASA photography (Voyager 2's Triton cutout with a 1-pixel dark matte fringe and a phase illumination angle that mismatches the pasted starburst lens-flare Sun, plus blue-tinted Earth storm clouds and a 2D ring layer soft-masked short of the planet's out
- hold, kimi_k3: b, 78, most influential: it has the polished but generic look of a stock space illustration,dramatic planet/moon/star composition without cinematic scene-specific storytelling, textbook labels, or real-time demo artifacts.
- hold, grok_4_7: b, 76, generic planet-moon-star beauty shot with no narrative subject
- terrain, claude_opus_5_5: Answer: (d) amateur generated art. Confidence: 50. Main influence: the weather doesn't make physical sense. The "storm" is a dark, cloudless eye in open ocean, and next to it is a giant wispy cloud band that looks like close-up smoke at planetary scale. That points to an AI-generated image rather than a professional VFX frame, which would get a hurricane right. The polished, cinematic teal grading
- terrain, gpt_6_2_sol: a, 66/100. The grazing light on the foreground clouds gives them convincing three-dimensional depth.
- terrain, gemini_4_carbon: d Confidence: 82 Most influential factor: The scale-incoherent meteorology typical of text-to-image generation,a terrestrial-scale billowing cumulus/smoke plume and sunken water-whirlpool pit sitting oversized across a visibly curved planetary globe, rather than flat, orbital-scale cyclonic cloud structures.
- terrain, kimi_k3: a, 74 , Most influential thing: the highly polished cinematic composition and coherent atmospheric/cloud detail make it read like a big-budget film or AAA cinematic frame.
- terrain, grok_4_7: d 64 The cloud wisps look brush-smeared and generative, and the storm reads as an unnatural dark hole, in a generic beauty shot with no cinematic subject, textbook labels, or real-time geometry.
- hold, claude_sonnet_5_5: Neptune. The image shows a blue planet with a dark storm spot like Neptune's Great Dark Spot. A small pale moon, likely Triton, sits on the left.
- hold, gpt_6_2_sol: Neptune. The deep-blue planet with a prominent dark storm, faint rings, and nearby moon matches a Neptune illustration.
- hold, gemini_4_carbon: Neptune

## What changes next

Neptune round 2 of 3 after the engine's capped shutter (E6, decision d129) is on main: the red measure G13 at 4721; on the judged dive frame 4707 the stray electric blue pixels and cut out cloud fragments in the storm eye, the clouds that break into blocky square patches at the lower right, the zoom blur over the whole frame and the warm grainy smudge at the limb; on the judged rise frame 5006 the smeared cloud deck with comb stepping at the terminator, the rings that break into short straight strokes and fade in a fuzzy gap at the dark limb, and the cyan rim line that parts from its halo and stops partway down; the star dots on the opaque cloud deck in the terrain view 4860; the star that splits into a core and a ghost at 4688 and 4696 and the lunge from 4688 to 4696; the rim on the hold that reads as an outline with a cutout dark edge.
