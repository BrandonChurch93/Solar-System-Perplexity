# Round 59 · Phase 6 · jupiter · round 1 of 3 of the fourth note

- Build: main at 9f09a8a (engine hash e1ac861ce101f79f, jupiter hash c621a68ce25d7a8d), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gpt_6_2_sol. R3 part 1 claude_opus_5_5, part 2 gemini_4_carbon. R4 grok_4_7. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: reused from round 46.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Smooth

| Stop | Report | Landing | Red lines | First lines | From |
| --- | --- | --- | --- | --- | --- |
| jupiter | red | green | 2 | dive: the pattern of the picture changes in place by 0.84 from frame 3019 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (38 frames over it, first 3017); rise: the pattern of the picture changes in place by 1.40 from frame 3250 to 8 film frames later, band 8 px, limit 0.45 (29 frames over it, first 3244 + 1/2) | full report at 9f09a8a3 on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz; landing at 9f09a8a3, measured at the close on this build |

Each red line is one severe issue of its stop. A stop that is not measured does not hold its pass bar. The reports are the `smooth-*` files of this folder.

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 8 | no | 0 | 2 | 7 |
| R2 | | yes | | | |
| R3 | 4 (part 1: 4, part 2: 5) | no | 1 | 6 | 5 |
| R4 | 7 | no | 0 | 1 | 1 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold d d d b d; terrain a d d d d, share 1 of 10. Judged: hold b d d d d; terrain a a d d d, share 2 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-05.png (jupiter.dive frame 2997), whole close-up frame, most visible in crops B, C, D, E, I, J, M, O, T, W (image-06 to image-08): "large parts of the globe are soft and smeared at native size, like an upscaled low-res image. Cloud detail turns to mush toward the limb and lower half, and Io (crops E, H, R) is blurry with no sharp edge" Fix named by the critic: "render or generate the close-up at full native resolution with real fine detail across the disc. Keep the focus falloff physically plausible and keep the moon tack-sharp"
2. smooth jupiter, severe, smooth-jupiter.md: "dive: the pattern of the picture changes in place by 0.84 from frame 3019 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (38 frames over it, first 3017)"
3. smooth jupiter, severe, smooth-jupiter.md: "rise: the pattern of the picture changes in place by 1.40 from frame 3250 to 8 film frames later, band 8 px, limit 0.45 (29 frames over it, first 3244 + 1/2)"
4. R1, major, pair-03-b.png (jupiter.terrain frame 3150), lower-left foreground, below and left of the storm eye (pair-04-b crops D and I): "A warm, sculpted billow has become a much darker, cooler streak. This loses the sunlit fold and the separation between the overlapping clouds." Fix named by the critic: "Bring back the warm raking light and fine ridges on the raised fold; keep the deep black in the valleys around it."
5. R1, major, pair-03-b.png (jupiter.terrain frame 3150), diagonal cloud deck between the eye and the horizon (pair-04-b crops A, B, F and H): "Long blue-gray and nearly black streaks interrupt the lighter cream deck. The distant layers look flatter and more sharply striped than the target." Fix named by the critic: "Soften and lift the long dark streaks, and restore the pale, broken cloud texture between the eye and the limb."
6. R3, major, image-05.png (jupiter.dive frame 2997), belts north-west of the Great Red Spot and the upper band (crops A, F, K, L, P, U, V): "clouds look like embossed, extruded plaster or clay. Hard specular glints and 3D relief make the gas giant surface look plastic and solid rather than like atmosphere" Fix named by the critic: "remove the bump/normal relief and specular highlights from the cloud layer and use soft, diffuse, flowing cloud shading"
7. R3, major, image-01.png (jupiter.hold frame 2895), dark sky everywhere, most visible in crops H, M, R, S, T, U, V (image-02 to image-04): "a faint regular square grid or block pattern shows in the black background behind the stars (compression or tiling artifact). Stars are slightly soft blobs rather than points" Fix named by the critic: "regenerate the starfield at native resolution with dithering and no block compression, and render stars as sharp point sources"
8. R3, major, image-01.png (jupiter.hold frame 2895), lower part of the globe near the terminator (crops S, T in image-04): "the lower band shows crater-like round pits that read as a rocky moon texture, not Jupiter cloud. The texture there also looks stretched and low detail" Fix named by the critic: "replace the southern band texture with proper zonal cloud structure that matches the rest of the disc"
9. R3, major, image-13.png (jupiter.rise frame 3296), foreground moon (crops P and Q in image-15.png, crop C in image-14.png): "the moon surface is blurry and horizontally smeared, with visible pixel stair-stepping and orange color fringing along its sunlit left edge" Fix named by the critic: "render the moon from a higher-resolution surface map without directional blur and anti-alias its limb cleanly"
10. R3, major, image-13.png (jupiter.rise frame 3296), Jupiter sunlit globe and Great Red Spot (crops A and C in image-14.png, crops J, K, and P in image-15.png): "the cloud bands and storm vortex look soft, airbrushed, and directionally smeared at native crop size, clashing with the sharp single-pixel background stars" Fix named by the critic: "use higher-resolution planetary cloud textures and volumetric detail so the globe holds up at 1:1 scale alongside the starfield"
11. R3, major, image-13.png (jupiter.rise frame 3296), Jupiter sunlit left limb (crop A in image-14.png, crops J and P in image-15.png): "highlights along the left limb blow out to a flat featureless cream band, and the outer limb edge shows stair-stepped pixel aliasing against space" Fix named by the critic: "roll off the sunlit limb exposure to preserve cloud texture and render a smooth anti-aliased atmospheric falloff"
12. R4, major, sheet-02.png (jupiter.dive sheet, frames 2970 to 3059), upper-left rim of the central vortex, frames 3010 to 3019: "the same eye continues, but towering self-shadowed cloud clumps pop in where 3010 only has faint low bumps" Fix named by the critic: "fade that extra relief in across the approach so those ridges gain height continuously instead of appearing between these two samples"
13. R1, minor, pair-01-b.png (jupiter.hold frame 2895), clear sky left of the disc and along the Milky Way at right (pair-02-b crops B to H): "There are too many conspicuous bright points, even in the target’s darker sky. The extra stars compete with the galactic dust and make the blacks feel less quiet." Fix named by the critic: "Dim or thin the added bright points, preserving the target’s dark gaps and the color and structure of the Milky Way."
14. R1, minor, pair-02-b.png (jupiter.hold frame 2895), sunlit upper-left and lower-left limb, crops B and D: "The upper-left halo reads cooler and grayer than the target’s warm glow. The lower-left halo spills a little farther into the dark sky." Fix named by the critic: "Warm the upper-left halo and contain the lower-left spill while retaining the soft falloff and crisp disc edge."
15. R1, minor, pair-02-b.png (jupiter.hold frame 2895), moon, its cast shadow, and the surrounding mid-disc belts, crop A: "The moon and its shadow sit a little high and left. The shadow’s far edge is harder, and the adjacent cream belts show slightly less fine separation." Fix named by the critic: "Set the moon and shadow marginally down and right, soften the shadow’s distal edge, and recover the fine pale and blue cloud filaments."
16. R1, minor, pair-02-b.png (jupiter.hold frame 2895), dark right limb and polar falloff, crops C, E and I: "Isolated cool blue marks and faint bands show through the terminator more distinctly than in the target. The polar cap is also a little less textured." Fix named by the critic: "Subdue the blue marks into the near-black falloff and restore subtle cloud relief on the lit side of the upper cap."
17. R1, minor, pair-04-b.png (jupiter.terrain frame 3150), storm eye and immediate inner and lower-left rims, crops A, B, F and G: "The eye’s position and warm light direction match, but the smallest orange filaments and the warm-to-dark separation on the lower rim are slightly muted." Fix named by the critic: "Recover the fine amber filaments and separate the lit rim from the brown interior without lifting the black core."
18. R1, minor, pair-04-b.png (jupiter.terrain frame 3150), diagonal blue limb and sky above it, crops C and H: "Extra bright stars make the black sky and faint Milky Way busier, and the blue fringe across the middle-to-right horizon reads slightly more outlined." Fix named by the critic: "Reduce bright point contrast and feather the blue fringe into the sky, keeping the horizon angle and warm-to-cool transition."
19. R1, minor, pair-04-b.png (jupiter.terrain frame 3150), lower-right storm folds around the blue flashes, crop E: "The flashes are in the right places, but the surrounding dark folds have slightly less fine definition." Fix named by the critic: "Recover low-level cloud relief selectively around the blue pockets without lifting the whole lower-right corner."
20. R3, minor, image-01.png (jupiter.hold frame 2895), Io and its shadow, centre right (crop A, O): "Io's surface looks airbrushed and low detail. The shadow on the cloud tops is a big, hard-edged smear offset well to the side, which looks pasted on" Fix named by the critic: "give Io sharper volcanic surface detail and cast a correctly projected, softer-edged elliptical shadow that matches the light direction"
21. R3, minor, image-05.png (jupiter.dive frame 2997), lower right limb behind Io (crop W, image-08): "a dark curved shape cuts across the planet edge, giving a doubled, halo-like edge where the limb, shadow and sky meet" Fix named by the critic: "clean up the composite at the limb so it has one smooth falloff into space"
22. R3, minor, image-09.png (jupiter.terrain frame 3150), near-foreground dark clouds and lightning at bottom (crops D and E in image-10.png, crop P in image-11.png, crops S, T, and U in image-12.png): "the closest dark cloud tops turn into soft, painterly swirls that lack the crisp relief of the mid-ground, with noisy bright pixel speckles around the blue lightning" Fix named by the critic: "sharpen fine cloud structure in the near foreground and replace the speckled lightning noise with clean volumetric illumination inside the clouds"
23. R3, minor, image-13.png (jupiter.rise frame 3296), lower-right nightside limb and adjacent sky (crop E in image-14.png, crop V in image-16.png): "a stray bluish-grey hazy smudge sits in empty space right under the dark limb, creating a hard dark cutout edge along the unlit globe" Fix named by the critic: "remove the stray sky smudge below the planet and keep the background space black and uniform past the nightside limb"
24. R3, minor, image-09.png (jupiter.terrain frame 3150), upper-left sunlit cloud deck and horizon sky (crop B in image-10.png, crop J in image-11.png): "the sunlit clouds in the upper-left corner clip to a flat cream-white patch with lost relief, and a grainy grey haze bleeds into the sky above the limb" Fix named by the critic: "compress highlight exposure in the upper-left clouds to retain cloud-top detail and clean up the noisy haze above the horizon"
25. R4, minor, sheet-02.png (jupiter.dive sheet, frames 2970 to 3059), upper-right limb, frames 3019 to 3027: "the bank from a filled nadir view to the oblique horizon is steepest here, faster than the eased push into and out of the dive" Fix named by the critic: "spread that pitch over more frames so the limb sweeps in at the same eased rate as the settle into the terrain hold"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b, 65. Biggest influence: it's a polished, centered, generic "hero" composite (Jupiter + Io with a dramatic Milky Way backdrop, wide 16:9 framing with room for text). That looks like stock space imagery, not a single diegetic film or game frame. The physically odd details point the same way: Io and its shadow are offset, and the galaxy band sits behind a nearby planet. Those choices favor looks ov
- hold, gpt_6_2_sol: d, 76/100. The moon’s oversized, elongated shadow starts right at its edge, making it look like the moon is sitting on Jupiter’s clouds rather than orbiting above them. Stock illustration is the nearest alternative.
- hold, gemini_4_carbon: d Confidence: 88 Most influential factor: The moon casts a long, attached contact shadow directly onto Jupiter's clouds like a marble resting on a tabletop rather than an orbiting body in space,a classic physics blunder of one-shot AI image generation (reinforced by the painterly diffusion-swirl cloud textures and non-circular moon silhouette).
- hold, kimi_k3: d, 82 , The strongest clue is the physically implausible scale and crispness of the moon’s shadow on Jupiter, a common AI-art compositing flaw despite the polished cinematic finish.
- hold, grok_4_7: d, 74. The moon’s shadow is a soft painted smudge and the Great Red Spot is a cinnamon-roll swirl, the usual text-to-image Jupiter look, not a projected shadow from film, stock CGI, a textbook, or a real-time 3D engine.
- terrain, claude_opus_5_5: a , confidence 60. Most influential: cinematic-grade volumetric cloud detail and lighting (Jupiter-like Great Red Spot storm at a dramatic low-orbit angle, rim-lit atmosphere, Milky Way backdrop), well beyond real-time web 3D or textbook style. Main alternative: (b) stock/AI-style space art, since the painterly turbulence and dramatized composition could also be a polished stock or generated image
- terrain, gpt_6_2_sol: a, 72/100: The dimensional, grazing light across the layered storm clouds gives it the look of a high-end VFX establishing shot.
- terrain, gemini_4_carbon: d, 85 , The unmistakable AI diffusion texture and scale mismatch, where planetary storm bands morph into fibrous, painterly swirls and small cumulus-like puffs at an impossible orbital scale rather than physically coherent fluid dynamics or 3D geometry.
- terrain, kimi_k3: (d), 70. Most influential: the clouds have a tell-tale diffusion-model look , hyper-detailed, sculpted, painterly textures with dramatic cinematic rim lighting that is physically inconsistent, reading as polished AI concept art rather than a real film frame.
- terrain, grok_4_7: (d) 78. The storm clouds are painterly and fibrous, with melted detail and unnatural blue glow, which reads as diffusion-model art rather than filmed or simulated VFX.
- hold, claude_sonnet_5_5: Jupiter. The image shows the planet with its Great Red Spot and a small yellow moon (likely Io) casting a shadow on it.
- hold, gpt_6_2_sol: Jupiter
- hold, gemini_4_carbon: Jupiter

## What changes next

To be written.
