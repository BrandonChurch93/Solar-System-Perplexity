# Round 54 · Phase 6 · uranus · round 2 of 3

- Build: main at 9d59e69 (engine hash f200e17ad0e70237, uranus hash 47616a4d185cb3b5), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 grok_4_7. R3 part 1 gpt_6_2_sol, part 2 claude_opus_5_5. R4 gemini_4_carbon. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: reused from round 38.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Smooth

| Stop | Report | Landing | Red lines | First lines | From |
| --- | --- | --- | --- | --- | --- |
| uranus | red | green | 3 | dive: pop score 1.63 from frame 4144 + 1/2 to the next, limit 1.2 (7 frames over it, first 4141 + 1/2); dive: the pattern of the picture changes in place by 1.61 from frame 4163 to 8 film frames later, band 8 px, limit 0.45 (102 frames over it, first 4136 + 1/2) (and 1 more) | full report at 9d59e699 on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz; landing at 9d59e699, from the job of the full report: the tree at the close is another build |

Each red line is one severe issue of its stop. A stop that is not measured does not hold its pass bar. The reports are the `smooth-*` files of this folder.

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 6 | no | 0 | 3 | 4 |
| R2 | | yes | | | |
| R3 | 5 (part 1: 6, part 2: 5) | no | 0 | 6 | 6 |
| R4 | 7 | no | 0 | 2 | 1 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b b a a b; terrain b b d b b, share 2 of 10. Judged: hold b b b d b; terrain b b d d d, share 0 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. smooth uranus, severe, smooth-uranus.md: "dive: pop score 1.63 from frame 4144 + 1/2 to the next, limit 1.2 (7 frames over it, first 4141 + 1/2)"
2. smooth uranus, severe, smooth-uranus.md: "dive: the pattern of the picture changes in place by 1.61 from frame 4163 to 8 film frames later, band 8 px, limit 0.45 (102 frames over it, first 4136 + 1/2)"
3. smooth uranus, severe, smooth-uranus.md: "rise: the pattern of the picture changes in place by 1.60 from frame 4399 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (81 frames over it, first 4385)"
4. R1, major, pair-03-b.png (uranus.terrain frame 4290), upper limb cloud band: "the horizon cloud band is far brighter and whiter than the target, up to about 50 luma and about 100 red, so it reads as a hard white stripe instead of soft cyan" Fix named by the critic: "lower the exposure and pull red out of that band until it matches the target's soft cyan, and soften the edges"
5. R1, major, pair-01-b.png (uranus.hold frame 4035), lower-right disk, just inside the terminator: "a bright spiral knot is present where the target is only smooth banded shading" Fix named by the critic: "remove the swirl and restore the smooth bands"
6. R1, major, pair-03-b.png (uranus.terrain frame 4290), cloud deck: "the atmosphere is warmer and brighter than the target; bright clouds run about 7 red high and many bands are 10 to 20 luma hot" Fix named by the critic: "cool the grade back toward the target cyan and lower highlight gain"
7. R3, major, image-06.png (uranus.dive frame 4137), crops A, C, E and G, across the close-up globe: "The cloud texture becomes soft and directionally smeared over large areas. Even the bright cloud tops in C have little internal definition at native size." Fix named by the critic: "Add finer cloud structure at the close-up scale and reduce directional texture blur while preserving the broad atmospheric bands."
8. R3, major, image-07.png (uranus.dive frame 4137), crop Q, center of the large vortex: "The filaments curl into a tight oval around a smooth, horizontally smeared center. The abrupt change in texture makes the eye look pinched rather than naturally resolved." Fix named by the critic: "Rework the vortex core so fine filaments taper into the eye without collapsing into flat horizontal streaks."
9. R3, major, image-13.png (uranus.rise frame 4436), whole disc, especially upper half (crops J, K, C, O): "the planet surface is smeared and painterly, with directional streaks that look like motion blur or a brush smudge; cloud tufts are soft blobs with no fine structure, so the disc reads as airbrushed and blurry at native size" Fix named by the critic: "re-render the atmosphere texture at higher resolution with crisp, layered band and cloud detail; remove the directional smear filter"
10. R3, major, image-13.png (uranus.rise frame 4436), lower center storm (crops A, P): "the vortex looks pasted on: a ring of bright, scribbly white strokes around a dark hole, with a different texture and sharpness from the surrounding smeared surface, and no flow of the bands into it" Fix named by the critic: "blend the storm into the band flow with matching resolution and shading, and give it a spiral structure that pulls the nearby clouds in"
11. R3, major, image-09.png (uranus.terrain frame 4290), ring arc endpoints at the limb, left and right (crops J, B, H, Q): "the rings rise from the horizon and drop back into it like a rainbow, and their strands end in sharp, tapered points right on the limb; nothing shows the ring passing in front of or behind the planet, and there is no ring shadow" Fix named by the critic: "draw the ring as a full ellipse with a front section crossing the disc, occlusion behind the limb, and a shadow cast on the clouds"
12. R3, major, image-09.png (uranus.terrain frame 4290), ring strands across the sky (crops B, C, F, G, K): "the rings are made of thin scratch-like streaks of uneven brightness that look like brush strokes or long-exposure trails rather than particle bands; some strands split and fade at random points" Fix named by the critic: "render the rings with a radial density profile and consistent gaps along the whole arc"
13. R4, major, sheet-02.png (uranus.dive sheet, frames 4110 to 4199), frames 4126-4183 across stars, left moon, rings, planet limb, and storm clouds: "fast dive and pitch-up motion has no shutter motion blur at all, leaving stars as 1-pixel pinpoints and thin rings and moon edges razor-sharp during 20-35 px/frame movement so fast motion strobes instead of blurring smoothly" Fix named by the critic: "enable continuous camera and object motion blur with enough temporal subsamples along the shutter interval so fast edges and point stars streak smoothly without discrete ghost copies"
14. R4, major, sheet-05.png (uranus.rise sheet, frames 4380 to 4454), frames 4393-4447 across sun, concentric rings, stars, moon, and receding globe: "rapid climb and pullback from terrain to space renders with zero motion blur, keeping thin ring arcs, stars, and cloud details pin-sharp across 25-45 px/frame displacements" Fix named by the critic: "apply smooth continuous shutter motion blur across the rise segment matching camera angular and radial velocity"
15. R1, minor, pair-01-b.png (uranus.hold frame 4035), illuminated left limb: "the limb edge is a few pixels hotter, about 30 luma, where the rings meet the disk" Fix named by the critic: "dim that edge to the target; the outer glow width already matches"
16. R1, minor, pair-01-b.png (uranus.hold frame 4035), upper ring arcs: "bright clumps along the strands sit about 20 pixels off the target, and some peaks are hotter" Fix named by the critic: "move the bright clumps back onto the target strands and match their brightness"
17. R1, minor, pair-03-b.png (uranus.terrain frame 4290), rings above the limb: "the bright ring strand is about 40 luma hotter than the target, and finer strands sit slightly off the target edges" Fix named by the critic: "lower ring brightness to the target and nudge the strands back onto the target edges"
18. R1, minor, pair-03-b.png (uranus.terrain frame 4290), cloud texture: "fine filament detail is a little softer than the target" Fix named by the critic: "restore high-frequency cloud texture without raising exposure"
19. R3, minor, image-07.png (uranus.dive frame 4137), crops K and M, sunlit limb: "A nearly white rim and broad glow wash out the cloud detail just inside the illuminated edge." Fix named by the critic: "Reduce the bloom peak and preserve the fine cloud contrast immediately inside the limb."
20. R3, minor, image-04.png (uranus.hold frame 4035), crops V and W, lower-right star field: "Several brighter stars read as soft, slightly elongated blue-white blobs with colored fringes instead of distinct points." Fix named by the critic: "Use a tighter star profile and reduce color fringing, reserving larger halos for the brightest stars."
21. R3, minor, image-13.png (uranus.rise frame 4436), left of the disc (crops B, F, N): "faint vertical ring lines appear only off the left limb and do not continue around or in front of the planet, so they read as stray hairline marks" Fix named by the critic: "either remove them or render a coherent ring system that wraps around the planet"
22. R3, minor, image-09.png (uranus.terrain frame 4290), lower left night side (crops D, N, S, T): "a large flat, near-black area with no surface detail and faint blotchy gradient steps" Fix named by the critic: "add faint night-side detail or dither the gradient to remove the blotches"
23. R3, minor, image-09.png (uranus.terrain frame 4290), middle terrain and clouds (crops A, E, P, V): "the cloud streaks are soft and slightly smeared, with low fine detail at native size" Fix named by the critic: "sharpen the cloud layer and add small-scale structure"
24. R3, minor, image-13.png (uranus.rise frame 4436), moon, upper left (crops B, J): "the small crescent moon is soft and has little surface detail" Fix named by the critic: "render the moon with crisp terminator and surface texture"
25. R4, minor, sheet-03.png (uranus.dive cover sheet, frames 4180 to 4191), upper concentric ring arcs across consecutive frames 4180-4191 (and matching ring arcs in sheet-01.png and sheet-06.png): "1-pixel-thin bright ringlets stair-step and modulate in peak pixel brightness by ~20-25% from frame to frame as the curved arcs cross pixel rows, causing fine-line shimmer" Fix named by the critic: "supersample or pre-filter thin ring features in screen space with a slightly wider antialiased filter kernel so subpixel ring motion holds steady brightness"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b, 65. The biggest factor was that it looks like a polished, generic Uranus-style planet render: faint rings, two small moons, and a Milky Way backdrop, all centered with plenty of dark space around it. That's the typical look of stock space art, like Shutterstock or Adobe Stock "planet in space" images. It's more stylized and dramatic than an accurate textbook illustration, more polished than ama
- hold, gpt_6_2_sol: b, 55/100. The centered, self-contained planet portrait looks composed as a standalone space illustration rather than as a shot in a sequence.
- hold, gemini_4_carbon: b Confidence: 72 Most influential factor: The polished commercial 3D "space wallpaper" look,a dead-center, smooth normal-mapped CG planet (with Earth-like cloud puffs, bright night-side fill, and a ring plane misaligned with the cloud bands) composited over a bright Milky Way backdrop with synthetic lens flare and corner chromatic dispersion, which is characteristic of commercial stock 3D illustra
- hold, kimi_k3: d, 78, the overly smooth painterly planet texture combined with physically odd ring geometry and AI-like surface artifacts.
- hold, grok_4_7: (b) 74. The dead-center cyan ice giant with a gold galaxy backdrop is a generic beauty-shot stock composition, not a film frame, diagram, web demo, or amateur piece.
- terrain, claude_opus_5_5: Answer: (b) stock image. Confidence: 50. Main reason: it's a polished but generic "planet horizon with rings, sun flare and Milky Way" composition in a wide 16:9 format, the kind of image sold as a stock or wallpaper backdrop. The ring geometry doesn't hold up physically: the arcs rise off the horizon like a rainbow. That points to a generated or composited stock asset rather than a film frame, a 
- terrain, gpt_6_2_sol: b, 68/100. The polished, standalone ringed-planet composition reads like a reusable sci-fi background.
- terrain, gemini_4_carbon: d Confidence: 82 Most influential factor: The physically impossible ring geometry,the rings form a rainbow-like semicircular arch with a smaller radius than the planet's own horizon curve, with individual strands drifting in spacing along the arc and terminating mid-air above the left limb, which is a classic hallmark of diffusion-generated space art rather than a 3D render or traditional composit
- terrain, kimi_k3: Answer: (d) amateur generated art. Confidence: 70. Most influential factor: the physically implausible ring geometry , the "rings" arc across the sky as a single cable-like bridge above the planet rather than encircling it in an equatorial plane, which is a classic image-model compositional artifact (plus the generic, over-polished glow/fill-light AI aesthetic). A film/AAA cinematic or real-time 3
- terrain, grok_4_7: d, 76, painterly smeared clouds and smoothed glowing rings without particulate detail, which read as diffusion-model output rather than a film frame, stock photo, textbook figure, or realtime engine.
- hold, claude_sonnet_5_5: Uranus. The image shows a pale cyan ice giant with faint rings and small moons, which fits Uranus. It looks like an artist's rendering, not a real photo.
- hold, gpt_6_2_sol: Uranus. The pale cyan ice giant plus prominently tilted, concentric narrow rings favor Uranus over Neptune. NASA confirms faint rings and many moons (https://science.nasa.gov/uranus/); exact image looks illustrative.
- hold, gemini_4_carbon: Uranus

## What changes next

To be written.
