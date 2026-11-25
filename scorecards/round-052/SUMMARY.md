# Round 52 · Phase 6 · mercury · round 2 of 3

- Build: main at 9d59e69 (engine hash f200e17ad0e70237, mercury hash 044dfb86270b67fb), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 claude_opus_5_5. R3 part 1 gemini_4_carbon, part 2 grok_4_7. R4 gpt_6_2_sol. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: reused from round 37.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | fail |
| G17 | pass |

## Smooth

| Stop | Report | Landing | Red lines | First lines | From |
| --- | --- | --- | --- | --- | --- |
| mercury | red | green | 3 | dive: the pattern of the picture changes in place by 1.13 from frame 717 to 8 film frames later, band 14.0 px, limit 0.45 (21 frames over it, first 712 + 1/2); rise: pop score 1.35 from frame 1044 + 1/2 to the next, limit 1.2 (7 frames over it, first 1042) (and 1 more) | full report at 9d59e699 on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz; landing at 9d59e699, from the job of the full report: the tree at the close is another build |

Each red line is one severe issue of its stop. A stop that is not measured does not hold its pass bar. The reports are the `smooth-*` files of this folder.

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 8 | no | 0 | 1 | 5 |
| R2 | | yes | | | |
| R3 | 3 (part 1: 3, part 2: 7) | no | 3 | 3 | 4 |
| R4 | 8 | no | 0 | 0 | 2 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b b a a b; terrain d a a a b, share 5 of 10. Judged: hold b a a b b; terrain d a d a a, share 5 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-01.png (mercury.hold frame 615), lower-left unlit hemisphere and adjacent sky (image-02.png crops D, H; image-03.png crops O, P; image-04.png crop T): "a blurry ghosted spacecraft silhouette with a long boom/panel is baked onto the dark side of the planet, accompanied by a smeared bright white-orange blob and rainbow flare smudge just outside the lower-left limb" Fix named by the critic: "remove the stray spacecraft ghost, secondary streak, and flare blob completely so the night side and adjacent starfield are clean"
2. R3, severe, image-05.png (mercury.dive frame 717), upper-left terminator and upper-center to upper-right lit globe (image-06.png crops B, C, F, G; image-07.png crops J, K, L, P): "craters and sunlit rims along the upper-left terminator are heavily stretched and smeared into directional streaks, while the upper-center and upper-right lit surface is soft and blurry next to the sharp center craters, exposing 2D warp stretching or insufficient texture resolution" Fix named by the critic: "render the close-up from true 3D sphere geometry with high-resolution close-up surface albedo and normal/displacement maps free of UV or 2D-warp stretching"
3. R3, severe, image-05.png (mercury.dive frame 717), lower-right and upper-right sky background (image-06.png crops E, I; image-07.png crops N, R; image-08.png crops S, V, W): "the starfield and warm solar haze stop abruptly along straight diagonal patch borders in both the lower-right sky and far upper-right edge, cutting to flat nearly empty black where a rotated background plate runs out of bounds" Fix named by the critic: "extend the starfield and coronal haze seamlessly across the full frame using an unclipped 360-degree skybox or procedural background with smooth radial falloff"
4. smooth mercury, severe, smooth-mercury.md: "dive: the pattern of the picture changes in place by 1.13 from frame 717 to 8 film frames later, band 14.0 px, limit 0.45 (21 frames over it, first 712 + 1/2)"
5. smooth mercury, severe, smooth-mercury.md: "rise: pop score 1.35 from frame 1044 + 1/2 to the next, limit 1.2 (7 frames over it, first 1042)"
6. smooth mercury, severe, smooth-mercury.md: "rise: the pattern of the picture changes in place by 0.86 from frame 1002 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (30 frames over it, first 998 + 1/2)"
7. R1, major, pair-01-b.png (mercury.hold frame 615), sun, upper right (crop C): "the corona reads as thin, stringy filaments with a mottled, textured disc; the target has broad radial ray spikes and a smoother, blown-out bloom that wraps over the planet's right limb" Fix named by the critic: "soften the filament detail and bring back the wide radial streaks and heavier bloom spilling toward the planet"
8. R3, major, image-05.png (mercury.dive frame 717), upper-right solar disk, prominence loop, and inner corona (image-06.png crop C; image-07.png crops L, M, N): "the solar surface detail, prominence loop, and coronal streamers are soft, mushy, and visibly upscaled at native pixel size" Fix named by the critic: "render the solar disk, prominence, and coronal rays at full native output resolution so fine plasma structure stays crisp in the close-up"
9. R3, major, image-01.png (mercury.hold frame 615), sunlit upper and right limb of the globe (image-02.png crops C, E, F, G; image-03.png crops K, L, Q): "an airbrushed warm orange outer-glow halo wraps uniformly around the sunlit horizon of an airless cratered rocky body like a 2D layer effect" Fix named by the critic: "remove the artificial atmospheric-style rim glow so the bare rocky cratered limb meets space crisply, keeping any optical bloom strictly physical"
10. R3, major, image-13.png (mercury.rise frame 1016), upper sunlit globe, from the top limb down through the high latitudes (about y 0-320): "crater texture is smeared along one diagonal, so rims lose their round shape; the same surface is sharp on the lower crescent" Fix named by the critic: "resample the globe texture so grazing and high-latitude views keep round crater rims instead of a directional smear"
11. R1, minor, pair-01-b.png (mercury.hold frame 615), night hemisphere, left half of the disc (crops B, D, H): "the dark side is a little more neutral and grainy, and the faint cool blue tint is gone (lower blue, about twice the pixel noise)" Fix named by the critic: "denoise the night side and push it slightly back toward the cool blue-black of the target"
12. R1, minor, pair-01-b.png (mercury.hold frame 615), starfield, lower left and right (crops D, E, I): "the stars are denser, crisper and slightly brighter, so the sky looks busier than the target's softer field" Fix named by the critic: "reduce the star count or brightness slightly and soften the field to match"
13. R1, minor, pair-01-b.png (mercury.hold frame 615), upper right limb (crops C, F): "the atmosphere glow at the limb is a bit thinner and sharper-edged than the target's warm haze" Fix named by the critic: "widen and soften the limb glow falloff a little"
14. R1, minor, pair-03-b.png (mercury.terrain frame 870), foreground terrain and crater walls (crops D, G, H): "fine surface detail and microcontrast are slightly softer (about 4% less local gradient), and the deepest shadows are slightly lifted" Fix named by the critic: "add back a little local contrast and sharpening, and lower the shadow floor slightly"
15. R1, minor, pair-03-b.png (mercury.terrain frame 870), sky, upper right (crop C): "the starfield is slightly noisier and denser than the target's" Fix named by the critic: "denoise the sky slightly and match the star density"
16. R3, minor, image-05.png (mercury.dive frame 717), lower-right sunlit limb (image-06.png crops E, H, I; image-08.png crop V): "a soft hazy rim glow clings to the rocky limb and faint smudge specks sit just outside the lower-right horizon" Fix named by the critic: "render a clean geometric rocky horizon without a soft outer halo and remove the stray smudge specks near the lower limb"
17. R3, minor, image-01.png (mercury.hold frame 615), left and lower dark-sky starfield near the unlit limb (image-02.png crops B, D; image-03.png crop O; image-04.png crops T, U): "stars sit surrounded by dark ringing pits and mottled compression-like blotches in the faint background sky, with soft blobby star shapes in the lower-left corner" Fix named by the critic: "composite clean PSF-sampled point stars over an uncompressed noise-free space background without sharpening rings or compression artifacts"
18. R3, minor, image-09.png (mercury.terrain frame 870), near foreground, especially the lower left and lower center plains: "regolith is softer and lower in micro-contrast than the terraced wall at the right, with a few isolated one-pixel specular glints on otherwise smooth slopes" Fix named by the critic: "raise near-camera texture resolution and remove single-pixel specular spikes that do not sit on a rock or rim"
19. R3, minor, image-13.png (mercury.rise frame 1016), unlit hemisphere: "the night side is a flat, nearly textureless void with no starlight on the surface, so the terminator reads as a hard cut into empty black" Fix named by the critic: "add a very low starlight response on the night side so the limb stays a surface rather than a flat cutout"
20. R4, minor, sheet-05.png (mercury.rise sheet, frames 960 to 1034), frames 987 to 1007, paired crater landmarks and the sunlit limb: "The climb retraces the dive's composition closely enough to read as a reversal rather than a distinct outbound move. The paired craters pass through nearly the same positions and angles seen in sheet-02.png at frames 722 to 747." Fix named by the critic: "Give the climb a modest lateral offset and a slightly different bank while matching the incoming camera position and velocity at the cover."
21. R4, minor, sheet-02.png (mercury.dive sheet, frames 690 to 779), frames 722 to 747, crater rims near the left edge: "The fastest part of the dive smears the near crater rims more heavily than the central terrain, briefly making the foreground look stretched." Fix named by the critic: "Tune the shutter interval through peak speed and check consecutive full-resolution frames to keep the blur continuous without losing the shape of the nearest rims."

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b, 65. Most influential: it's a polished, generic "Mercury next to the Sun" space render. It uses the NASA MESSENGER-style enhanced-color surface texture, adds a lens-flare glow and a starfield/Milky Way backdrop, and frames it as a 16:9 hero shot. That combination is typical of stock space imagery (e.g. Adobe Stock/Shutterstock renders that credit NASA textures). It looks too cinematic for a text
- hold, gpt_6_2_sol: a, 70/100: The grazing sunlight picks out the crater relief with unusually cinematic depth. Stock illustration is my main runner-up, but the high-contrast lighting/post-processing reads as a cinematic frame.
- hold, gemini_4_carbon: (a), confidence: 68. The one thing that most influenced my answer is the cinematic lighting and post-processing, specifically the high-contrast raking sunlight along the cratered terminator dropping into a nearly pitch-black shadow hemisphere, paired with subtle optical lens flare ghosting, smooth highlight rolloff, and fine film grain.
- hold, kimi_k3: Answer: (b) a stock image Confidence: 62 Most influential factor: The composition is a generic solar-system "artist's impression" of Mercury with edge-framed sun, the exact narrative-free, cinematic-lit realism style that dominates space stock libraries (Shutterstock/Getty), lacking any storytelling elements (characters, spacecraft) you'd expect from an AAA cinematic, and too polished and unlabele
- hold, grok_4_7: (b) 78. Idealized commercial beauty-shot of Mercury with decorative lens flares and no labels, narrative staging, or demo UI.
- terrain, claude_opus_5_5: d, confidence 55. Main factor: AI-generation tells. The crater geology doesn't make sense: the rims have swirly, smeared concentric terraces, the shadows melt into each other, and there are random glittery white specks on the surface. The polished cinematic lighting (sun flare over a curved horizon, starfield) made me consider stock (b) as the runner-up, since a lot of AI art gets sold as stock.
- terrain, gpt_6_2_sol: a, 73/100: The low-angle sunlight casts detailed, coherent shadows across the terraced crater walls, giving the frame a cinematic look.
- terrain, gemini_4_carbon: d, 88. Unedited AI-generation artifacts on the lunar surface, specifically the two white ray craters left of center morphing into spiky, shadowless splash tendrils alongside background star and nebula dots bleeding onto the dark regolith.
- terrain, kimi_k3: answer for image-03.png: (a), confidence 65. Most influential factor: the cinematic composition and production-grade lighting, low sun angle with controlled lens flare, filmic depth of field, and photoreal, high-dynamic-range crater detail matching the look of a big-budget VFX/AAA cinematic rather than a flat textbook photo, generic stock shot, or visibly flawed amateur generation.
- terrain, grok_4_7: (a) 84. A fully exposed starfield and sun flare sit together with a brightly lit, production-grade lunar surface, which is a film/AAA cinematic exposure choice rather than a photo, diagram, or web demo.
- hold, claude_sonnet_5_5: Mercury. The image shows the cratered planet with the Sun glowing at upper right.
- hold, gpt_6_2_sol: Mercury. The main heavily cratered planet is illustrated next to the Sun.
- hold, gemini_4_carbon: Mercury

## What changes next

To be written.
