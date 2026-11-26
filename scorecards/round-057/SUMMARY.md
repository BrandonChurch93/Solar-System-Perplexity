# Round 57 · Phase 6 · saturn · round 1 of 3 of the fourth note

- Build: main at 9f09a8a (engine hash e1ac861ce101f79f, saturn hash 130e947c4b46b50c), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gemini_4_carbon. R3 part 1 grok_4_7, part 2 gpt_6_2_sol. R4 claude_opus_5_5. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: reused from round 44.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Smooth

| Stop | Report | Landing | Red lines | First lines | From |
| --- | --- | --- | --- | --- | --- |
| saturn | red | green | 4 | dive: whole frames, speed: changes by 0.085 of the mean (over 8 points) over one film frame in 4 steps from frame 3594 to 3597, most at 3595, limit 0.08; dive: whole frames, speed: falls by 0.223 of the mean (over 8 points) before its largest value (frame 3610), lowest at frame 3588, limit 0.03 (and 2 more) | full report at 9f09a8a3 on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz; landing at 9f09a8a3, measured at the close on this build |

Each red line is one severe issue of its stop. A stop that is not measured does not hold its pass bar. The reports are the `smooth-*` files of this folder.

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 5 | no | 2 | 5 | 4 |
| R2 | | yes | | | |
| R3 | 7 (part 1: 9, part 2: 7) | no | 0 | 2 | 5 |
| R4 | 7 | no | 0 | 2 | 3 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b a e a b; terrain b a e a b, share 4 of 10. Judged: hold b b e a b; terrain b a e a b, share 3 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R1, severe, pair-03-b.png (saturn.terrain frame 3720), ring plane perspective and inner ring gap (full frame; crops A, F, G in pair-04-b.png): "camera elevation above the ring plane is much too high, opening a wide star-filled gap between the inner ring and Saturn's left limb and bending the rings into a steep ellipse instead of the low grazing angle in -a" Fix named by the critic: "lower the camera closer to the ring plane to flatten the ring ellipse, close the open sky gap inside the inner C-ring against Saturn's left limb, and raise the far-left ring horizon into the shallower, broader sweep of -a"
2. R1, severe, pair-03-b.png (saturn.terrain frame 3720), Saturn globe scale, placement, and ring occlusion (full frame; crops A, C, E, H in pair-04-b.png): "Saturn's globe is much too large and extends too far down-right into crop E while casting a tall black void across the top half of crop H, whereas in -a the globe is smaller, sits higher/farther back, and is occluded higher up by the foreground rings" Fix named by the critic: "reduce Saturn's apparent radius and shift the globe slightly up and back so the foreground rings cross in front of its lower hemisphere at mid-frame, restoring lit foreground rings across crop E and soft grazing shadow along the top of crop H"
3. smooth saturn, severe, smooth-saturn.md: "dive: whole frames, speed: changes by 0.085 of the mean (over 8 points) over one film frame in 4 steps from frame 3594 to 3597, most at 3595, limit 0.08"
4. smooth saturn, severe, smooth-saturn.md: "dive: whole frames, speed: falls by 0.223 of the mean (over 8 points) before its largest value (frame 3610), lowest at frame 3588, limit 0.03"
5. smooth saturn, severe, smooth-saturn.md: "dive: rate 2, speed: changes by 0.085 of the mean (over 8 points) over one film frame in 8 steps from frame 3593 + 1/2 to 3597, most at 3594 + 1/2, limit 0.08"
6. smooth saturn, severe, smooth-saturn.md: "dive: rate 2, speed: falls by 0.224 of the mean (over 8 points) before its largest value (frame 3610), lowest at frame 3587 + 1/2, limit 0.03"
7. R1, major, pair-03-b.png (saturn.terrain frame 3720), Saturn lower-left sunlit limb and equatorial ring-crossing zone (crop A in pair-04-b.png): "missing the crisp horizontal dark ring-shadow bands across Saturn's lower lit globe and the translucent inner C-ring overlap at the base of the globe, while the sunlit left limb has an overly wide warm-orange bloom" Fix named by the critic: "render the thin dark ring-shadow bands onto Saturn's lower equatorial globe just above the ring crossing, show subtle globe continuation behind the inner C-ring, and tighten and cool the sunlit limb glow"
8. R1, major, pair-03-b.png (saturn.terrain frame 3720), Saturn upper hemisphere cloud bands and terminator (crop C in pair-04-b.png): "cloud textures are soft, stretched, and tilted too steeply, losing the sharp fine-scale horizontal bands, scalloped eddies, distinct oval storm near the right terminator, and subtle blue-grey polar tones of -a" Fix named by the critic: "increase planetary texture resolution and micro-contrast, flatten the band tilt to match -a, add crisp storm/eddy detail near the terminator, and restore cool blue-grey shading toward the upper pole"
9. R1, major, pair-03-b.png (saturn.terrain frame 3720), Cassini Division, outer A-ring, and F-ring horizon (crops B, D, F, I in pair-04-b.png): "the wide black Cassini Division is too narrow and pushed too far down-left, the outer A-ring lacks cool slate-teal coloration and a sharp Encke gap, the ringlets lack fine icy grain, and the faint outer F-ring arc and ring-plane dust haze above the horizon in crop B are missing" Fix named by the critic: "widen and deepen the Cassini Division along the higher diagonal path of -a, shift the outer A-ring toward cool slate-teal with a crisp Encke gap, add fine particulate micro-grain across the rings, and restore the thin outer F-ring thread and subtle haze above the horizon in crop B"
10. R1, major, pair-01-b.png (saturn.hold frame 3465), Saturn lower-left limb behind inner C-ring (crop G in pair-02-b.png): "Saturn's lower-left globe fades into dark shadow before reaching the inner rings instead of continuing visibly behind translucent C-ring bands, and warm limb bloom bleeds slightly into the inner gap" Fix named by the critic: "extend the crisp lit lower-left limb behind the semi-transparent inner C-ring so faint C-ring ringlets and dark bands cross visibly over the globe edge, and tighten the warm left-limb glow"
11. R1, major, pair-01-b.png (saturn.hold frame 3465), Saturn lit cloud belts and eddies (crop A in pair-02-b.png): "mid- and lower-latitude cloud bands on the globe are noticeably softer and lower-contrast than -a, losing fine horizontal striations and small storm detail toward the lower-left limb and terminator" Fix named by the critic: "increase planetary texture sharpness and high-frequency contrast across the lower-left cloud belts and along the terminator falloff"
12. R3, major, image-10.png (saturn.terrain frame 3720), crops A and C, sunlit globe above the foreground rings: "Broad cream-colored areas lose most of their cloud structure and look airbrushed beside the sharply resolved rings." Fix named by the critic: "Pull back the highlight rolloff and preserve fine cloud texture through the brightest bands."
13. R3, major, image-16.png (saturn.rise frame 3866), crops S and T, foreground rings: "The near rings resolve into smooth, lengthwise smears. The bright bands vary across the rings but have very little visible texture along them, making the foreground read as a stretched stripe map." Fix named by the critic: "Preserve the radial bands, but add subtle variation along the arcs and retain that detail with higher-resolution sampling."
14. R4, major, sheet-04.png (saturn.terrain sheet, frames 3630 to 3809), planet disk in terrain frames 3744-3776, center and right of the globe: "the distant globe, which serves as the horizon, picks up horizontal smear streaks as if it had the same motion blur as the near ring plane. The horizon should stay sharp while the near ground blurs. Here the cloud bands look like they are swimming or being dragged" Fix named by the critic: "apply motion blur based on per-pixel screen velocity, not a global directional blur, so that the far globe stays crisp. Check that the planet texture is not being smeared by the ring-plane blur pass"
15. R4, major, sheet-04.png (saturn.terrain sheet, frames 3630 to 3809), lower-left near ring plane in frames 3630-3809: "the near ring texture breaks into dense, high-contrast, aliased striations with speckled noise. In motion this will crawl and shimmer instead of reading as a smooth blur of fine ringlets" Fix named by the critic: "raise the mip/anisotropic filtering on the ring texture at grazing angles, add temporal accumulation or more motion-blur samples, and fade out sub-pixel ringlet detail with distance"
16. R1, minor, pair-03-b.png (saturn.terrain frame 3720), upper-left starfield and Milky Way haze (crop B in pair-04-b.png): "stars are distributed too densely and uniformly and lack the soft bluish-violet Milky Way dust cloud left of Saturn's upper limb in -a" Fix named by the critic: "thin uniform faint stars, vary star brightnesses, and add the faint bluish Milky Way nebula haze in the upper-center-left sky"
17. R1, minor, pair-01-b.png (saturn.hold frame 3465), north polar crown and upper-right night limb (full frame; crop C in pair-02-b.png): "the atmospheric glow at the top crown of Saturn is warm orange-tan rather than cool pale cyan-white as in -a, and the upper-right night limb has slightly weaker cool blue rim light" Fix named by the critic: "shift the upper polar limb haze from warm amber to cool pale cyan-white and slightly strengthen the subtle blue rim along the upper-right dark limb"
18. R1, minor, pair-01-b.png (saturn.hold frame 3465), planet shadow on right-side rings and lower-right corner (full frame; crop E in pair-02-b.png): "the shadow edge on the rings sits slightly lower-left and lacks both the soft warm scattered light band just inside the shadow in crop E and the faint horizontal blue anamorphic flare streak at bottom-right in -a" Fix named by the critic: "nudge the planet shadow boundary slightly up-right, add subtle warm ringshine transition inside the shadow edge, and add the faint horizontal blue optical flare across the lower-right shadow boundary"
19. R1, minor, pair-01-b.png (saturn.hold frame 3465), outer F-ring and outer A-ring glints (crops D, F, I in pair-02-b.png): "the thin outer F-ring outside the main A-ring is too dim and diffuse (nearly invisible in crops D and I), and tiny bright specular glints across the outer A-ring in crop D are subdued" Fix named by the critic: "brighten and tighten the narrow outer F-ring thread around the left and lower-left perimeter and add crisp fine ice glints on the outer A-ring"
20. R3, minor, image-01.png (saturn.hold frame 3465), upper right moon: "the lit face is only a smooth orange gradient, about 54 pixels across, with no mottling in the haze, so it reads as a shaded ball" Fix named by the critic: "break the smooth gradient with a little uneven haze brightness"
21. R3, minor, image-05.png (saturn.dive frame 3567), upper right moon: "the lit face is the same smooth orange gradient, with no mottling in the haze" Fix named by the critic: "break the smooth gradient with a little uneven haze brightness"
22. R3, minor, image-14.png (saturn.rise frame 3866), crops D and F, lower-left planetary limb just behind the ring: "A narrow copper strip has a conspicuously sharp inner edge against the bright cloud deck, making it look like a separate layer." Fix named by the critic: "Blend the color and brightness transition into the adjacent clouds while retaining a crisp planetary silhouette."
23. R3, minor, image-15.png (saturn.rise frame 3866), crops J and K, small orange moon above the planet: "The lit side is mostly a smooth orange gradient with little legible surface detail, giving the moon a plastic look." Fix named by the critic: "Add restrained surface variation on the lit side without sharpening the silhouette."
24. R3, minor, image-16.png (saturn.rise frame 3866), crops V and W, dense star field beside the dark outer ring: "Several of the brightest stars swell into soft round dots rather than retaining a compact bright core." Fix named by the critic: "Tighten the brightest star cores and reduce their bloom while keeping the faint background points."
25. R4, minor, sheet-04.png (saturn.terrain sheet, frames 3630 to 3809), sky throughout the terrain segment: "the star field drops to near black for the whole ring skim. Then in the rise (sheet-05, 3830-3850) the Milky Way and stars swell back in, which looks like an exposure change rather than one continuous sky" Fix named by the critic: "keep a faint, stable star field in the terrain view, or ease the auto-exposure more slowly so the sky stays continuous across the dive, the terrain and the rise"
26. R4, minor, sheet-04.png (saturn.terrain sheet, frames 3630 to 3809), upper limb of the planet in frames 3760-3809: "small bright speckles and cell-like spots appear near the terminator and the upper bands, which risks flicker from frame to frame" Fix named by the critic: "denoise or filter the high-frequency detail in the cloud texture near the limb, and verify that it stays stable over consecutive frames"
27. R4, minor, sheet-05.png (saturn.rise sheet, frames 3810 to 3884), frames 3823-3837: "the camera pivots quickly from the skim to the climb-out. The ring tilt and planet framing change more between 3830 and 3837 than in the neighboring intervals, so the turn may feel abrupt rather than eased" Fix named by the critic: "lengthen the ease-in on the rise so that the angular velocity ramps up over more frames"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b, confidence 55. Main factor: it's a polished, generic hero shot of Saturn with a moon, starfield and dramatic terminator lighting, the typical "space wallpaper" stock look. It has strong texture detail, but the ring and planet geometry doesn't hold up physically. The near rings don't properly pass in front of the planet's lower limb, and the ring shadow is stylized. That argues against a textboo
- hold, gpt_6_2_sol: b, 78/100. The strongest cue is the standalone, hero-shot composition: Saturn fills the frame against a generic starfield like a stock space illustration.
- hold, gemini_4_carbon: e Confidence: 85 Most influential factor: The planet's cloud bands and mathematically exact concentric rings use procedural shader noise (domain-warped FBM swirls and 1D radial ring bands with a Fresnel rim bloom) rather than photographic textures, volumetric ring particles, or diffusion generation.
- hold, kimi_k3: a, 78, most influential: the cinematic photoreal lighting and composition (dramatic planet shadow, detailed rings, starfield, moon) look like a high-budget film/AAA cinematic rather than a textbook, stock asset, web demo, or amateur render.
- hold, grok_4_7: (b) 64. The unlabeled commercial beauty-shot framing , Saturn, full rings, one moon, stars, and a sun glow, with polished ring detail and none of the film, diagram, demo, or obvious amateur-error cues.
- terrain, claude_opus_5_5: Answer: (b) stock image. Confidence: 55. Main factor: It's a polished, generic close-up render of Saturn with a clean composition and a dark starfield. That's the typical look of stock "space background" art. It's too refined for amateur work and too stylized and decorative for a textbook. I see no real-time rendering artifacts, so a web 3D demo seems unlikely. The main alternative is (a), a film 
- terrain, gpt_6_2_sol: a, 62/100: the grazing light on Saturn’s limb gives the shot a cinematic look.
- terrain, gemini_4_carbon: e Confidence: 85 Most influential factor: The procedural shader appearance on exact 3D geometry,specifically the synthetic FBM/curl-noise cloud bands on the planet paired with a 1D radial ring pattern and pixel-level speckle noise, rather than photographic NASA maps or film-grade volumetric/particle detail.
- terrain, kimi_k3: a, 72, the highly polished cinematic lighting and extremely detailed ring/planet rendering.
- terrain, grok_4_7: b, 74. Clean commercial CGI with a flat textured ring disc, scientific color, and no cinematic grade, labels, demo aliasing, or AI geometry errors.
- hold, claude_sonnet_5_5: Saturn. The image shows the ringed planet, with an orange moon, probably Titan, in the upper right.
- hold, gpt_6_2_sol: Saturn
- hold, gemini_4_carbon: Saturn

## What changes next

To be written.
