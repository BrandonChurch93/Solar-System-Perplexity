# Round 48 · Phase 6 · mercury · round 1 of 3

- Build: main at 73809f4 (engine hash 13d9cc752b1d9c4e, mercury hash b567b9815f9b2fba), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 claude_opus_5_5. R3 part 1 gemini_4_carbon, part 2 grok_4_7. R4 gpt_6_2_sol. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: judged in this round.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Smooth

| Stop | Report | Landing | Red lines | First lines | From |
| --- | --- | --- | --- | --- | --- |
| mercury | red | green | 4 | rise: rest: the picture comes to rest between the rise and the travel: the fastest point of the body's edge moves 0.30 px a film frame at frame 1037, 0.012 of the slower end of the window, limit 0.07; dive: the pattern of the picture changes in place by 1.02 from frame 746 + 1/2 to 8 film frames later, limit 0.45 (37 frames over it, first 719 + 1/2) (and 2 more) | full report at 73809f4b on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz; landing at 73809f4b, from the job of the full report: the tree at the close is another build |

Each red line is one severe issue of its stop. A stop that is not measured does not hold its pass bar. The reports are the `smooth-*` files of this folder.

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 8 | no | 0 | 1 | 6 |
| R2 | | yes | | | |
| R3 | 3 (part 1: 3, part 2: 6) | no | 3 | 6 | 4 |
| R4 | 8 | no | 0 | 0 | 2 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold a b a a b; terrain b a e a a, share 6 of 10. Judged: hold b b b b b; terrain a a a a a, share 5 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-06.png (mercury.dive frame 717), upper-left and upper-center globe near terminator (crops B, F, G in image-06.png and crops J, K, L in image-07.png): "severe polar UV stretching smears craters and surface texture into long diagonal streaks" Fix named by the critic: "remap the globe with cube-sphere or triplanar projection, or rotate the pole out of the close-up view and supply dedicated polar detail maps"
2. R3, severe, image-05.png (mercury.dive frame 717), entire close-up globe surface and terminator (crops A, C, E, F, G, H, I in image-06.png; L, P, Q, R in image-07.png; V in image-08.png): "albedo and normal maps are far too low-resolution for this camera distance, creating soft, mushy surface detail on the lit side and a plastic, waxy embossed look on shadow-side crater rims" Fix named by the critic: "use higher-resolution tiled albedo and displacement maps and add procedural micro-crater detail for close-up framing"
3. R3, severe, image-01.png (mercury.hold frame 615), lower-left night side of the globe extending to the left limb (crop D in image-02.png and crop P in image-03.png): "a stray semi-transparent ghosted object resembling a spacecraft boom with rectangular boxes appears across the dark hemisphere" Fix named by the critic: "remove the contaminated flare or background plate artifact and ensure the unlit hemisphere cleanly occludes layers behind it"
4. smooth mercury, severe, smooth-mercury.md: "rise: rest: the picture comes to rest between the rise and the travel: the fastest point of the body's edge moves 0.30 px a film frame at frame 1037, 0.012 of the slower end of the window, limit 0.07"
5. smooth mercury, severe, smooth-mercury.md: "dive: the pattern of the picture changes in place by 1.02 from frame 746 + 1/2 to 8 film frames later, limit 0.45 (37 frames over it, first 719 + 1/2)"
6. smooth mercury, severe, smooth-mercury.md: "rise: pop score 1.36 from frame 1044 + 1/2 to the next, limit 1.2 (5 frames over it, first 1043)"
7. smooth mercury, severe, smooth-mercury.md: "rise: the pattern of the picture changes in place by 1.17 from frame 981 + 1/2 to 8 film frames later, limit 0.45 (90 frames over it, first 961 + 1/2)"
8. R1, major, pair-01-b.png (mercury.hold frame 615), sun, upper right corner: "the sun disk is smaller with a harder, cleaner edge and a hot spot on its lower rim. The fiery corona spikes around it are thinner and dimmer, and the large orange prominence plumes on its lower left limb have become thin wispy filament loops" Fix named by the critic: "make the disk bigger again and soften it into the flare, then bring back the dense radial corona spikes and the bold, bright prominence tongues on the lower-left limb from -a"
9. R3, major, image-02.png (mercury.hold frame 615), lower-left sky outside the dark limb (crop D in image-02.png, crop O in image-03.png, and crop T in image-04.png): "a large blurry oval blob with rainbow chromatic ghosting sits in the starfield alongside smeared flare patches" Fix named by the critic: "remove baked lens-ghost blobs from the sky plate so background stars remain clean point sources"
10. R3, major, image-01.png (mercury.hold frame 615), sunlit upper and right limb of the globe (crop F in image-02.png and crops K, L, Q in image-03.png): "an artificial warm orange atmospheric rim halo wraps around an airless cratered world like a 2D outer-glow effect" Fix named by the critic: "remove the atmospheric halo layer on this airless body and restrict limb brightness to physical surface backscatter and subtle optical bloom"
11. R3, major, image-06.png (mercury.dive frame 717), sunlit right limb silhouette (crops E, I in image-06.png and crop R in image-07.png): "a hard, slightly faceted geometric limb edge sits directly against blurry interior surface texture with a thin bright rim line" Fix named by the critic: "increase sphere tessellation with fine silhouette displacement and match surface texture sharpness up to the limb"
12. R3, major, image-13.png (mercury.rise frame 1016), upper lit hemisphere, toward the sun: "craters are dragged into parallel diagonal streaks instead of round bowls" Fix named by the critic: "replace the high-latitude mapping so the upper disk keeps round craters"
13. R3, major, image-14.png (mercury.rise frame 1016), crops B, F, and H, and the lit sliver in I: "at native size the same streaks wipe out crater rims across the upper disk" Fix named by the critic: "recheck these crops at 1:1 after the mapping change; rims should be closed curves"
14. R3, major, image-15.png (mercury.rise frame 1016), crops J and K: "the stretch continues along the top of the disk and smears the bright rays in front of the sun" Fix named by the critic: "keep those rays radial and the craters round, not pulled along the mapping"
15. R1, minor, pair-01-b.png (mercury.hold frame 615), horizontal lens streak between the planet's upper right limb and the sun: "the anamorphic streak running left from the sun across the top of the frame is weaker and shorter" Fix named by the critic: "boost the streak's intensity and length to match -a"
16. R1, minor, pair-01-b.png (mercury.hold frame 615), lit hemisphere of the planet (crops A, F, G): "the surface is a bit crisper and more contrasty, with harder micro-crater detail and slightly cooler blue-grey patches. -a is a touch softer and warmer" Fix named by the critic: "ease off the local contrast and sharpening a little and warm the grey highlights slightly toward -a's tan cast"
17. R1, minor, pair-01-b.png (mercury.hold frame 615), night side and terminator (crops B, H): "the dark limb against the stars has a slightly harder outline, and the faint earthshine and haze inside the night disk is a bit flatter" Fix named by the critic: "soften the night-side edge a little and restore the faint internal haze"
18. R1, minor, pair-03-b.png (mercury.terrain frame 870), foreground plains (crops D, G): "the tiny warm and colored sparkle glints scattered over the regolith in -a are mostly gone, so the surface reads a little smoother" Fix named by the critic: "bring back the fine specular glint speckle at -a's density"
19. R1, minor, pair-03-b.png (mercury.terrain frame 870), large shadowed crater wall, center (crop A): "an extra small bright speck or debris highlight shows up in the shadow next to the existing one" Fix named by the critic: "remove the extra speck so only -a's single highlight is left"
20. R1, minor, pair-03-b.png (mercury.terrain frame 870), overall grade: "global contrast is very slightly lower (stddev about 1 to 2 percent below -a), so the blacks in the crater shadows are a hair less deep" Fix named by the critic: "nudge the contrast up slightly so the crater shadows reach -a's density"
21. R3, minor, image-02.png (mercury.hold frame 615), solar corona and photosphere (crop C in image-02.png, crops M, N, R in image-03.png, and crop C in image-06.png): "pinpoint background stars shine directly through bright solar corona streamers while the solar surface texture in crops M and N is soft and blobby" Fix named by the critic: "mask or wash out faint background stars inside intense coronal glare and increase solar photosphere detail before bloom"
22. R3, minor, image-08.png (mercury.dive frame 717), lower unlit globe interior (crops T and U in image-08.png): "subtle gradient banding is visible across the dark night-side hemisphere" Fix named by the critic: "composite in 16-bit or 32-bit float and apply dithering when exporting to 8-bit PNG"
23. R3, minor, image-10.png (mercury.terrain frame 870), crop B, lower right rayed craters: "the bright ejecta reads as a flat white splash laid on the ground" Fix named by the critic: "shade the rays with the terrain so they break on slopes and in shadow"
24. R3, minor, image-12.png (mercury.terrain frame 870), crops T and U, nearest ground: "the foreground regolith is soft and the fine grain does not hold up" Fix named by the critic: "raise near-ground texture resolution so the closest soil stays sharp"
25. R4, minor, sheet-05.png (mercury.rise sheet, frames 960 to 1034), frames 980 to 1007, central crater pair and horizon: "The climb largely unwinds the dive: the same crater pair shrinks along almost the same track as the horizon rolls back. This makes the exit read like a camera reversal rather than a continuing flyby." Fix named by the critic: "Carry some of the terrain pass's downrange movement into the climb and ease onto a slightly offset outbound arc so foreground craters and the horizon separate along a new path."
26. R4, minor, sheet-01.png (mercury.hold sheet, frames 540 to 689), frames 540 to 689, illuminated globe face: "The globe's crater pattern changes very little relative to the limb. The drift reads mostly as camera movement rather than independent planetary rotation." Fix named by the critic: "Keep the rotation slow, but give a recognizable sunlit marking a little more movement relative to the limb without speeding up the camera."

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b, 75. Main reason: it's a polished but generic "Mercury next to the Sun" composite. It uses NASA MESSENGER enhanced-color surface imagery, a dramatic but physically implausible close Sun with flares, a Milky Way starfield and lens flare. That's the typical "elements furnished by NASA" stock space illustration, not a film frame, textbook diagram or real-time render.
- hold, gpt_6_2_sol: b, 70/100. The strongest cue is its generic, self-contained planet-and-sun composition, typical of a stock astronomy render.
- hold, gemini_4_carbon: b, 72 , The illustrative space-art staging and exposure contradiction (placing a clean USGS-mapped Mercury beside an oversized procedural Sun in the corner while keeping a bright, lower-resolution starry skybox visible right next to the unocculted solar corona), which is a classic hallmark of commercial 3D stock renders rather than top-budget film VFX or real-time web demos.
- hold, kimi_k3: Answer: (b) a stock image. Confidence: 65. The one thing that most influenced my answer: the generic "cinematic-but-impersonal" composition , a Mercury-like planet rendered from public spacecraft (MESSENGER-style) texture maps, a stylized rim glow despite Mercury having no atmosphere, and heavy stock-style lens flare / blown-out sun effects. It has the polished-yet-nondescript look of commercial 3
- hold, grok_4_7: (b) 74 , A clean, label-free Mercury to Sun still with no ship, character, or shot context; that commercial planet-poster framing is what stock space renders are made for, not a film or game frame.
- terrain, claude_opus_5_5: a , confidence 55. What influenced me most: the cinematic, photoreal look. The low grazing light, sun flare over the curved horizon, star field, and dense crater detail read like a high-budget film or game establishing shot. Stock image (b) is the close second, because the swirly, smeared crater rims look generated rather than physically accurate.
- terrain, gpt_6_2_sol: a, 78/100: the grazing sunlight reveals intricate crater relief through crisp, deep shadows.
- terrain, gemini_4_carbon: (a), confidence: 72. The one thing that most influenced my answer is the combination of grazing-sun lighting across dense, realistic complex-crater relief and restrained filmic post-processing (subtle grain, bloom, chromatic aberration, and a cinematic Dutch-angle orbital framing) rather than the flat or oversaturated look typical of stock renders, web demos, or amateur art.
- terrain, kimi_k3: (a) , confidence 70. Most influential factor: the cinematic composition and lighting , the low sun flare at the horizon rim, high dynamic range, and extremely fine, physically coherent crater micro-detail across the whole frame read like a high-end space cinematic (film/AAA VFX) rather than a stock photo, textbook illustration, web demo, or amateur AI output, since I don't see the typical generati
- terrain, grok_4_7: a 74 The faint horizontal anamorphic sun streak and film-like grain, on a 16:9 shot that holds both harsh sunlit crater detail and a dense starfield.
- hold, claude_sonnet_5_5: Mercury. The image shows the cratered planet lit by the Sun, which is bright in the upper right.
- hold, gpt_6_2_sol: Mercury
- hold, gemini_4_carbon: Mercury

## What changes next

To be written.
