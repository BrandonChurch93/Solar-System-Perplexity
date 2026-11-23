# Round 37 · Phase 6 · mercury · round 1 of 3

- Build: main at 9972260 (engine hash 743c10b0a56aaca7, mercury hash eb2d18e38677943d), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gemini_4_carbon. R3 part 1 grok_4_7, part 2 gpt_6_2_sol. R4 claude_opus_5_5. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: judged in this round.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 9 | yes | 0 | 0 | 2 |
| R2 | | yes | | | |
| R3 | 4 (part 1: 6, part 2: 4) | no | 1 | 2 | 3 |
| R4 | 4 | no | 1 | 4 | 3 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b b a a b; terrain d a a a b, share 5 of 10. Judged: hold b a a b a; terrain b a d a e, share 5 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-13.png (mercury.rise frame 1016), upper-left illuminated face through the center-left terminator, also visible in image-14.png crops B, G, and I and image-15.png crops J and K: "Most of the globe is smeared into long directional streaks. Crater rims break into offset horizontal strips on the left, while round craters remain legible at center-right." Fix named by the critic: "Check the globe at a frozen pose to distinguish texture distortion from blur. Correct any projection stretch, then shorten the blur or render it with enough temporal samples to retain continuous crater rims."
2. R4, severe, sheet-03.png (mercury.dive cover sheet, frames 739 to 750), dive-to-terrain cover, frames 739-743, lower left and center: "a second misregistered terrain plate shows through as a hard-edged rectangle with doubled crater rims and a doubled limb line; the cover reads as two images laid over each other, not one move" Fix named by the critic: "drive both sides of the cover from one continuous camera path so the plates register exactly, or replace the dissolve with a single continuous render through the descent"
3. R3, major, image-05.png (mercury.dive frame 717), left half, upper left, and lower left: "directional smear turns crater rims into streaks across about half the flyby; the same crops fail in image-06 tiles G and B, image-07 tiles N and O, and image-08 tiles U and V" Fix named by the critic: "shorten the blur so those native crops keep closed crater rims"
4. R3, major, image-16.png (mercury.rise frame 1016), lower shadowed globe, crops S and T, and the shadow transition in U: "Rectangular and diamond-shaped swatches and isolated bright dashes sit over an otherwise smooth dark surface, giving the terminator a patchy, tiled appearance." Fix named by the critic: "Remove the block-shaped discontinuities in the shadow-side render and blend the terminator continuously while preserving faint, coherent surface detail."
5. R4, major, sheet-02.png (mercury.dive sheet, frames 690 to 779), frames 730 to 739, top of frame: "the sun pops in above the horizon and the horizon swings from a limb at the right to a wide arc across the top; direction and composition jump within the cover" Fix named by the critic: "keep the sun and limb continuous through the descent and pitch the camera up smoothly so the sun rises into frame over several frames"
6. R4, major, sheet-05.png (mercury.rise sheet, frames 960 to 1034), rise, frames 994 to 1000 and 1021 to 1027: "the sun disappears and the horizon tilt flips between 994 and 1000; between 1021 and 1027 the globe shrinks sharply, the sun moves, and a Milky Way band pops in at upper left" Fix named by the critic: "ease the pull-back with a continuous camera path, keep the sun and background stars locked to world space, and have the galactic band in the sky the whole time rather than switching it on"
7. R4, major, sheet-06.png (mercury.rise cover sheet, frames 985 to 996), terrain-to-rise cover, frames 990-996, horizon and ground: "the horizon doubles into two parallel lines and exposure lifts to a flat washed grey; the ground smears into streaky ghost copies instead of a smooth directional blur" Fix named by the critic: "use one camera with real motion blur across the cover, keep exposure matched on both sides, and keep the cover from crossfading two horizons that are out of register"
8. R4, major, sheet-02.png (mercury.dive sheet, frames 690 to 779), dive, frames 706-722, crater field: "crater rims break into stepped bright copies with colored speckle, so the blur ghosts instead of smearing smoothly; the texture looks like it is being zoomed as a flat image" Fix named by the critic: "render true per-pixel motion blur with more samples and stream the higher-detail terrain in early so the dive does not upscale a low-res texture"
9. R1, minor, pair-04-b.png (mercury.terrain frame 870), tiles D, E, and H (lower-left cratered plains, central crater floor, and lower-center ridges of pair-03-b.png): "fine regolith pebbles, tiny pit craters, and shadowed ridge slopes are slightly softer and smoother than in -a" Fix named by the critic: "retain higher-frequency micro-crater and regolith sharpness across the lower foreground and central crater floor to match -a"
10. R1, minor, pair-02-b.png (mercury.hold frame 615), tile D (lower-left dark limb and adjacent starfield of pair-01-b.png): "deepest shadows along the night-side limb are slightly crushed into black and faint nearby stars show slight blocky quantization compared to the smoother dark gradient in -a" Fix named by the critic: "lift the near-black night-limb shadow floor slightly to preserve limb separation and smooth quantization around faint background stars"
11. R3, minor, image-06.png (mercury.dive frame 717), tile C, upper-right limb: "a warm halo and a streaked fringe sit on the airless edge" Fix named by the critic: "keep one sharp silhouette and drop the glow off the limb"
12. R3, minor, image-02.png (mercury.hold frame 615), tile D, lower-left starfield: "a chromatic smear sits among the stars, with faint aperture ghosts on the night side" Fix named by the critic: "remove the ghost chain so it does not print on the planet or the stars"
13. R3, minor, image-12.png (mercury.terrain frame 870), near-field crater rim and ridges in crops T, W, and X: "Parts of the nearest terrain look soft and smeared despite hard, nearly white rim highlights and point glints. The sharper crater floor in image-10.png makes the loss of fine relief noticeable." Fix named by the critic: "Preserve high-frequency detail in the nearest terrain and soften the brightest isolated glints without blurring neighboring rock."
14. R4, minor, sheet-04.png (mercury.terrain sheet, frames 780 to 959), main crater shadow, frames 829-973: "small white dash specks sit inside the crater's black shadow and move from frame to frame, which reads as crawling noise" Fix named by the critic: "clamp the specular highlights or fireflies in the shadowed area and denoise them consistently over time"
15. R4, minor, sheet-04.png (mercury.terrain sheet, frames 780 to 959), sun starburst at top, frames 926-959: "the starburst rays change length and strength noticeably while the camera barely moves" Fix named by the critic: "tie the flare's strength to how much of the sun is visible and smooth that over time"
16. R4, minor, sheet-04.png (mercury.terrain sheet, frames 780 to 959), terrain segment overall: "the near ground and the horizon have only weak parallax, so the view reads close to a slow pan over a single surface" Fix named by the critic: "lower the camera and add some lateral travel so the near craters slide clearly against the horizon"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b , 50. Main influence: it's a polished, generic hero shot of Mercury beside a stylized Sun, with lens flares, a Milky Way backdrop, and cinematic grading. That's the classic "planet near the Sun" stock render, built for looks rather than scientific accuracy (so not c). It's too refined for amateur art (d). It could plausibly be (a) or (e), since the high-end rendering quality fits either.
- hold, gpt_6_2_sol: a, 68/100. The most influential cue was the cinematic lighting: the blown-out, flaring Sun rakes across the fine crater relief and leaves the opposite side nearly black.
- hold, gemini_4_carbon: a, confidence: 78 Most influential factor: The cinema-grade rendering and filmic post-processing,specifically the realistic grazing-angle micro-crater relief and matte regolith falloff along Mercury's terminator paired with organic solar coronal loops, fine film grain, and subtle multi-element optical lens ghosting.
- hold, kimi_k3: b, 63. The single biggest factor was its polished but generic commercial stock-render look: a dramatic backlit Mercury against the Sun with no narrative scene elements, production design, or textbook labeling.
- hold, grok_4_7: (a) 78. The deliberate filmic optics , anamorphic flare, grain, bloom, and aperture ghosting , on a production-grade planet render, with none of the labels, stock cleanliness, AI artifacts, or real-time aliasing the other options would show.
- terrain, claude_opus_5_5: Answer: (b) stock image. Confidence: 45. Main factor: it's a polished but generic "lunar horizon with sun flare over a starfield" shot in the usual stock style, a 16:9 hero image with no story or framing context. The swirled, smeared crater walls and implausible crater shapes suggest it's AI-generated rather than a real render or photo. That kind of image is common in stock libraries today. My sec
- terrain, gpt_6_2_sol: My pick: a, 76/100. The decisive cue is the cinematic grazing sunlight, which renders the intricate crater relief with deep, coherent shadows.
- terrain, gemini_4_carbon: d, 88 , Diffusion-model hallucinations in the fine surface details, especially the bright center-left ray craters rendered like upward-shooting 3D splash spikes alongside scattered wet-looking specular glints rather than real lunar ejecta or 3D heightmap geometry.
- terrain, kimi_k3: Answer: (a) a frame from a top-budget film or AAA game cinematic. Confidence: 80. The decisive factor is the cinematic composition and lighting , a low-sun glancing across a photoreal lunar landscape with lens glow, filmic wide-frame staging, and dramatic contrast that reads as a deliberate shot rather than a textbook diagram or stock photo; fidelity is too high for a real-time web demo, and the p
- terrain, grok_4_7: e, 74. Stars and the sun are both visible over a properly exposed lunar surface, with only a simple glow and no film or camera treatment, in a browser-sized 16:9 frame.
- hold, claude_sonnet_5_5: Mercury. The image shows a cratered, gray-brown planet lit by a large, bright Sun at the upper right.
- hold, gpt_6_2_sol: Mercury. The primary depicted object is the cratered planet near the Sun.
- hold, gemini_4_carbon: Mercury

## What changes next

Mercury round 2 of 3 after the engine's capped shutter (E6, decision d129) is on main: the plate that shows as a hard edged rectangle across the dive handover (739 to 743), the Sun that pops in and the horizon that swings (730 to 739), the stepped bright copies in the dive (706 to 722), the rise handover (990 to 996) and the rise frames 994 to 1000 and 1021 to 1027, and the smear on the judged frames 717 and 1016
