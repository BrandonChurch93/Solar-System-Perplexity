# Round 12 · Phase 4 · venus · round 1 of 3

- Build: main at 47a7600 (engine hash a3d211c425dc0406, venus hash f65368e35188b639), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
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
| R1 | 9 | yes | 0 | 0 | 4 |
| R2 | | yes | | | |
| R3 | 4 (part 1: 4, part 2: 6) | no | 2 | 3 | 3 |
| R4 | 6 | no | 0 | 2 | 1 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold a a d a d; terrain a a d d b, share 5 of 10. Judged: hold a d d a d; terrain b a d d d, share 3 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-05.png (venus.dive frame 1287), left sky outside the sunlit limb (also native crops I in image-06.png and J, O in image-07.png): "a curved circular patch boundary abruptly cuts off the Milky Way dust, background stars, and warm atmospheric glow into empty black space" Fix named by the critic: "remove the circular mask around the globe and extend the skybox starfield and atmospheric scatter continuously to all frame edges"
2. R3, severe, image-02.png (venus.hold frame 1185), central sunlit cloud deck near the terminator in crop A (also image-01.png, image-05.png, and crop A in image-06.png): "a vertical UV longitude seam runs top-to-bottom down the globe where diagonal cloud streaks kink sharply into a V-shaped chevron that rotates with the sphere" Fix named by the critic: "make the cloud map seamless across the 0/360-degree longitude wrap or generate cloud flow with seamless 3D spherical noise"
3. R3, major, image-02.png (venus.hold frame 1185), planet limb on both the bright upper-left edge and dark lower-right edge (crops B, D, E, I in image-02.png and image-06.png; crops K, L, R in image-03.png and image-07.png): "jagged 1-pixel stair-stepping along the hard geometric sphere edge, plus a doubled orange atmospheric rim separated by a dark gap along the night-side limb" Fix named by the critic: "supersample or anti-alias the planet silhouette and replace the hard-clipped outer shell with a single continuous volumetric atmospheric falloff"
4. R3, major, image-03.png (venus.hold frame 1185), cloud tops along the terminator, polar vortex grazing limb, and night-side lightning (crops L, Q in image-03.png and image-07.png; crops A, I in image-02.png and image-06.png): "stretched diagonal cloud streaks and visible blocky texels on high-contrast cloud edges and purple lightning bolts, with broken 1-pixel stair-stepped orange arcs near the grazing limb of the polar vortex" Fix named by the critic: "use higher-resolution cloud, displacement, and lightning textures or shader-space procedural detail with proper filtering at grazing angles"
5. R3, major, image-13.png (venus.rise frame 1586), sunlit disk, vortex, and upper cloud bands: "ridges read as combed painted strokes and sculpted impasto, smeared along the flow, not soft vapor" Fix named by the critic: "break the long strokes into small turbulent vapor and soften the embossed relief"
6. R4, major, sheet-06.png (venus.rise cover sheet, frames 1555 to 1566), rise cover, frames 1561 to 1562, upper third: "A diffuse, warm cloud ceiling gives way in one frame to nearly black space bounded by a curved planetary limb. The arc and exposure change read as a reveal cut rather than continuous ascent." Fix named by the critic: "Carry a trace of the same limb through the haze, then open the sky over more frames with matched camera motion, curvature, and exposure."
7. R4, major, sheet-03.png (venus.dive cover sheet, frames 1309 to 1320), dive cover, frames 1312 to 1314, upper left through center: "The diagonal limb and dark sky wedge disappear between 1312 and 1313 as a nearly horizontal haze band takes over. No trackable edge carries the camera's turn through the swap." Fix named by the critic: "Ease the pitch change across more frames and use moving foreground cloud to occlude a continuously moving limb before the terrain horizon resolves."
8. R1, minor, pair-01-b.png (venus.hold frame 1185), cloud bands across the planet disc (crop A, crop I): "fine fibrous cloud texture is a touch softer than the target (edge energy about 4% lower), and the storm filaments look slightly smoothed" Fix named by the critic: "restore micro-contrast and sharpening on the cloud surface to match the target's crispness"
9. R1, minor, pair-01-b.png (venus.hold frame 1185), planet disc, right and lower limb: "the disc is a few pixels smaller and sits marginally higher and tighter on the right limb than in the target" Fix named by the critic: "scale the planet up slightly and nudge it down/right so the limb lines up with the target"
10. R1, minor, pair-01-b.png (venus.hold frame 1185), whole frame grade: "overall exposure is about 1 to 1.5% brighter and a hair warmer than the target, lifting the night-side shadows slightly" Fix named by the critic: "pull overall exposure down slightly and keep the shadow side of the planet as deep as the target"
11. R1, minor, pair-03-b.png (venus.terrain frame 1440), whole frame grade and star field: "overall exposure is about 1% brighter than the target and the dark floor is slightly raised (crop pack 1st percentile 6 vs 5); the star field is marginally crisper/grainier than the target" Fix named by the critic: "pull exposure down slightly to match the target's black depth and soften star/sky grain a touch toward the target"
12. R3, minor, image-03.png (venus.hold frame 1185), Milky Way backdrop and inner limb glow (crops K, R in image-03.png and image-07.png; crops F, G, H in image-02.png and image-06.png): "the Milky Way plate looks soft and blocky with blurry star blobs beneath sharp 1-pixel overlay stars, and background stars shine unattenuated through the dense bright inner atmospheric limb glow" Fix named by the critic: "replace the upscaled Milky Way backdrop with a crisp native-resolution star plate and attenuate background stars by atmospheric optical depth near the limb"
13. R3, minor, image-13.png (venus.rise frame 1586), night side and left terminator: "cloud structure flattens to a murky field with only faint streaks" Fix named by the critic: "keep a low level of cloud relief through the shadow instead of a smooth murk"
14. R3, minor, image-12.png (venus.terrain frame 1440), nearest dark cloud strip, lower left: "the near shadow goes smooth and empty, with noise in place of cloud structure" Fix named by the critic: "carry the mid-deck turbulence into the near shadow"
15. R4, minor, sheet-04.png (venus.terrain sheet, frames 1350 to 1529), terrain pass, frames 1350 to 1529, central cloud towers and lower foreground: "The foreground cloud banks and central towers change little in spacing as the horizon drifts. The pass reads more like a gentle tilt over a fixed view than forward travel through layers of cloud." Fix named by the critic: "Add a small translational component and let the nearest cloud banks cross the frame faster than the distant towers and horizon."

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: a , 55. The main reason is the film-quality volumetric cloud detail on a Venus-like planet: fine swirling storm structure, subtle lightning in the shadowed side, a soft atmospheric rim glow, and a moody Milky Way backdrop. That reads like a high-end VFX or cinematic render, not a textbook diagram or a real-time demo. The second most likely answer is (b), a stock image, because the centered, generi
- hold, gpt_6_2_sol: d, 68/100. The main cue is the planet’s exaggerated, feathery cloud texture, which reads more like generated concept art than a physically grounded render.
- hold, gemini_4_carbon: (d), confidence: 85. The biggest giveaway is the AI-diffusion texture and scale mismatch in the atmosphere, where giant terrestrial-style cumulus puffs and fibrous, painterly swirls are wrapped onto a planetary sphere alongside a centered bullseye composition and bright Milky Way dust right next to the sunlit limb.
- hold, kimi_k3: a , 78 , the cinematic, film-grade lighting and composition (rim-lit atmosphere with polished, high-detail cloud rendering) most suggests a top-budget film/AAA cinematic frame over stock, textbook, amateur, or web-demo imagery.
- hold, grok_4_7: (d) 82 , fibrous, fractal cloud filaments that don’t follow real atmospheric physics, plus a generic centered “planet wallpaper” composition at only 1400×788.
- terrain, claude_opus_5_5: Answer: (b) stock image. Confidence: 45. Main factor: it looks like a generic, polished "Earth from orbit at sunrise" wallpaper, likely AI-generated or composited. The Milky Way is shown crisply right next to a blazing sun, and the cumulus towers are far too big for an orbital view. Those physically impossible choices look like something made for visual appeal rather than for a specific film shot.
- terrain, gpt_6_2_sol: a, 76/100. The biggest cue is the detailed volumetric lighting: long, coherent sunbeams thread through and cast deep shadows across the cloud layers.
- terrain, gemini_4_carbon: d, 78, the fusion of airplane-altitude towering cumulus clouds and god rays onto a tightly curved orbital horizon alongside a visible Milky Way next to a glaring sun,a classic diffusion-model scale and exposure mashup.
- terrain, kimi_k3: (d), confidence 65. The one thing that most influenced my answer: the physically implausible lighting , a dense Milky Way star field fully visible in the same frame as a blazing sun at the horizon, plus exaggerated, perfectly sculpted god rays through the clouds. This "everything at maximum drama" look (hdr glow, cinematic composition, physics-inconsistent exposure) is characteristic of generative
- terrain, grok_4_7: d, 74. Stars and the Milky Way stay bright right beside the sun, with spongy procedural clouds rather than real optics or fluid-dynamics volume.
- hold, claude_sonnet_5_5: Venus. The image shows a yellowish-cream planet with swirling clouds and a Milky Way backdrop. It looks like an artistic or CGI rendering of Venus.
- hold, gpt_6_2_sol: Venus. The even gold cloud cover with planet-scale vortex and no distinct Jupiter-like bands or rings points to an artistic rendering of Venus.
- hold, gemini_4_carbon: Venus

## What changes next

Worst first. 1. The sky in the dive (severe): at frame 1287, left of the lit limb, the curved edge of the hold's sky patch cuts the Milky Way dust, the stars and the warm glow off into black; carry the patch on into the film's shared star sky so no edge shows at any dive or rise camera. 2. Both covers: in the rise cover 1561 to 1562 a warm cloud ceiling gives way in one frame to nearly black space with a curved limb; in the dive cover 1312 to 1314 the diagonal limb and the dark sky wedge vanish as a level haze band takes over, with no edge the eye can follow. Match limb, arc and exposure on both sides and give each handover more frames. 3. The chevron down the cloud deck (scored severe as a longitude seam): it is part of the approved image and the hold matches it at 9, so the hold view stays; check from the dive and rise cameras that the wrap has no real seam there, and soften the kink only where the hold frame does not change. 4. The limb: stair steps on the lit and the dark edge and a doubled orange rim with a dark gap on the night side; one continuous falloff. 5. Cloud detail at native size: blocky texels on high contrast cloud edges and on the lightning, broken one pixel arcs near the grazing limb of the polar vortex, and combed, embossed strokes in the rise frame 1586. 6. Minor: the terrain view 1350 to 1529 reads as a tilt over a fixed view, so more forward travel with near banks passing; the night side and the near shadow strip go empty; the Milky Way plate is soft under sharp stars and stars shine through the inner limb glow; exposure about 1 percent bright and the disc a few pixels small.
