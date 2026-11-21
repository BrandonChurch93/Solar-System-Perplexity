# Round 16 · Phase 4 · venus · round 2 of 3

- Build: main at c08a38a (engine hash 020740ac07ff27f7, venus hash c3b00ee316906e83), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 claude_opus_5_5. R3 part 1 gemini_4_carbon, part 2 grok_4_7. R4 gpt_6_2_sol. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: reused from round 12.

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
| R3 | 6 (part 1: 6, part 2: 6) | no | 0 | 6 | 4 |
| R4 | 6 | no | 0 | 3 | 1 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold a a d a d; terrain a a d d b, share 5 of 10. Judged: hold a a d d d; terrain a a d d d, share 4 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, major, image-07.png (venus.dive frame 1287), crops L and Q along the upper-right and lower-right dark limb (also image-02.png crops C and E, image-06.png crops C and E): "the atmosphere forms a doubled edge with a thin bright outer ring (including an unnatural pale violet highlight on the upper-right limb and a crisp orange line on the lower-right limb) separated by a dark gap from an inner hazy band, plus a grainy outer halo" Fix named by the critic: "replace the separate shell/rim composite with a single continuous volumetric scattering falloff across the limb with no hard outer ring, dark inner gap, or violet specular tint"
2. R3, major, image-02.png (venus.hold frame 1185), lower-left of crop A (also image-03.png crops P and Q, image-06.png crop A, image-07.png crop O): "cloud bands radially pinch into a tight convergence knot on the lower-left lit hemisphere with visibly stretched linear streaks radiating toward the terminator" Fix named by the critic: "remap or paint out the spherical UV pole pinch using triplanar, cubed-sphere, or seamless flow-mapped cloud coordinates so cloud filaments do not stretch into a point"
3. R3, major, image-07.png (venus.dive frame 1287), crop P middle-right and bottom-left night-side clouds (also image-05.png and image-06.png crop E upper-left): "blurry, airbrushed bluish-purple and magenta smudges sit over the dark clouds where sharp lightning filaments existed in the wider frame" Fix named by the critic: "remove the smeared purple/magenta blotches or render crisp, physically integrated internal cloud illumination and lightning at native resolution"
4. R3, major, image-13.png (venus.rise frame 1586), upper cloud fountain, also image-14.png tile B: "strands comb and stretch into linear fibers toward the convergence instead of breaking into eddies" Fix named by the critic: "ease the polar stretch and replace the combed flow with multi-scale turbulence"
5. R3, major, image-13.png (venus.rise frame 1586), left-limb dark rift and upper troughs, also image-14.png tiles B and H: "lightning sits on the cloud as painted purple-white strokes rather than light inside the volume" Fix named by the critic: "embed the discharge in the cloud so it scatters onto nearby faces"
6. R3, major, image-14.png (venus.rise frame 1586), tile D night-side limb, and the shadowed lower left of image-13.png: "shadowed clouds lose fine structure and read as airbrushed low-frequency tone" Fix named by the critic: "keep high-frequency cloud detail in the shadow and add a little scattered fill"
7. R4, major, sheet-06.png (venus.rise cover sheet, frames 1555 to 1566), frames 1557 to 1566, across the upper third: "A nearly straight bright band hangs in place while a second, curved limb emerges underneath it. The two horizon contours make the ascent read like a dissolve between views rather than one camera move." Fix named by the critic: "Carry one projected horizon through the ascent and let foreground cloud occlude it without retaining a second horizon from the outgoing view."
8. R4, major, sheet-03.png (venus.dive cover sheet, frames 1309 to 1320), frames 1315 to 1320, center and right side: "A distinct cloud-top horizon appears through the broad diagonal band while radial streaks remain fixed around the lower center. The layers do not read as detail resolving along the same descent." Fix named by the critic: "Match the incoming horizon's placement and tilt to the dive camera, and use continuous shutter blur with a cloud layer that moves past the camera."
9. R4, major, sheet-04.png (venus.terrain sheet, frames 1350 to 1529), frames 1350 to 1529, lower foreground versus the horizon: "The cloud ridges and their long shadows retain nearly the same relative spacing as the view pushes forward. The shift reads more like a zoom into a plate than flight above clouds at different distances." Fix named by the critic: "Separate nearby cloud banks, midground, and distant horizon in depth so near ridges travel faster across the frame while the horizon stays nearly still."
10. R1, minor, pair-01-b.png (venus.hold frame 1185), night side and right limb of the planet (right third, crops C, E, H): "the shadowed hemisphere is slightly lifted (about +1.3 mean level) and its cloud texture is a little smoother than in -a, so the terminator falls off less deeply and the thin rim light along the right limb reads a touch flatter" Fix named by the critic: "pull the shadow side down slightly toward -a's black depth and restore the fine banding texture inside the dark hemisphere"
11. R1, minor, pair-01-b.png (venus.hold frame 1185), whole frame grade: "overall exposure sits marginally higher than -a (about +1 level per channel), with blacks in the upper-right sky a hair lifted" Fix named by the critic: "lower exposure by roughly 1 level, keeping the warm gold balance as it is"
12. R1, minor, pair-03-b.png (venus.terrain frame 1440), sun glare and lit cloud deck in the center and right (crops A, C, E): "midtones and low end on the sunlit cloud deck are slightly lifted (shadow floor about 1-2 levels higher), so the crepuscular shadow lanes behind the cumulus towers have a bit less contrast than in -a" Fix named by the critic: "deepen the shadow lanes slightly to match -a's contrast; leave the glare size and position unchanged"
13. R3, minor, image-06.png (venus.dive frame 1287), crops A, B, and I on the sunlit globe and polar vortex (also image-07.png crops K and O): "cloud surfaces look slightly soft and upscaled at native 1:1 crop size in the closer shot, while sunlit cloud-top edges along the terminator show slight pixel stair-stepping" Fix named by the critic: "use a higher-resolution cloud texture/displacement map for the closer camera distance and anti-alias high-contrast terminator highlights"
14. R3, minor, image-06.png (venus.dive frame 1287), crop H left-side Milky Way patch and crops B and D sunlit limb glare (also image-02.png crops B and D): "the blue nebula patch on the left sky is soft and pixelated relative to overlaid point stars, and sharp 1-2 px stars shine undimmed right through the bright golden limb bloom" Fix named by the critic: "match the sky background map resolution to native render resolution and attenuate background stars inside bright atmospheric scattering and glare"
15. R3, minor, image-08.png (venus.dive frame 1287), crop S outer glow transition into dark space (also image-04.png crop T): "faint tonal banding steps appear where the warm atmospheric glow fades into the near-black sky" Fix named by the critic: "render and composite the atmospheric falloff in 16-bit/32-bit float and apply subtle blue-noise dithering before 8-bit output"
16. R3, minor, image-10.png (venus.terrain frame 1440), tile C, radial falloff above the sun, also the upper right of image-09.png: "faint concentric steps in the sun glow" Fix named by the critic: "dither the gradient and widen the falloff so the bands disappear"
17. R4, minor, sheet-01.png (venus.hold sheet, frames 1110 to 1259), frames 1110 to 1259, upper-right vortex and bright central cloud belt: "The major cloud patterns barely migrate across the globe during the hold, making the atmosphere feel closer to a still than a turning planet." Fix named by the critic: "Add persistent slow globe rotation and a small amount of cloud drift relative to the vortex, without moving the star field independently of the camera."

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: (a), confidence 55. The biggest factor was the volumetric cloud detail at film quality: swirling storm structures, faint lightning on the night side, a soft atmospheric rim glow, and a 16:9 cinematic frame. It looks like a high-end VFX render. The main alternative is (b), a polished stock or AI space image, since centered planet-against-Milky-Way shots are common in stock libraries.
- hold, gpt_6_2_sol: a, 74/100. The strongest cue is how the directional light gives the planet's layered storm clouds convincing three-dimensional depth.
- hold, gemini_4_carbon: d, 80 , The cloud layer has classic AI-diffusion textures and scale errors, looking like giant fibrous, whipped-cream ridges hundreds of kilometers tall wrapped onto a dead-center sphere alongside stacked prompt tropes (polar vortex, night-side purple lightning, full-rim halo, and a bright Milky Way beside a sunlit planet).
- hold, kimi_k3: Answer: **d**, confidence 60. Most influential factor: the clouds have the telltale generative-AI signature , overly ornate, painterly swirling vortices with a soft "airbrushed" detail texture and decorative low-atmosphere lightning, plus the uniformly glowing rim. It reads more like a Midjourney-style fantasy planet render than a photoreal VFX frame (a film/AAA cinematic would show more physicall
- hold, grok_4_7: d, 78, fibrous diffusion-style cloud strands that look like generated texture rather than real atmospheric fluid dynamics or a production render.
- terrain, claude_opus_5_5: (a) , confidence 50. What swayed me most: the polished, film-style look. It has a warm teal-and-gold grade, dramatic light rays coming through towering clouds, a strong sun bloom, and a dense Milky Way that would not really be visible next to the sun. That reads as a deliberate cinematic shot, not a science illustration or a real-time render. Stock image (b) is the close second (about 35), since t
- terrain, gpt_6_2_sol: a, 78/100: The convincingly layered volumetric lighting, with long sunlight shafts threading through the fine cloud structure, most reads like a high-end cinematic render.
- terrain, gemini_4_carbon: (d), confidence: 72. The main factor is the telltale diffusion-model scale mashup and texture: airplane-altitude cumulus cloud towers rendered at continent-sized height against a steeply curved orbital horizon, paired with a bright Milky Way directly beside a blinding sun.
- terrain, kimi_k3: (d), 84 , the biggest influence was the overly polished, physically inconsistent space lighting, especially the bright star field visible right beside the sun, which makes it read like generic AI-generated art rather than a production cinematic or textbook image.
- terrain, grok_4_7: (d) 74 The Milky Way and an unclipped sun are both fully exposed in a subject-less wallpaper view, with oversized soft cloud volumes , a hobbyist generative-art signature, not a film plate, stock photo, textbook figure, or real-time web demo.
- hold, claude_sonnet_5_5: Venus. The image shows a yellowish-cream, cloud-swirled planet with a Milky Way backdrop. It looks like an artistic rendering, so it may be a stylized Venus or a fictional planet.
- hold, gpt_6_2_sol: Venus. Golden, dense, swirling cloud cover and no banded gas-giant structure or rings.
- hold, gemini_4_carbon: Venus

## What changes next

Worst first. Motion: the rise cover 1557 to 1566 shows two horizons, a straight bright band above the globe's curved limb (confirmed on the sheet), one horizon has to carry through the ascent. The dive cover 1315 to 1320 shows the cloud top horizon through the band while the radial streaks stay fixed. The terrain view reads as a zoom into a plate: near cloud banks have to pass faster than the horizon across all 180 frames. Look: the night limb at 1287 is a doubled edge, an inner hazy band, a dark gap and a thin outer line with a violet highlight upper right and an orange line lower right (confirmed at native size), wanted is one continuous falloff. Lightning as soft purple smudges at 1287 and painted strokes at 1586. Shadowed clouds airbrushed and strands combed at 1586. Not a fault: the convergence knot at 1185, the approved hero shows the same. Minors: night side lifted 1.3 levels, exposure 1 level high, shadow lanes at 1440 slightly lifted, steps in the glow at 1287 and 1440, a slow turn in the hold.
