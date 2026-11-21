# Round 25 · Phase 4 · jupiter · round 3 of 3

- Build: main at 530168f (engine hash f854c8146f64c7e4, jupiter hash bf3a6fa3f51a1e4d), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gemini_4_carbon. R3 part 1 grok_4_7, part 2 gpt_6_2_sol. R4 claude_opus_5_5. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: reused from round 8.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 10 | yes | 0 | 0 | 0 |
| R2 | | yes | | | |
| R3 | 7 (part 1: 8, part 2: 7) | no | 0 | 1 | 7 |
| R4 | 5 | no | 0 | 4 | 3 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold d d b b b; terrain a d d a d, share 2 of 10. Judged: hold b b d a d; terrain a d d a d, share 3 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, major, image-10.png (jupiter.terrain frame 3150), crops D and E, foreground below and to the right of the storm: "Several neighboring cloud folds curl into similarly smooth, hollow tubes. The illuminated tips retain fine detail, but the broad surfaces between them look smeared and sculpted rather than turbulent." Fix named by the critic: "Vary the size and spacing of the curls and break up the smooth tubes with finer wisps, pockets of density, and overlapping cloud layers."
2. R4, major, sheet-06.png (jupiter.rise cover sheet, frames 3265 to 3276), frames 3274-3276, whole disk: "the rise cover ends on a flat, band-free beige disk. The bands, small detail and star field then pop in within two frames, and the color jumps from grey-beige to bright cream by 3280 (sheet-05)" Fix named by the critic: "hold the banded albedo texture and the stars at low contrast through the whole blur, and cross-fade detail and color over 8-12 frames instead of 2"
3. R4, major, sheet-06.png (jupiter.rise cover sheet, frames 3265 to 3276), frames 3270-3271, limb: "the limb goes from a shallow slope rising to the right to a steep arc in one frame. That reads as a snap in camera roll or direction, not one continuous move" Fix named by the critic: "spread the roll/yaw change over the cover with an eased curve so the limb angle rotates step by step"
4. R4, major, sheet-03.png (jupiter.dive cover sheet, frames 3019 to 3030), frames 3021-3026, background: "the stars and Milky Way drop to pure black during the dive cover, then come back at 3026-3030. The exposure and sky do not carry across the cover. The same happens at 3267-3274 in sheet-06" Fix named by the critic: "keep the star field rendered (motion-blurred) through the cover, or dim it gradually, instead of cutting it to black"
5. R4, major, sheet-02.png (jupiter.dive sheet, frames 2970 to 3059), frames 3002-3010: "Jupiter grows from about half the frame to filling it in 8 frames, after a nearly static hold. The dive start feels like a lurch, not an eased acceleration. The matching end of the rise, 3274-3287 in sheet-05, is just as abrupt" Fix named by the critic: "ease into the dive with a longer acceleration ramp, and ease the pull-back of the rise to a stop the same way"
6. R3, minor, image-04.png (jupiter.hold frame 2895), south limb: "the haze drops from cloud brightness to space in about six pixels, most of it in two or three, so the rim reads as a short step" Fix named by the critic: "widen and soften the limb falloff so the glow does not end in a short step"
7. R3, minor, image-08.png (jupiter.dive frame 2997), south limb of the second frame: "the same thin rim, with most of the brightness drop inside about four pixels" Fix named by the critic: "use the wider, softer falloff of the bright crescent on the darker limb too"
8. R3, minor, image-02.png (jupiter.hold frame 2895), the moon against the clouds: "the moon is softer and slightly glossy beside the sharper cloud deck, so the sphere reads as a wrapped texture" Fix named by the critic: "raise the moon texture detail and remove the glossy wrap so it matches the clouds"
9. R3, minor, image-11.png (jupiter.terrain frame 3150), crop Q, mid- to far-distance cloud deck below the blue limb: "Some dark and blue-gray bands flatten into long, nearly parallel streaks with little crosswise structure, giving the cloud texture a stretched look." Fix named by the critic: "Add intermittent transverse eddies and breaks to the bands while keeping detail progressively finer toward the horizon."
10. R3, minor, image-12.png (jupiter.terrain frame 3150), crop U, bright blue patch in the dark foreground: "The brightest blue-white flecks have a soft, diffuse patch around them but little apparent depth or spill onto the adjoining cloud folds, making the glow read as an overlay." Fix named by the critic: "Place the luminous cores within distinct cloud layers and add localized scattering and occlusion around those cores."
11. R3, minor, image-15.png (jupiter.rise frame 3296), crop P, moon and adjacent globe: "The moon's crisp outline contrasts with its soft, mottled illuminated face and nearly solid black shadow, which makes it read slightly like a cutout." Fix named by the critic: "Resolve a little more surface relief on the lit side and soften the transition into shadow without washing out the silhouette."
12. R3, minor, image-16.png (jupiter.rise frame 3296), crop S, lower-left dense star field: "Several bright stars are fuzzy, elongated flecks amid otherwise compact points, and the dense background blends into mottled grain." Fix named by the critic: "Use a consistent, tight star profile and separate unresolved starlight from the larger dust texture."
13. R4, minor, sheet-06.png (jupiter.rise cover sheet, frames 3265 to 3276), frames 3265-3267, lower left: "the orange storm streaks smear into parallel, repeated vertical strands that look like ghost copies more than one smooth blur" Fix named by the critic: "raise the motion-blur sample count or shutter samples during the fast segments"
14. R4, minor, sheet-03.png (jupiter.dive cover sheet, frames 3019 to 3030), frame 3019, upper left: "the bright cloud fragments show stepped, duplicated edges in the blur" Fix named by the critic: "use more temporal samples for the motion blur in the first frames of the cover"
15. R4, minor, sheet-04.png (jupiter.terrain sheet, frames 3060 to 3239), storm across 3060-3239: "the vortex mostly grows and tilts as one sheet. The near cloud tops show little parallax against the horizon, so depth reads weakly" Fix named by the critic: "add a small lateral or forward camera move so the foreground cloud relief slides against the limb"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b, confidence 60. Main reason: it looks like a polished stock space illustration. You get a centered, glossy Jupiter, Io and its shadow, and a dramatic Milky Way behind it. Real astronomy doesn't put those together, but it's the kind of "beautiful hero shot" that stock catalogs sell for generic space or science topics. A textbook would care about accuracy, and the rendering is cleaner and more pho
- hold, gpt_6_2_sol: b, 76/100. The clean, centered Jupiter portrait against a dramatic starfield looks composed as a standalone space illustration. (Moon-shadow liberties suggest stylization; no screenshot evidence of real-time rendering.)
- hold, gemini_4_carbon: d, 90, The moon casts an elongated, attached tabletop-style shadow onto Jupiter as if resting right on its surface,a classic AI image-generation physics hallucination rather than real orbital geometry or a NASA-textured 3D render.
- hold, kimi_k3: (a), 82, the cinematic lighting and high-end planetary rendering most influenced my answer.
- hold, grok_4_7: (d) 74 , the cloud bands look like smooth painted swirls, not a photograph, a NASA texture, or a film-quality render.
- terrain, claude_opus_5_5: a , confidence 70. Biggest factor: the cinematic look. It's a wide, low-angle shot along the horizon with dramatic rim lighting along the edge of the atmosphere, a Milky Way backdrop, film-style color grading and rich volumetric cloud detail around a Great Red Spot to like storm. That reads like a VFX hero shot, not a textbook diagram or a real-time render. Runner-up is (b) a stock image, since this 
- terrain, gpt_6_2_sol: My independent read: d, 77/100. Most influential: the cloud bands have a uniformly sculpted, painterly swirl all the way from the vortex into the foreground, more suggestive of generated illustration than simulated atmospheric flow.
- terrain, gemini_4_carbon: (d) , Confidence: 88 Most influential factor: Telltale AI diffusion artifacts in the cloud structures,specifically the taffy-like, fibrous cloud tendrils and starry nebula-like blue glows bleeding into the dark clouds at the bottom right (paired with an impossibly bright Milky Way right beside a sunlit planetary limb).
- terrain, kimi_k3: (a) , confidence 88. Most influential: the cinematic, high-production-value lighting/composition and polished large-scale VFX detail of the planet and storm, which looks like a film/AAA cinematic frame rather than a stock photo, textbook figure, amateur gen-art, or real-time web demo.
- terrain, grok_4_7: d, 74, the storm’s oily fractal cloud texture looks AI-generated rather than filmed or physically simulated.
- hold, claude_sonnet_5_5: Jupiter. The image shows the planet with its Great Red Spot. A small yellow moon, probably Io, casts a shadow on the cloud tops.
- hold, gpt_6_2_sol: Jupiter
- hold, gemini_4_carbon: Jupiter

## What changes next

Jupiter has used its three rounds, so nothing follows; what stays open, worst first. (1) Rise cover, 3265 to 3276 (two R4 majors): the cover ends on a flat beige disc with no bands, then the bands, the fine detail and the star field come in within two frames and the colour goes from grey beige to bright cream by 3280; and at 3270 to 3271 the limb goes from a shallow slope to a steep arc in one frame, which reads as a snap in roll and not as one move. (2) Sky in both covers (R4 major): the stars and the Milky Way drop to pure black from 3021 to 3026 and from 3267 to 3274 and come back after. (3) Dive 3002 to 3010 (R4 major): after a nearly still hold the globe grows from half the frame to all of it in eight frames, a lurch; the end of the rise, 3274 to 3287, stops as abruptly. (4) Terrain 3150, the near cloud folds below and right of the storm (R3 major): neighbouring folds curl into smooth hollow tubes, the lit tips keep detail and the broad faces between them look smeared and sculpted. Minors: the south limb falls from cloud brightness to space in four to six pixels at 2895 and 2997, Io is softer and a little glossy beside the cloud deck and reads slightly as a cutout at 3296, far bands in the terrain view flatten into long parallel streaks, the blue glow in the dark foreground reads as an overlay, a few fuzzy elongated stars at the lower left of 3296, stepped copies of bright edges in the blur at 3019 and 3265 to 3267, and little parallax between the near cloud tops and the horizon across the terrain view. Against round 17: R1 went from 7 to 10 (the hold sky is back to one texel per pixel and Io's night limb and shadow are back to the approved image), R3 stays 7 (parts 8 and 7), R4 went from 4 to 5; the severe of round 17 is gone (the rise now keeps the bands near level from its first clear frame), as are the majors on the tone step after the dive cover, on the exposure climb before the rise cover and on the flat terrain push (now a minor). R2 passes with 3 of 10 against 2 of 10 for the approved images. Summary in `scorecards/round-025/`.
