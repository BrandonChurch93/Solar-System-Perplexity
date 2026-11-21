# Round 17 · Phase 4 · jupiter · round 2 of 3

- Build: main at c08a38a (engine hash 020740ac07ff27f7, jupiter hash 1bfd428c151f758e), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
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
| R1 | 7 | no | 0 | 2 | 3 |
| R2 | | yes | | | |
| R3 | 7 (part 1: 9, part 2: 7) | no | 0 | 2 | 6 |
| R4 | 4 | no | 1 | 4 | 3 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold d d b b b; terrain a d d a d, share 2 of 10. Judged: hold b d d d b; terrain a d d d d, share 1 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R4, severe, sheet-05.png (jupiter.rise sheet, frames 3240 to 3314), rise, frames 3280 to 3287: "the globe pops to a different planet pose between these frames. At 3280 the bands run roughly horizontal, the globe is lit across its whole face and the limb is low-left. By 3287 the bands run vertical, the lower half sits in deep night shadow, and Io has jumped from near the spot's right side to below it. The rise does not reverse the dive, and the end of the stop does not match the hold it left (sheet-01: horizontal bands, lit face, Io to the right of the spot)" Fix named by the critic: "make the rise one continuous camera path that pulls back out to the hold framing, or keep the new end framing but carry the globe's orientation, the terminator and Io's position through the cover with no cut"
2. R1, major, pair-01-b.png (jupiter.hold frame 2895), background sky and Milky Way (pair-02-b crops B, C, E, F, G, H): "stars and Milky Way dust lanes are noticeably blurred into soft 3-4px blobs instead of crisp 1-2px pinpoints, losing fine sky detail behind the sharp planet" Fix named by the critic: "render or composite the background starfield and Milky Way at full native resolution without blur or upscaling softness so stars remain sharp pinpoints"
3. R1, major, pair-01-b.png (jupiter.hold frame 2895), Io moon night-side terminator (pair-02-b crop A): "an unnatural bright reddish-orange band appears on Io's shadowed right limb where -a has a dark cool-shaded terminator falling cleanly to black, and Io's surface texture is slightly softer" Fix named by the critic: "darken Io's right-hand terminator to match the left-side sunlight so the night side falls smoothly to black into the cast shadow, and preserve crisp surface detail"
4. R3, major, image-15.png (jupiter.rise frame 3296), crops K to L, bright upper globe below the limb: "Several broad cloud lanes stretch into long, smooth ribbons with much less cross-lane detail than the compact red vortex. The bands look dragged across the globe rather than layered." Fix named by the critic: "Break the longest ribbons into uneven, interleaved cloud structures and restore fine detail across the flow, especially as the bands curve toward the limb."
5. R3, major, image-12.png (jupiter.terrain frame 3150), crops S to T, near shadowed cloud banks: "The curled ridges turn into soft, brushlike streaks with little small-scale structure, even beside the brighter cloud tips. The nearest clouds look less resolved than the middle-distance storm rim." Fix named by the critic: "Restore fine, low-contrast wisps and density variation in the near cloud banks without simply lifting the blacks or sharpening the whole frame."
6. R4, major, sheet-02.png (jupiter.dive sheet, frames 2970 to 3059), dive, frames 3010 to 3019: "the speed jumps. The globe grows smoothly through 2986 to 3010, then fills the frame in 9 frames, so the approach goes from a slow push to a sudden lunge with no easing" Fix named by the critic: "ease the dive's acceleration across 2994 to 3019 so the scale change per frame rises gradually"
7. R4, major, sheet-02.png (jupiter.dive sheet, frames 2970 to 3059), cover exit into terrain, frames 3035 to 3043: "color and exposure break. The cover ends in a flat warm tan haze, and the terrain opens dark, high-contrast and blue-shadowed with a bright warm horizon glow, so the change in tone reads as a cut" Fix named by the critic: "carry the tan haze into the opening terrain frames and fade it out over 10 to 15 frames, or grade the cover's last frames toward the terrain's palette"
8. R4, major, sheet-04.png (jupiter.terrain sheet, frames 3060 to 3239), terrain, frames 3060 to 3239, whole frame: "the terrain reads as a flat push-in on a single image. The vortex, the near cloud tops and the horizon arc all scale and slide together with no visible parallax between foreground and horizon, so the view has little depth" Fix named by the critic: "build the terrain in layers (near cloud tops, mid vortex, far limb) or as 3D geometry, and move the camera so near features sweep past faster than the horizon"
9. R4, major, sheet-05.png (jupiter.rise sheet, frames 3240 to 3314), terrain to rise cover, frames 3240 to 3253: "exposure climbs fast. The terrain brightens and lifts toward pale tan over about 13 frames before the blur starts, which looks like a fade-to-white crossfade rather than the camera climbing through cloud" Fix named by the critic: "tie the haze and exposure ramp to camera altitude and spread it over a longer stretch"
10. R1, minor, pair-01-b.png (jupiter.hold frame 2895), sunlit left limb (pair-02-b crops B, D): "the bright atmospheric rim glow blooms slightly wider and hotter, washing out fine cloud-band striations right inside the sunlit edge" Fix named by the critic: "tighten and slightly reduce the sunlit limb bloom so fine cloud detail remains legible close to the horizon"
11. R1, minor, pair-01-b.png (jupiter.hold frame 2895), dark right planetary limb (pair-02-b crops C, E, G): "Jupiter's unlit right edge has a soft 2-3px feathered fringe and faint night-side cloud bleed instead of a crisp black silhouette against the background stars" Fix named by the critic: "sharpen the dark-limb silhouette edge and deepen night-side shadow falloff to pure black at the right limb"
12. R1, minor, pair-03-b.png (jupiter.terrain frame 3150), upper-right sky and horizon limb (pair-04-b crops C, I): "background pinpoint stars and faint Milky Way dust above the horizon are slightly softened compared to -a, with marginally brighter pale-blue limb haze" Fix named by the critic: "keep native-resolution crispness in the starfield sky layer and slightly trim upper-limb haze brightness"
13. R3, minor, image-05.png (jupiter.dive frame 2997), moon just right of the Great Red Spot: "the shadow is a soft oval stuck to the moon's night limb, with no crisp umbra" Fix named by the critic: "offset the umbra from the limb and tighten the penumbra so it reads as a projected ellipse"
14. R3, minor, image-01.png (jupiter.hold frame 2895), moon just right of the Great Red Spot: "same soft limb-attached shadow, smaller in this wider frame" Fix named by the critic: "use the same tighter projected ellipse as on the closer frame"
15. R3, minor, image-02.png (jupiter.hold frame 2895), tile A, moon on the cloud deck: "at native size the shadow still fades as a broad soft oval instead of a defined umbra" Fix named by the critic: "sharpen the umbra core and keep only a short penumbra"
16. R3, minor, image-14.png (jupiter.rise frame 3296), crop C, small orange moon in front of the globe: "The illuminated cap is mottled but soft, and it stops at a nearly straight, abrupt boundary above a featureless dark half. The moon reads like a small pasted-on disk." Fix named by the critic: "Use a curved, terrain-modulated terminator and retain finer surface detail on the lit cap."
17. R3, minor, image-11.png (jupiter.terrain frame 3150), crop J, upper-left distant horizon: "The brightest strip merges into a creamy band that wipes out the tops of adjacent cloud layers." Fix named by the critic: "Reduce highlight bloom locally and preserve a little separation between the far cloud crests and the atmospheric glow."
18. R3, minor, image-16.png (jupiter.rise frame 3296), crops T to U, dense part of the star field: "Some bright points have swollen or slightly elongated profiles against much finer neighboring stars, giving parts of the field a mottled, blurry look." Fix named by the critic: "Tighten the brightest star cores and reserve wider glow for a few isolated stars."
19. R4, minor, sheet-04.png (jupiter.terrain sheet, frames 3060 to 3239), vortex flow, frames 3060 to 3239: "the vortex barely rotates. Its spiral arms keep the same arrangement for about 180 frames and only scale up, so the storm reads as frozen" Fix named by the critic: "add a slow, steady counter-clockwise rotation and a gentle flow advection to the storm bands"
20. R4, minor, sheet-01.png (jupiter.hold sheet, frames 2820 to 2969), hold, Great Red Spot and bands, frames 2820 to 2969: "the globe shows no visible rotation. The Great Red Spot and the band details stay fixed for 150 frames while Io moves, so the globe looks painted on" Fix named by the critic: "rotate the globe at a slow but visible rate so the spot drifts a few pixels across the hold"
21. R4, minor, sheet-03.png (jupiter.dive cover sheet, frames 3019 to 3030), dive cover, frames 3019 to 3022: "the limb swings from the left edge to an arc across the top in about 3 frames, a quick flip in the camera's direction inside the blur" Fix named by the critic: "smooth the camera's roll and pitch through the cover so the limb's angle rotates progressively"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b, confidence 60. What most influenced me: it's a polished, centered, 16:9 "hero" shot of Jupiter with Io in front of a dramatic Milky Way. That's typical of a stock image (possibly AI-assisted), not an accurate textbook figure. Io is far too large and its shadow is unrealistically big and close, which rules out a science textbook. The lighting and detail are too refined for amateur art or a real-
- hold, gpt_6_2_sol: d, 79/100. The strongest cue is the moon's unusually long, attached shadow, which looks like a drop shadow pasted onto Jupiter rather than a separate shadow cast across its cloud tops.
- hold, gemini_4_carbon: d Confidence: 82 Most influential factor: The moon casts an elongated tabletop contact shadow steeply down-right directly onto Jupiter's clouds at an angle that does not match Jupiter's horizontal sunlit terminator, as if it were a marble resting on a surface rather than an orbiting body in 3D space or an astronomical photo.
- hold, kimi_k3: Answer: (d) amateur generated art. Confidence: 55 Most influential factor: The hyper-detailed, painterly swirls in Jupiter's cloud bands have that over-textured, AI-upscaled look, and the small "moon" reads as a composited low-fi textured sphere with a hand-painted shadow , a generic dramatic space-wallpaper composition typical of image generators rather than a physically lit film/AAA cinematic fr
- hold, grok_4_7: b, 76. The catalog beauty-shot framing , an idealized Jupiter against a separately lit, decorative Milky Way, with Io set close as a visual accent and no labels, interface, or film staging.
- terrain, claude_opus_5_5: a, 70. What swayed me most is how cinematic it looks: a widescreen low-angle shot of a Great Red Spot-style storm, with volumetric clouds, a rim-lit atmosphere edge, a Milky Way backdrop and a teal/orange grade. It's too polished and dramatic to be a textbook diagram or a real-time web demo, and it reads more like a film VFX frame than stock or amateur art. The closest alternative is (b) stock ima
- terrain, gpt_6_2_sol: d, 66/100: The clouds have an unusually painterly texture, with the same tightly curled, brushlike forms repeated across the storm.
- terrain, gemini_4_carbon: d, 85, the unmistakable text-to-image diffusion artifacts in the cloud structures,specifically the fibrous, canyon-like concentric ridges inside the red vortex and nebula-like sparkles standing in for lightning rather than physically coherent fluid dynamics or 3D shaders.
- terrain, kimi_k3: d, 82, over-polished painterly rendering with physically implausible planetary-scale clouds and AI-like texture consistency issues.
- terrain, grok_4_7: (d) 68 , fractal, painterly storm turbulence with decorative cyan lightning that looks generated rather than physically simulated.
- hold, claude_sonnet_5_5: Jupiter. The image also shows its moon Io and Io's shadow on the planet.
- hold, gpt_6_2_sol: Jupiter. The central banded planet has the Great Red Spot; the small foreground moon is incidental.
- hold, gemini_4_carbon: Jupiter

## What changes next

Worst first. Look, because R1 fell from 9 to 7: the hold sky's stars are larger and softer than the approved hero's (confirmed at native size, x 1368 to 1824, y 216 to 649), and Io has a bright orange band on its night limb with a softer and lighter shadow than the hero's (confirmed). Motion: the rise pulls back from a limb close-up to a small globe in about 13 frames (3274 to 3287) and ends with the bands upright, which the critic reads as another planet pose; the path itself is continuous (the dark half is below the frame at 3280), so ease the pullback and take the roll out. The dive lunges in nine frames, 3010 to 3019. The cover leaves in flat tan and the terrain opens dark and blue, 3035 to 3043. The terrain view reads as a flat push in with no parallax. Exposure lifts to pale tan over 13 frames ahead of the rise cover, 3240 to 3253. Then: broad smooth ribbons at 3296, near cloud banks soft at 3150, a slow turn of the globe and of the vortex.
