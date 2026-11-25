# Round 47 · Phase 6 · earth · round 1 of 3

- Build: main at 73809f4 (engine hash 13d9cc752b1d9c4e, earth hash d149a782c51f8bad), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
- Machine checks before the pack: green (G1 G2 G3 G4 G6 G7 G10 G11 G12 G14 G15).
- Measures and the pack were rendered on supporting agents' VMs at this commit and assembled on the Builder's VM with no rendering.
- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 gpt_6_2_sol. R3 part 1 claude_opus_5_5, part 2 gemini_4_carbon. R4 grok_4_7. R2 five jurors per image: claude_opus_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7. R8 three jurors per image: claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon. Controls: judged in this round.

## Measures

| Check | Result |
| --- | --- |
| G5 | pass |
| G13 | pass |
| G17 | pass |

## Smooth

| Stop | Report | Landing | Red lines | First lines | From |
| --- | --- | --- | --- | --- | --- |
| earth | red | green | 7 | rise: whole frames, speed: changes by 0.112 of the mean (over 8 points) over one film frame at frame 2176, limit 0.08; rise: rate 2, speed: changes by 0.149 of the mean (over 8 points) over one film frame in 2 steps from frame 2175 + 1/2 to 2176, most at 2175 + 1/2, limit 0.08 (and 5 more) | full report at 73809f4b on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz; landing at b5849a3f, measured at the close on this build |

Each red line is one severe issue of its stop. A stop that is not measured does not hold its pass bar. The reports are the `smooth-*` files of this folder.

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 9 | no | 0 | 1 | 7 |
| R2 | | yes | | | |
| R3 | 3 (part 1: 3, part 2: 4) | no | 3 | 8 | 5 |
| R4 | 8 | no | 0 | 0 | 2 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b d b b b; terrain b a b b b, share 1 of 10. Judged: hold b b d b b; terrain b a b d b, share 1 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-05.png (earth.dive frame 1857), clouds across the western half of the globe and near the left limb (image-06 D, F; image-07 M, N, R): "clouds break up into small square blocks and smeared rectangles, like low-res tiles or compression blocks; you can see pixels and tile edges at native size" Fix named by the critic: "use a higher-resolution cloud layer with mipmapping or filtering, and remove the blocky upscale or temporal artifact before you output the frame"
2. R3, severe, image-05.png (earth.dive frame 1857), bottom third of the frame: South America, the Pacific clouds and the night side (image-08 S, T, U; image-06 E, G): "heavy directional smearing and streaks: the land, clouds and city lights are dragged into lines, so the near terrain is soft and the detail is gone" Fix named by the critic: "cut or remove the motion blur or warp at the bottom of the frame, or render it with correct per-pixel motion vectors, so the surface stays sharp"
3. R3, severe, image-13.png (earth.rise frame 2156), lower half and outer flanks of the globe (image-14.png crops D, E, F, H; image-15.png crops O, P, Q; image-16.png crops S, T, U, V): "heavy stepped radial smear and blocky directional blur stretch the Pacific clouds, Amazon and Andes terrain, and Brazilian coastal city lights into pixelated streaks while adjacent background stars remain pin-sharp" Fix named by the critic: "remove the undersampled radial or motion blur on the globe pass, or increase motion-blur sampling and apply consistent camera blur across all composited layers"
4. smooth earth, severe, smooth-earth.md: "rise: whole frames, speed: changes by 0.112 of the mean (over 8 points) over one film frame at frame 2176, limit 0.08"
5. smooth earth, severe, smooth-earth.md: "rise: rate 2, speed: changes by 0.149 of the mean (over 8 points) over one film frame in 2 steps from frame 2175 + 1/2 to 2176, most at 2175 + 1/2, limit 0.08"
6. smooth earth, severe, smooth-earth.md: "rise: rate 2, speed: changes by 0.115 of the mean (over 8 points) from one capture frame to the next at frame 2175 + 1/2, limit 0.08"
7. smooth earth, severe, smooth-earth.md: "rise: rest: the picture comes to rest between the rise and the travel: the fastest point of the body's edge moves 1.80 px a film frame at frame 2175, 0.066 of the slower end of the window, limit 0.07"
8. smooth earth, severe, smooth-earth.md: "dive: the pattern of the picture changes in place by 1.12 from frame 1890 to 8 film frames later, limit 0.45 (27 frames over it, first 1880)"
9. smooth earth, severe, smooth-earth.md: "rise: pop score 1.31 from frame 2182 to the next, limit 1.2 (4 frames over it, first 2180 + 1/2)"
10. smooth earth, severe, smooth-earth.md: "rise: the pattern of the picture changes in place by 0.92 from frame 2115 to 8 film frames later, limit 0.45 (43 frames over it, first 2112)"
11. R1, major, pair-01-b.png (earth.hold frame 1755), night-side middle-right limb and lower-right limb below South America: "The distinct emerald aurora patches at the right edge are reduced to weak hints, and the clear green streak southeast of South America is almost gone." Fix named by the critic: "Restore the two compact mid-right green accents and the separate lower-right streak at the target positions, with bright green cores and soft falloff."
12. R3, major, image-05.png (earth.dive frame 1857), Caribbean, Gulf of Mexico and Central America (image-06 A, I; image-07 O): "hundreds of tiny bright cloud specks sit on the water like scattered white pixels or noise. They look like confetti, not cumulus" Fix named by the critic: "filter the cloud mask and drop the isolated speckles, or blend the small clouds softly into the layer"
13. R3, major, image-05.png (earth.dive frame 1857), Rockies and Andes (image-07 J; image-06 B, G): "the terrain looks like plastic relief extruded straight up from a heightmap, with stepped ridges and too much contrast, so it looks like a clay model at native size" Fix named by the critic: "lower the displacement exaggeration, soften the normal map, and add subtle atmospheric scattering over the land"
14. R3, major, image-01.png (earth.hold frame 1755), upper right limb, the aurora (image-02 C; image-03 L, M): "the aurora is a flat green band painted along the limb, with a uniform comb of streaks and a red haze behind it. It reads as a separate layer stuck on, with no depth or curvature into the atmosphere" Fix named by the critic: "make the aurora a volumetric curtain that follows the shape of the oval, with height falloff and varying brightness and spacing, and blend it into the limb glow"
15. R3, major, image-01.png (earth.hold frame 1755), right edge of the night side (image-02 E, I; image-03 R): "the night limb has a hard edge with no atmosphere, and a lighter band or doubled edge near the silhouette makes it look like two layered discs" Fix named by the critic: "carry a thin atmosphere rim onto the night side and fix the offset between the shadowed globe and the surface layer"
16. R3, major, image-01.png (earth.hold frame 1755), eastern Brazil (image-02 H; image-03 Q): "city lights shine on ground that is still in daylight. The night lights layer is masked wrong for the terminator" Fix named by the critic: "drive the night lights mask from the sun angle so the lights only appear past the terminator, with a soft blend"
17. R3, major, image-13.png (earth.rise frame 2156), northern and central Atlantic globe surface and clouds (image-14.png crop C; image-15.png crops L, Q): "clouds and ocean surface are soft, muddy, and low-resolution compared with the crisp North American continent" Fix named by the critic: "use higher-resolution cloud and ocean maps on the Atlantic side and match sharpness across the full visible hemisphere"
18. R3, major, image-13.png (earth.rise frame 2156), upper right aurora along the limb (image-14.png crop C; image-15.png crop L): "aurora curtains look airbrushed and show horizontal stepped banding at the base of the brightest green ray near the limb" Fix named by the critic: "render the aurora with finer volumetric ray structure, higher bit-depth alpha falloff, and smooth integration into the atmospheric limb"
19. R3, major, image-13.png (earth.rise frame 2156), upper left Milky Way sky region (image-14.png crops B, G): "dust lanes have coarse stippled noise and posterized blotches, and dense stars merge into blocky blobs with an abrupt transition to clean black sky" Fix named by the critic: "replace or denoise the Milky Way background plate at higher native resolution, keep star point-spread profiles crisp, and feather the galactic dust falloff"
20. R1, minor, pair-01-b.png (earth.hold frame 1755), upper-right auroral arc (pair-02-b.png, crop C): "The green aurora reads as a wider, softer haze with less distinct upright rays, and the red upper fringe is more muted." Fix named by the critic: "Separate and sharpen the green rays, pull back the diffuse green spill and recover the faint red fringe above them."
21. R1, minor, pair-01-b.png (earth.hold frame 1755), sunlit upper and left rim, and shadow-side right rim (pair-02-b.png, crops B, D, F, G and I): "The sunlit blue atmosphere is more spread out and less distinctly separated from its bright core. The shadow-side outline is slightly more cyan and visible." Fix named by the critic: "Tighten the sunlit halo around the thin, bright blue-white limb and bring down the blue contour on the far right."
22. R1, minor, pair-02-b.png (earth.hold frame 1755), crops A, F, G and H: the Americas, Pacific cloud bands and eastern South American city lights: "The fine cloud filaments, ice and ridgeline detail are a little softer. The Andes look warmer and broader, coastal lights look more smeared, and the turquoise shallows are slightly duller." Fix named by the critic: "Restore fine surface and cloud texture, keep city lights pinpoint-sharp, cool and narrow the Andes highlight slightly, and recover the saturated turquoise coastal separation."
23. R1, minor, pair-01-b.png (earth.hold frame 1755), star field on both sides of the globe and upper-right Moon: "Smaller stars and dust detail in the diagonal band are slightly softer against darker empty sky. The Moon retains its position and phase, but some crater contrast is lost and its dark side is more visible." Fix named by the critic: "Recover the target's fine points and mottled galactic dust while keeping the black sky; restore lunar relief and darken the lunar night side slightly."
24. R1, minor, pair-03-b.png (earth.terrain frame 2010), blue horizon and adjoining sky (pair-04-b.png, crops B and C): "The horizon has a subtly thicker, softer blue transition, and the surrounding dark sky is fractionally darker." Fix named by the critic: "Concentrate the atmospheric glow closer to the curved limb and match the target's faint blue lift just above it."
25. R1, minor, pair-04-b.png (earth.terrain frame 2010), crops A, D, F, G and H: sun glitter, cloud edges and long foreground shadows: "The direction and placement of the lighting match, but the gold reflection has smoother water microtexture, the cloud silver linings lose small highlights, and the long shadows are a touch softer." Fix named by the critic: "Bring back the rippled sparkle in the reflection and the fine cloud-edge structure and shadow definition without moving or substantially brightening them."
26. R1, minor, pair-04-b.png (earth.terrain frame 2010), crops E and I: island chain and turquoise shallows: "Fine shoreline and reef detail is slightly softened, and blue-green shallows are less cleanly separated from the deeper water." Fix named by the critic: "Restore the small coastline and reef textures and increase the local separation of turquoise shallows from deep navy water."
27. R3, minor, image-01.png (earth.hold frame 1755), Atlantic and Pacific cloud swirls (image-02 A, F; image-03 L): "the swirls repeat the same spiral shape over and over and look airbrushed. The clouds feel stamped on, not like real weather" Fix named by the critic: "vary the shapes of the cloud systems and use real or more varied cloud data"
28. R3, minor, image-05.png (earth.dive frame 1857), upper left sky (image-06 H): "the star field is a dense orange speckle patch that looks like noise, not stars" Fix named by the critic: "use a star field with proper point stars and a gentle, smooth falloff in density"
29. R3, minor, image-01.png (earth.hold frame 1755), moon, upper right (image-03 M): "the moon is small and slightly soft, with flat shading and only a little surface detail" Fix named by the critic: "use a sharper texture on the moon and give it a crisper terminator"
30. R3, minor, image-13.png (earth.rise frame 2156), night-side right limb and western mountain ranges (image-15.png crops J, P, R; image-16.png crop V): "mountain relief on western North America and the northern Andes looks slightly embossed and plastic, and the dark night limb shows a faint thin greenish-cyan rim line against the starfield" Fix named by the critic: "reduce normal or displacement exaggeration on continental relief and soften the night-side atmospheric rim falloff"
31. R3, minor, image-09.png (earth.terrain frame 2010), upper-center dark sky above the limb and coastal land (image-11.png crops K, L, Q, R; image-10.png crop I): "the solar-glow falloff in the upper sky shows faint concentric gradient banding and subtle color blotching, and inland island terrain is slightly painterly next to crisp clouds" Fix named by the critic: "dither the high-dynamic-range sky flare gradient in 16-bit before output and sharpen fine land-cover detail on the islands"
32. R4, minor, sheet-05.png (earth.rise sheet, frames 2100 to 2174), frames 2167 to 2174, full globe: "the rise is still moving at the last sample: the globe is still shrinking and the moon is still drifting toward the opening hold, about a pixel a frame" Fix named by the critic: "carry the ease until the camera is held on the same globe as the opening, and show that held tail"
33. R4, minor, sheet-01.png (earth.hold sheet, frames 1680 to 1829), join from frame 1829 to sheet-02 frame 1830: "no consecutive-frame sheet across the hold-to-dive cover; the two neighboring frames match and do not pop" Fix named by the critic: "add a consecutive-frame sheet spanning the hold-to-dive cover"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b , confidence 55. Biggest factor: it's a polished, cliché "Earth from space" hero shot in 16:9 wallpaper framing, with the Milky Way, a tiny Moon, a hurricane, and an aurora all packed into one frame. That's typical generic stock (likely AI-made). The aurora floating on the day side and city lights showing in daylight are physically wrong, so it's not a textbook picture. It's also too detailed an
- hold, gpt_6_2_sol: b, 76/100. The centered Earth-and-Moon composition looks like a standalone stock illustration rather than a shot tied to a particular scene.
- hold, gemini_4_carbon: d Confidence: 78 Most influential factor: Hallucinated continental geography (such as cloudless green land where western Lake Erie should be, a deformed Michigan peninsula and Cuba, and duplicated hooked peninsulas on northern Colombia), which reveals one-shot AI image generation beneath the stock-wallpaper styling rather than a NASA-textured 3D render or photograph.
- hold, kimi_k3: b, 72 confidence. Most influential: the ultra-polished but generic Earth-in-space composition with stock-image-style dramatic rim lighting, aurora, Moon, and Milky Way, rather than a scene-specific cinematic frame.
- hold, grok_4_7: (b) 82 , centered hero composite that stacks sunlit Earth, a visible Milky Way, an oversized Moon, aurora, and city lights, the usual commercial stock composition rather than a film frame.
- terrain, claude_opus_5_5: b, confidence 55. What most influenced me: it's a polished, generic "Earth from orbit at sunrise" hero shot, with a Caribbean-looking coastline, sun glint and a glowing atmosphere rim, composed like a wide banner. That's typical of stock imagery, including AI-generated stock. The clouds are oversized and cast long, dramatic shadows, so it's not a real photo or a textbook image. Its photoreal quali
- terrain, gpt_6_2_sol: My pick: a, 74/100. The strongest cue is the cinematic low-angle lighting: towering clouds cast long, coherent shadows across the sunlit ocean.
- terrain, gemini_4_carbon: b, 82 , The commercial 3D-composite "Earth from space" aesthetic: exact satellite geography of Florida, Cuba, and the Bahamas combined with dramatically oversized cumulus clouds and ocean ripples, a centered top-edge lens flare, and generic subjectless wallpaper framing typical of stock renders rather than physically scaled film VFX, real orbital photography, or real-time WebGL shaders.
- terrain, kimi_k3: Answer: (d) , confidence 70. Most influential factor: the implausibly exaggerated long cloud shadows plus the hyper-graded, glossy "Earth from space" aesthetic (teal/gold grade, centered sun flare, polished symmetry) that is characteristic of modern AI image generation rather than a real photograph; the clouds never cast shadows of that scale or length from orbit. Runner-up would be (a) for the ci
- terrain, grok_4_7: b, 76. Commercial hero composition: high-contrast sun glint and atmospheric limb over a geographically accurate Caribbean, with no letterbox, labels, HUD, or generation artifacts.
- hold, claude_sonnet_5_5: Earth. The image also shows the Moon in the upper right.
- hold, gpt_6_2_sol: Earth
- hold, gemini_4_carbon: Earth

## What changes next

To be written.
