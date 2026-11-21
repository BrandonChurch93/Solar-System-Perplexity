# Round 8 · Phase 4 · jupiter · round 1 of 3

- Build: main at 47a7600 (engine hash a3d211c425dc0406, jupiter hash a1532f868cd3e034), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 claude_opus_5_5. R3 part 1 gemini_4_carbon, part 2 grok_4_7. R4 gpt_6_2_sol. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: judged in this round.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 9 | yes | 0 | 0 | 3 |
| R2 | | yes | | | |
| R3 | 4 (part 1: 4, part 2: 6) | no | 2 | 5 | 3 |
| R4 | 6 | no | 0 | 2 | 1 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold d d b b b; terrain a d d a d, share 2 of 10. Judged: hold b d d a d; terrain a a d d d, share 3 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-08.png (jupiter.dive frame 2997), crop W (1824,866,96,214), also right edge of crop F in image-06.png, crop R in image-07.png, and lower-right border of image-05.png: "a vertical mirror-repeat seam runs down the Milky Way sky texture, reflecting stars and dust lanes symmetrically into a Rorschach pattern" Fix named by the critic: "replace tiled MirroredRepeatWrapping on the sky background with a seamless 360-degree spherical starfield or cubemap at native resolution"
2. R3, severe, image-06.png (jupiter.dive frame 2997), crop H (0,0,456,433) and upper-left sky of crop B (252,54,456,433), also upper-left sky of image-05.png and left third of crop H in image-02.png (image-01.png): "crossing horizontal and vertical mirror-repeat tile seams create a four-way symmetric reflection of bright orange and blue star groups and nebula dust" Fix named by the critic: "remove UV tiling and mirrored wrapping on the sky texture and map a single unrepeated high-resolution celestial sphere"
3. R3, major, image-06.png (jupiter.dive frame 2997), Io in crop A (768,384,456,433) and crop I (912,647,456,433), also crop P in image-07.png, crop A in image-02.png, and crop O in image-03.png: "Io's surface texture is blocky and low-resolution at native scale, and its sunlit limb has jagged 1-pixel stair-stepping with a dark fringe against Jupiter's clouds" Fix named by the critic: "use a higher-resolution Io albedo map with proper filtering and apply multisample/supersampled anti-aliasing without dark unpremultiplied edge fringing"
4. R3, major, image-06.png (jupiter.dive frame 2997), Milky Way in crop F (1464,647,456,433) and crop G (1368,216,456,433), also crops F and G in image-02.png, crop P in image-03.png, crop Q in image-07.png, and crop V in image-08.png: "the Milky Way texture shows coarse, noisy texels at 1:1 crop size and stars appear as hard single-pixel squares or blocky 2x2 blobs" Fix named by the critic: "use an 8K-16K sky map for diffuse galactic dust and render stars procedurally with smooth subpixel Airy/Gaussian point-spread falloff"
5. R3, major, image-08.png (jupiter.dive frame 2997), lower-left sunlit limb in crop T (456,866,456,214) and dark right limb in crop V (1368,866,456,214), also crop R in image-04.png, crop P in image-03.png, and crop F in image-06.png: "Jupiter's limb shows 1-pixel stair-stepped aliasing along the dark silhouette against the Milky Way and along the lower-left lit limb where atmospheric glow vanishes" Fix named by the critic: "enable supersampling or analytic sphere-edge anti-aliasing and maintain a subtle continuous atmospheric rim falloff along the entire sunlit limb"
6. R3, major, image-13.png (jupiter.rise frame 3296), unlit limb, native in image-14.png tiles A and E and image-15.png tile P: "the dark limb is a hard circular mask; stars stop on a clean arc with no atmospheric falloff" Fix named by the critic: "add a thin nightside airglow and a short extinction gradient so the limb does not clip the starfield"
7. R3, major, image-13.png (jupiter.rise frame 3296), shadow under the moon, native in image-14.png tile C and image-15.png tile K: "the moon shadow is a long vertical column that never closes into an ellipse and smears into the nightside" Fix named by the critic: "project a finite elliptical umbra and penumbra whose length matches the sun angle"
8. R4, major, sheet-03.png (jupiter.dive cover sheet, frames 3019 to 3030), frames 3028 to 3029, upper-right sky and diagonal horizon: "The blurred cloud field gives way in one frame to a flat tan veil, a distinctly sharper atmospheric rim and much clearer stars. The horizon position mostly holds, but the change in sharpness and contrast exposes the cover." Fix named by the critic: "Match the atmospheric rim and starfield blur across both sides of the cover and carry the moving haze into the terrain view for several more frames."
9. R4, major, sheet-06.png (jupiter.rise cover sheet, frames 3265 to 3276), frames 3269 to 3274, horizon and sky during the ascent cover: "The broad blurred haze gives way to a clean curved limb and nearly black sky around 3270; bright rim detail and stars then return within a few frames. The switch in atmosphere and exposure interrupts the sense of one pullback." Fix named by the critic: "Align the limb geometry on both sides of the cover and blend the haze, rim brightness and star visibility continuously while keeping the camera roll and pullback on the same eased path."
10. R1, minor, pair-03-b.png (jupiter.terrain frame 3150), middle and lower storm field, night-side clouds lower right: "overall a touch darker and slightly less warm than -a (about 1-2 levels lower in mid and lower regions, red/orange channel dropped most), so the lit cloud tops on the storm's south rim read a little duller" Fix named by the critic: "lift midtones by about 1-2 levels and restore a small amount of red/orange warmth in the lower two thirds; keep the blacks where they are"
11. R1, minor, pair-01-b.png (jupiter.hold frame 2895), right-side terminator/limb against the Milky Way (crops C, E, G): "the dark limb edge sits a few pixels inward of -a, so the planet disc reads very slightly narrower on the night side" Fix named by the critic: "move the night-side limb outward by a few pixels to match -a's silhouette"
12. R1, minor, pair-01-b.png (jupiter.hold frame 2895), starfield, upper left and right sky: "stars and Milky Way grain slightly busier/brighter than -a; the faint upper-left planet bands also a shade warmer" Fix named by the critic: "reduce star sparkle and fine noise slightly and pull the band warmth back a hair toward -a"
13. R3, minor, image-06.png (jupiter.dive frame 2997), Great Red Spot and equatorial cloud bands in crop A (768,384,456,433), also crops J, K, O, and P in image-07.png: "Jupiter's cloud texture looks slightly soft and oversampled at native 1:1 scale in the closer frame" Fix named by the critic: "use a higher-resolution Jovian cloud map with anisotropic filtering or subtle high-frequency cloud detail modulation"
14. R3, minor, image-02.png (jupiter.hold frame 2895), sunlit left limb in crops B (252,54,456,433) and D (252,594,456,433), also crop N in image-03.png, crops B and D in image-06.png, and crop N in image-07.png: "intense limb brightening washes out the outer sunlit zone into a flat, featureless cream-white band" Fix named by the critic: "apply filmic highlight roll-off and reduce additive rim scattering intensity so cloud banding remains subtly visible near the limb"
15. R3, minor, image-15.png (jupiter.rise frame 3296), tile Q, the unlit disk: "the nightside is a near-uniform fill with no residual cloud structure" Fix named by the critic: "keep a little low-contrast cloud relief in the shadow instead of a flat black disk"
16. R4, minor, sheet-04.png (jupiter.terrain sheet, frames 3060 to 3239), frames 3060 to 3239, near cloud ridges and vortex against the horizon: "The dominant change is a steady enlargement of the vortex and surrounding cloud field. Relative motion between the near ridges and horizon is subtle, and the storm shows little independently traceable flow at the sampled frames." Fix named by the critic: "Add modest lateral camera translation and depth-separated cloud motion so the nearest ridges cross the frame faster than the horizon and the vortex bands visibly advect."

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b , confidence 55. Main reason: it's a polished, centered 16:9 "hero" shot of Jupiter and Io in front of a dramatic Milky Way. That's typical stock-space imagery, often AI-assisted, and it was made to look good rather than to be accurate. The physics is wrong in ways that rule out (c): Io's shadow is too big and offset, and the Milky Way backdrop is unrealistic. The finish is too clean for typical
- hold, gpt_6_2_sol: d, 84/100. The moon’s long, contact-like shadow makes it look like a ball sitting directly on Jupiter’s clouds, a physically unconvincing detail in an otherwise polished render.
- hold, gemini_4_carbon: d Confidence: 82 Most influential factor: The moon casts a long, attached tabletop drop-shadow directly onto embossed, hallucinated cloud swirls on Jupiter, a classic text-to-image generation artifact rather than real NASA planetary textures or physically coherent 3D rendering.
- hold, kimi_k3: (a) , confidence 68. Most influential factor: the cinematic presentation , dramatic rim lighting on the planet's dark limb, a backlit star-field with the Milky Way, and a composed "money shot" of a moon transiting beside a Great Red Spot analog, all of which read like a VFX plate from a big-budget film or AAA game cinematic rather than a flat textbook figure or generic stock render.
- hold, grok_4_7: d 76 The impossible exposure of a fully sunlit Jupiter against a bright, detailed Milky Way, with painterly hyper-smoothed clouds and no film, textbook, stock, or real-time 3D cues.
- terrain, claude_opus_5_5: a , confidence 60. Main reason: the cinematic look. It's a 16:9 wide shot of a Jupiter-like Great Red Spot storm with filmic color grading, a glowing atmospheric rim at the edge of the planet, and a Milky Way backdrop. It's framed like a VFX establishing shot, not like a textbook diagram or a real-time render. The runner-up is (d), AI-generated art, because the cloud swirls are dense and a bit pai
- terrain, gpt_6_2_sol: a, 72/100. The decisive cue is how the grazing sunlight reveals depth and self-shadowing throughout the layered storm clouds, giving the shot a high-end cinematic VFX look.
- terrain, gemini_4_carbon: d Confidence: 85 Most influential factor: Diffusion-model texture and scale inconsistencies, where taffy-like cloud tendrils and oversized terrestrial cumulus puffs form a sunken red pit beneath an Earth-blue atmosphere and a bright Milky Way starfield rather than following physically coherent storm dynamics.
- terrain, kimi_k3: d , confidence 66. Most influential factor: it looks cinematic at a glance, but the overly perfect, repetitive turbulent texture and physically implausible starfield/horizon lighting give a strong generative-art fingerprint rather than a film/VFX frame.
- terrain, grok_4_7: d, 76. Painterly cloud swirls and diffuse, bolt-less lightning, with no film grain or lens character.
- hold, claude_sonnet_5_5: Jupiter. The image shows the planet with its Great Red Spot, and a small yellow moon (likely Io) casting a shadow on it.
- hold, gpt_6_2_sol: Jupiter
- hold, gemini_4_carbon: Jupiter

## What changes next

Worst first. 1. The sky: the hold sky patch is padded with a mirror image, so the dive frame shows the sky reflected across the approved image's border (both severe issues; the same cause is in every stop and is fixed in each stop's sky folder; check tool tools/assets/mirrorcheck.py). 2. Both covers: carry the moving haze into the terrain view for several more frames and match rim sharpness and star visibility on both sides (dive 3028 to 3029); in the rise align the limb on both sides and bring rim brightness and stars back over ten frames or more (3269 to 3274). 3. The limb: one haze layer across the limb on the night side and on the lower left lit side, in place of the hard circular edge and its stair steps. 4. Io: a finer color map and a feathered edge with no dark fringe; its shadow as a closed ellipse with a penumbra. 5. The band and the stars in the dive frame 2997: coarse texels and square stars, so check the patch's scale there. 6. Terrain view (minor): more sideways travel so the near ridges cross faster than the horizon, and band flow round the storm that can be followed. R1's minors: the lower two thirds of the terrain view one to two levels darker and less warm than approved, the night limb a few pixels inward, stars a little busier.
