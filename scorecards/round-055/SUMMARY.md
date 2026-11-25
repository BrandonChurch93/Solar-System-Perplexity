# Round 55 · Phase 6 · earth · round 1 of 3

- Build: main at 9d59e69 (engine hash f200e17ad0e70237, earth hash 065c92c05fff6050), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.
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
| earth | green | green | 0 |  | full report at 9d59e699 on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz; landing at 9d59e699, from the job of the full report: the tree at the close is another build |

Each red line is one severe issue of its stop. A stop that is not measured does not hold its pass bar. The reports are the `smooth-*` files of this folder.

## Scores

| Critic | Score | Pass | Severe | Major | Minor |
| --- | --- | --- | --- | --- | --- |
| R1 | 9 | yes | 0 | 0 | 7 |
| R2 | | yes | | | |
| R3 | 3 (part 1: 3, part 2: 4) | no | 3 | 7 | 6 |
| R4 | 9 | yes | 0 | 0 | 1 |
| R8 | | yes | | | |

The pass bar asks R1, R3 and R4 for 9 with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It does not hold.

R2 votes (a = film or game cinematic). Controls: hold b b b b b; terrain b a b d b, share 1 of 10. Judged: hold b b b b b; terrain b a b a b, share 2 of 10. Pass.

R8: judged hold named correctly by 3 of 3, control by 3 of 3. Pass.

## Issues, worst first

1. R3, severe, image-05.png (earth.dive frame 1857), clouds across the whole globe, worst on the west limb and Pacific (crops D, N, S, T of image-06/07/08): "clouds break up into small square blocks and smeared tiles; the cloud layer looks like a low-resolution texture that was stretched, with visible pixels and blocky compression patterns" Fix named by the critic: "use a much higher-resolution cloud map for the close-up and filter it properly (mipmaps or anisotropic filtering); do not upscale the far-view texture"
2. R3, severe, image-05.png (earth.dive frame 1857), lower half: South America, Andes coast and the Pacific clouds (crops G, T, U, V): "strong directional streaks and smearing that look like broken motion blur or a texture stretched along one axis; terrain and clouds lose all detail and turn to streaks" Fix named by the critic: "remove or fix the motion-blur pass, or fix the UV stretch near the bottom of the view so the texture stays sharp"
3. R3, severe, image-13.png (earth.rise frame 2156), outer globe across South America, South Atlantic, and lower-left Pacific (crops image-14.png D, E, H; image-15.png P, Q; image-16.png T, U, V): "heavy radial smearing blurs terrain and clouds toward the edges, producing visible diagonal corduroy banding and pixelated stair-stepped streaks across the lower-left Pacific clouds" Fix named by the critic: "remove radial or lens-edge blur and render full-resolution cloud and surface detail cleanly all the way to the limb without directional smearing or Moire striping"
4. R3, major, image-05.png (earth.dive frame 1857), Gulf of Mexico, Caribbean and Central America (crops A, F, O, P): "bright white specks scattered over sea and land like noise or sparkles; they read as an artifact rather than small clouds or city lights" Fix named by the critic: "clamp or remove the speck layer; if they are meant as cumulus or lights, make them smaller and softer and keep lights off the day side"
5. R3, major, image-05.png (earth.dive frame 1857), dark side on the right (crops E, I, Q, V): "night side is soft and mushy, cloud swirls are blurry ghosts, and city lights are smeared into short dashes" Fix named by the critic: "sharpen the night-side textures and draw city lights as points without the streak blur"
6. R3, major, image-01.png (earth.hold frame 1755), upper right limb, aurora (crops C, L, M): "aurora is a row of hard-edged, saturated green blobs sitting on top of the limb, with a red glow behind; it looks pasted on and does not follow the planet's curve smoothly" Fix named by the critic: "make the aurora thinner and more translucent, follow the curve of the atmosphere, and soften the edges of each curtain"
7. R3, major, image-01.png (earth.hold frame 1755), South America, east coast and interior (crops H, Q): "city lights show on land that is still in daylight, so the night-light layer is not masked by the terminator" Fix named by the critic: "mask the city-light layer with the day/night terminator so lights appear only on the dark side"
8. R3, major, image-13.png (earth.rise frame 2156), Andes, Amazon basin, Central America, and North America surfaces and clouds (crops image-14.png A, H; image-15.png J, K, P): "landmasses appear soft, plastic, and airbrushed with exaggerated baked relief, blotchy blurred cloud patches over the Amazon and US East Coast, and blocky low-resolution coastlines around Hudson Bay and Greenland" Fix named by the critic: "increase albedo, normal, coastline, and cloud-map resolution so terrain and cloud edges remain crisp and natural at 1:1 crop scale"
9. R3, major, image-13.png (earth.rise frame 2156), night-side Atlantic coast of South America (crops image-14.png E; image-16.png V): "coastal city lights are stretched into blurry radial streaks that cut off abruptly along a curved patch edge at the shoreline" Fix named by the critic: "render sharp point-level night lights aligned to high-resolution land masks without radial blur or hard patch boundaries"
10. R3, major, image-13.png (earth.rise frame 2156), upper-right aurora and dark right limb (crops image-14.png C; image-15.png L, R; image-16.png W): "the aurora reads as a soft airbrushed 2D glow with a segmented lower edge along the limb, and background stars remain brightly visible directly through the aurora and atmospheric haze" Fix named by the critic: "model the aurora as a smooth 3D volumetric emission shell above the limb and attenuate background stars behind bright auroral and atmospheric layers"
11. R1, minor, pair-01-b.png (earth.hold frame 1755), mid-right night-side limb and lower-right limb southeast of South America: "The small green aurora patches are much fainter. The inner mid-right green knot nearly disappears, and the distinct lower streak fades into the blue rim." Fix named by the critic: "Restore the local green intensity and narrow luminous filaments in both patches without lifting the surrounding night-side blacks."
12. R1, minor, pair-02-b.png (earth.hold frame 1755), crop C, upper-right auroral curtain and surrounding sky: "The main aurora still matches in placement, but its finest upright rays are less distinct, with a cooler cast in the outer haze and less red-green separation." Fix named by the critic: "Recover the fine vertical green rays and the subtle warm-red falloff beyond them. Keep the surrounding sky dark."
13. R1, minor, pair-02-b.png (earth.hold frame 1755), crops B, D, F and G, daylight atmospheric rim: "The illuminated rim runs slightly paler and whiter, making the transition from the bright edge through the blue halo less vivid." Fix named by the critic: "Pull back the whitish lift slightly and restore the target's more saturated blue falloff while retaining the same limb position."
14. R1, minor, pair-02-b.png (earth.hold frame 1755), crops A, F, G and H, cloud filaments, coastlines and South American city lights: "The smallest cloud and coastline marks look a touch grainier, while some of the tiny city-light pinpoints read less cleanly as separate lights." Fix named by the critic: "Reduce the granular edge texture and recover discrete filament and pinpoint definition rather than sharpening the whole globe."
15. R1, minor, pair-01-b.png (earth.hold frame 1755), open star field and upper-right moon: "The sky and the moon retain their placement and illumination, but some of the faintest stars and the texture around the moon's lit edge are a little grittier." Fix named by the critic: "Clean up the fine speckle while retaining distinct faint stars and the original lunar crater shading."
16. R1, minor, pair-03-b.png (earth.terrain frame 2010), upper atmospheric horizon: "The horizon follows the target's curve, but the halo is marginally less saturated blue just above the bright rim." Fix named by the critic: "Bring the halo back toward the target blue, keeping the existing height and soft falloff into black."
17. R1, minor, pair-04-b.png (earth.terrain frame 2010), crops A, D, E, F, G, H and I, sun glitter, foreground cloud rims, long shadow edges and island shallows: "The positions and light direction match, but the smallest water glints and high-contrast edges read slightly coarser. The reflector midtones and nearby deep water are also fractionally lifted, reducing separation from the darkest shadows." Fix named by the critic: "Preserve the finer glint and coastline texture without extra grain, and pull the mids and dark water back slightly without changing the shadow geometry or turquoise grade."
18. R3, minor, image-01.png (earth.hold frame 1755), right limb near the terminator (crops E, I, R): "a faint doubled edge or hard rim where the dark globe meets the sky; the atmosphere glow stops on the night side" Fix named by the critic: "carry a faint atmosphere rim across the terminator and blend the limb edge"
19. R3, minor, image-01.png (earth.hold frame 1755), globe surface overall (crops A, G, P): "surface looks slightly airbrushed and over-saturated, with very bright turquoise shallows and a plastic feel" Fix named by the critic: "lower saturation of the shallows and add fine surface detail"
20. R3, minor, image-01.png (earth.hold frame 1755), moon, upper right (crop M): "moon is small and soft with little detail and its lit side does not clearly match the sun direction on Earth" Fix named by the critic: "use a sharper moon texture and light it from the same direction as Earth"
21. R3, minor, image-13.png (earth.rise frame 2156), upper-left Milky Way and sunlit left limb (crops image-14.png B, G, I; image-16.png S): "stars in the Milky Way region appear as soft multi-pixel blobs with color noise, and a wide overbright cyan-white halo washes across the adjacent starfield" Fix named by the critic: "tighten star point-spread profiles, denoise the Milky Way background plate, and narrow the sunlit limb scattering falloff"
22. R3, minor, image-09.png (earth.terrain frame 2010), blue atmospheric horizon band across the limb (crops image-10.png B, C; image-11.png J, K, L, M): "a thin dark concentric line creates a subtle doubled edge between the bright lower horizon haze and the upper blue Rayleigh glow" Fix named by the critic: "smooth the vertical atmospheric density transition so no dark seam line appears inside the limb gradient"
23. R3, minor, image-09.png (earth.terrain frame 2010), top-center space background (crop image-11.png K): "a clipped sun-glare haze enters from the top border with faint gradient banding in the dark sky falloff" Fix named by the critic: "remove the clipped border glare or apply clean 16-bit dithering to eliminate banding in the dark sky gradient"
24. R4, minor, sheet-05.png (earth.rise sheet, frames 2100 to 2174), frames 2167-2174, globe and upper-right moon: "the return has not settled; the moon still travels about 4% of the frame width and the globe is still changing scale, though about half as fast as between 2161 and 2167" Fix named by the critic: "finish the ease until globe scale and moon position hold still"

## What the jurors wrote about the judged frames

- hold, claude_opus_5_5: b , 55. What most influenced me: it's the classic polished stock "Earth from space" shot, with everything packed into one frame (hurricane, aurora, city lights, Milky Way, a small Moon). The aurora sits off the edge of the planet and the scale is unrealistic, so it's probably an AI-generated stock image. Second choice is (d).
- hold, gpt_6_2_sol: b, 65/100. The centered, self-contained Earth-and-Moon composition looks designed to work as a generic standalone illustration.
- hold, gemini_4_carbon: b Confidence: 82 Most influential factor: The "kitchen-sink" wallpaper composition that packs every dramatic space visual at once,a dead-center Earth with exaggerated continental relief shading, neon atmospheric rim glow, night-side city lights, giant limb aurora, a conveniently placed corner Moon, and a bright Milky Way starfield visible right behind the sunlit globe,which is characteristic of co
- hold, kimi_k3: b, 78 , The generic ultra-polished Earth, Moon, Milky Way, and aurora composition most strongly resembles a stock digital illustration rather than a narratively distinct cinematic frame.
- hold, grok_4_7: b, 74, centered poster composition with a decorative corner moon, aurora, and starfield and no cinematic subject, letterbox, or UI
- terrain, claude_opus_5_5: b , 60. What swayed me most: it's a polished, generic "Earth from orbit at sunrise" shot. The sun glints off the ocean, the horizon glows blue, and the clouds cast long, exaggerated shadows over Caribbean-looking islands. That cinematic but placeless look is typical of stock imagery, and this one is likely AI-made. It isn't a real orbital photo, and it isn't a labeled textbook diagram. The renderi
- terrain, gpt_6_2_sol: a, 72/100. Most influential cue: the dramatic low-angle lighting, especially the long, sharply defined cloud shadows stretching across the ocean.
- terrain, gemini_4_carbon: b, 78, the generic commercial "sunrise over Earth from orbit" wallpaper composition combining glossy photographic polish with exaggerated cloud and ocean-wave scale relative to Florida and Cuba.
- terrain, kimi_k3: (a), confidence 65. The exaggerated cinematic lighting, unnaturally long cloud shadows, the stylized dual atmospheric rim glow, and dramatic sun glare, combined with high polish, marks it as professional VFX from a film/AAA cinematic rather than a real photo, textbook plate, stock image, real-time demo, or amateur render.
- terrain, grok_4_7: (b) 78 , Geographically exact Bahamas bathymetry and natural orbital sunglint, with no labels, UI, or cinematic staging.
- hold, claude_sonnet_5_5: Earth. The image shows Earth, centered on the Americas, with the Moon in the upper right.
- hold, gpt_6_2_sol: Earth
- hold, gemini_4_carbon: Earth

## What changes next

To be written.
