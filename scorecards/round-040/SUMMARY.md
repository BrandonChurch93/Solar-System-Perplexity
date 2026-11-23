# Round 40 · Phase 6 · earth · round 1 of 3

- Build: main at 9972260 (engine hash 743c10b0a56aaca7, earth hash 565581fc0a4955bd), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
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
| R3 | 2 (part 1: 2, part 2: 5) | no | 3 | 2 | 3 |
| R4 | 7 | no | 0 | 2 | 2 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b b d b b; terrain b a b b b, share 1 of 10. Judged: hold b b d b b; terrain b a b b b, share 1 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-05.png (earth.dive frame 1857), entire globe surface, land, ocean, and clouds (crops A-X in image-06.png, image-07.png, image-08.png): "Extreme radial zoom-blur and low-resolution texture stretching across the entire closer view; continents, coastlines, and South American terrain are heavily smeared and blurry, while cloud and highlight details break into blocky, stepped, pixelated radial streaks (especially visible in image-06.png crops B, D, E, H and image-08.png crops T, U, V)." Fix named by the critic: "Use higher-resolution planetary surface and cloud textures or multi-scale procedural detail for close camera distances, and either disable radial motion blur on static judged frames or increase motion-blur sampling and texture filtering so features do not smear into pixelated blocks."
2. R3, severe, image-05.png (earth.dive frame 1857), Gulf of Mexico, Yucatan, Cuba, and Caribbean Sea (image-06.png crops A, F, G and image-07.png crops K, L, P, Q): "A dense, noisy patch of fine cellular popcorn clouds and a bright orange-white sunlit island/reef patch in the central Caribbean abruptly terminate with a hard circular patch border, clashing starkly with the surrounding low-resolution smeared base map." Fix named by the critic: "Blend high-resolution local detail patches seamlessly into the global base map with wide, feathered transitions and matching resolution/blur characteristics, or use a unified high-resolution global cloud and bathymetry map."
3. R3, severe, image-14.png (earth.rise frame 2156), Americas, Andes, hurricane, and limb-cloud tiles: "land, clouds, coasts, and city lights are dragged into parallel streaks and do not hold detail at native size" Fix named by the critic: "remove the directional blur so terrain and cloud edges stay sharp"
4. R3, major, image-05.png (earth.dive frame 1857), upper right limb (image-07.png crop N): "The planetary limb and atmospheric edge exhibit a dull, muddy greenish-brown double-edge halo with color banding against space instead of a clean atmospheric scattering falloff." Fix named by the critic: "Ensure the atmospheric scattering shader maintains proper Rayleigh blue/cyan spectral falloff and smooth alpha blending at grazing angles on the darkened limb."
5. R3, major, image-13.png (earth.rise frame 2156), sky beside the disc, and the moon at the upper right: "stars stay crisp points while the globe and moon are streaked, so the blur reads as a filter on one layer" Fix named by the critic: "blur the whole exposure together, or leave the planet and moon as sharp as the stars"
6. R4, major, sheet-02.png (earth.dive sheet, frames 1830 to 1919), frames 1879 to 1895, on either side of the central sun reflection: "The dark coastal shapes fade under the brighter oblique view instead of tracking cleanly into it. The overlapping geography makes the descent read as a blend between views rather than a single flight." Fix named by the critic: "Align the coastlines and cloud shadows in the same 3D camera move before blending, and carry the same light and exposure through the transition."
7. R4, major, sheet-05.png (earth.rise sheet, frames 2100 to 2174), frames 2120 to 2154, from the Caribbean to the full globe: "The rise looks like the dive played backward. The framing retraces the same landmarks, and the Cuban coastline and the large Pacific cloud spiral reappear in essentially the same configuration." Fix named by the critic: "Give the climb a different heading or bank and keep clouds moving forward in time so the ascent reads as a continuation rather than a rewind."
8. R1, minor, pair-01-b.png (earth.hold frame 1755), night side near the right limb, below the main aurora (crops E and I, around x 1000-1070, y 360-660): "the small green aurora flecks on the night side and at the lower right limb are fainter and partly missing compared with -a" Fix named by the critic: "bring back the low-latitude aurora patches at the -a intensity and position along the night-side limb"
9. R1, minor, pair-01-b.png (earth.hold frame 1755), upper right aurora curtain and red fringe (crop C): "the red upper fringe above the green curtain is slightly weaker and the green curtain a touch less saturated" Fix named by the critic: "raise the red fringe glow and green saturation slightly to match -a"
10. R1, minor, pair-01-b.png (earth.hold frame 1755), planet disc, mostly cloud and coastline texture (crops A, G): "slightly crisper and more contrasty micro-texture than -a, reading as mild extra sharpening" Fix named by the critic: "ease the local contrast or sharpening a little so cloud edges match the softer -a rendering"
11. R1, minor, pair-03-b.png (earth.terrain frame 2010), sunglint and lower half of the ocean (crops A, F, G): "a very slight lift in brightness and fine-grain texture over the ocean, with the sunglint a hair less smooth than -a" Fix named by the critic: "pull the midtones down slightly and soften the grain in the glint to match -a"
12. R3, minor, image-01.png (earth.hold frame 1755), upper right limb aurora and city lights on the day-night terminator (image-02.png crops C, E, H): "The green and red aurora curtains look slightly airbrushed with soft streaky columns, and golden city lights appear along the sunlit eastern coast of South America and Caribbean islands before the terminator has fully transitioned to night." Fix named by the critic: "Mask city emissive lights strictly to the night side past the twilight zone, and add finer vertical ray structure to the aurora."
13. R3, minor, image-01.png (earth.hold frame 1755), upper right sky (image-03.png crop M): "The Moon has a slightly soft, low-contrast airbrushed appearance with a very sharp geometric terminator." Fix named by the critic: "Sharpen lunar crater micro-detail and normal mapping near the lunar terminator."
14. R3, minor, image-16.png (earth.rise frame 2156), sunlit cloud strip and the southern coast: "bright edges along the streaks break into stepped dashes and faint color fringes" Fix named by the critic: "stop resampling those edges through the blur"
15. R4, minor, sheet-02.png (earth.dive sheet, frames 1830 to 1919), frames 1854 to 1879, bright cloud edges around the Gulf and Caribbean: "Some bright cloud details break into short, separated marks along the zoom direction instead of reading as one smooth streak." Fix named by the critic: "Use more temporal samples along the camera path and check bright cloud edges at the fastest point of the dive."
16. R4, minor, sheet-01.png (earth.hold sheet, frames 1680 to 1829), frames 1680 to 1829, the Pacific cloud spiral west of Mexico: "The hold shows slight globe drift, but the prominent cloud spiral appears pinned to the surface throughout." Fix named by the critic: "Add subtle cloud advection independent of globe rotation while keeping the star field stable."

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: (b) stock image, confidence 60. The biggest factor was that it looks like a generic, polished "Earth from space" hero shot. It crams in every cliché at once: a hurricane, an aurora, the Milky Way and a Moon that's far too big and close. The science is also off, with city lights on the daylit side and the aurora floating away from the planet's edge. That rules out a textbook picture. It also isn't 
- hold, gpt_6_2_sol: b, 70/100. The main cue is the generic, self-contained hero composition: a centered Earth with a small Moon in the corner, framed to sell the concept of “Earth from space” rather than a specific scene.
- hold, gemini_4_carbon: d, confidence: 85. Most influenced by unmistakable AI-generation artifacts,specifically hallucinated geography (a shrunken, deformed Hudson Bay and missing eastern Great Lakes) combined with physically impossible giant green auroras shooting far into space all the way down across Europe and West Africa, rather than the real NASA map textures used in 3D demos, films, or traditional stock renders.
- hold, kimi_k3: b, 72 , most influential: the highly polished but generic hero-shot composition looks like a professional stock space illustration rather than a uniquely cinematic frame.
- hold, grok_4_7: (b) 84 , the commercial stock formula: an oversized Moon balancing a hero Earth, with aurora, city lights, a hurricane, and the Milky Way all exposed at once, and none of the grain, letterboxing, or real-time artifacts a film frame or web demo would show.
- terrain, claude_opus_5_5: b, 55. Biggest factor: it looks like a polished, generic "Earth from orbit" hero shot, with an exaggerated sun glint, overly long dramatic cloud shadows and a Cuba/Bahamas-like coastline. That hyper-clean, physically stylized look is typical of stock libraries, which are now often AI-generated. It doesn't read like a specific film or game frame, a diagram-style textbook image, or a real-time rende
- terrain, gpt_6_2_sol: a, 81/100. The dramatically backlit clouds cast long, coherent shadows across the sunlit ocean, giving the orbital view a polished cinematic look.
- terrain, gemini_4_carbon: b, 78 , The centered "Earth sunrise wallpaper" framing combined with oversized, out-of-scale cumulus clouds casting exaggerated shadows across the Florida/Caribbean sunglint, which is characteristic of commercial 3D/generated stock imagery rather than physically scaled film VFX or real orbital photography.
- terrain, kimi_k3: b, 72, the generic polished Earth-from-space composition with widely reusable stock-photo aesthetics and no clear cinematic narrative or science-diagram elements.
- terrain, grok_4_7: (b) 72. Unlabeled photoreal orbital photo of real geography with natural sunglint and cloud shadows , generic commercial Earth vista, not a labeled textbook plate, cinematic frame, or real-time render.
- hold, claude_sonnet_5_5: Earth. The image shows Earth, centered on the Americas, with the Moon in the upper right.
- hold, gpt_6_2_sol: Earth
- hold, gemini_4_carbon: Earth

## What changes next

Earth round 2 of 3 after the engine's capped shutter (E6, decision d129) is on main: the smear on the judged frames 1857 and 2156, the popcorn cloud patch and the bright island patch that end in a hard round border at 1857, the muddy double edge at the limb, the dive from 1879 to 1895 that reads as a blend, a rise from 2120 to 2154 that is its own climb and not the dive played backward, and the Moon that moves as another layer than the stars
