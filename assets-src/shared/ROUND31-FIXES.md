# Round 31 fixes, briefs for the supporting agents

Written by the Builder (`/root`) at 06:00 UTC on 2026-11-22, after whole film round 30 (the first of three). Scores: film 5, hook 7, compression 8, jury pass, surfaces 4, motion 5; three severe and 21 major issues. Every issue with the critic's words is in `scorecards/round-030/SUMMARY.md`. Each cause below goes to one agent. Round 31 starts when the fixes are proved on the render workers.

## Rules for every agent on this list

- Base: `origin/main` as it stands now (7ff3d07 or later). Fetch and merge it first. Your branch holds this change and nothing else.
- One owner per file. Edit only the files your section names. If you need a change in a file that is not yours, write the exact lines in your report and carry on.
- Nothing a finished stop shows may change. The 30 judged hold, dive and terrain frames (Sun 0, 60, 90, 247, 360; Mercury 615, 717, 870; Venus 1185, 1287, 1440; Earth 1755, 1857, 2010; Mars 2325, 2427, 2580; Jupiter 2895, 2997, 3150; Saturn 3465, 3567, 3720; Uranus 4035, 4137, 4290; Neptune 4605, 4707, 4860) keep their bytes, unless your section says a frame changes by design. Your own check: draft tier sha256 before and after for 2325, 2427, 2580, 615, 1440, 2010, 3150, 3720, 4290, 4860. The Builder proves all of them at the final tier on the render workers before anything reaches main. Saturn's 3465, 3567 and 3866 may differ by one level in a few pixels: known, not yours.
- Stills: `npm run -s still -- --frame N --tier draft|review|final` writes `out/work/stills/fNNNNN-16x9-<tier>-full.png`. Sheets: `npm run sheet -- --segment ID --tier review`. `npm run build` and `npx vitest run` stay green. `python3 tools/shaderaudit.py` prints no new line. At most one render process at a time; long jobs detached with a log you poll.
- Shaders: no `Math.random`, `Date.now`, `performance.now`; no `fract(sin(...))` hash on a pixel (integer hash only); no derivative and no `texture()` without an explicit level on a value first assigned after a `discard` or inside a per pixel branch.
- Judge fine detail only in crops at native size (no scaling), never from a whole frame.
- Text: no em dashes and no exclamation points in any file or file name. Almost no code comments.
- Report to `/root` with a message that starts `DONE` when the section is finished: branch and commit, what changed, your own weak points, the files below as attachments (at most 10 per message, JPEG, long edge at most 1400). If you are not finished at 07:30 UTC, send a message that starts `PART` with what is proved by then, pushed, and carry on to `DONE`. Do not wait for an answer in between: decide, note it in your notebook, continue.

## A. Dust motes (agent `dust_builder`, branch `agent/dust`)

Yours: `src/space/dust.ts` (from now on; the travel agent no longer edits it), the dust call in `src/core/engine.ts` and what a hold-out needs there, the lines of `shotAt` in `src/director/film.ts` that set `dust`, `dustLook` and `dustOffset` (two blocks, nothing else in that file: two other agents edit it now), `config/showcase.json` under `travel.dust` only, a new folder `assets-src/dust/` (notebook `NOTES.md`, probes).

Read first: `AGENTS.md`; `kit/01-FILM.md` "Travel" and "Camera rules"; `kit/04-LOOK.md` sections 3 and 7; `assets-src/travel/NOTES.md` (search for dust: how the motes stream and how a streak is drawn across the shutter); `src/space/dust.ts`.

What the critics wrote (final tier stills at native size, frames 495, 1072, 1642, 2212, 2782, 3352, 3922, 4492 are the judged frames of the eight travels, 5085 and 5235 of the ending):

- 495: "Numerous soft oblong smudges sit over the sharp star points. Several share almost the same diagonal shape and look like repeated foreground stamps rather than part of the sky."
- 1642: "soft grey oval smudges sit in the empty sky; at native size they read as blurred stamps or dust on the lens rather than distant galaxies, and they have no internal structure"
- 2212: "short grey dashes and faint elongated blobs are scattered over the star field; they look like motion-smeared or stretched sprites and give away a procedural layer"
- 3352 and 2782: "faint translucent grey oval blobs (35-50 px out-of-focus dust sprites) and dozens of small blurry grey/brown pill-shaped smudges float over crisp stars like low-res particle billboards"
- 4492: "short grey pill-shaped streaks share one tilt and read as ghosts, not stars"
- 3922: "a bluish pair of capsule smudges, with fainter streaks of the same kind"
- 5085: "Several isolated soft points show through the near-black disk and read as ghost stars on an otherwise opaque silhouette." The Builder looked: about fifteen soft round motes are drawn in front of Neptune's night side.
- Film jurors, one image each: "instanced camera-space dust sprites drifting in front of a standard starfield skybox", "repeated, similarly soft foreground specks layered over the sharp Milky Way, making it look like a rendered particle layer over a skybox", "simple camera-space particle streaks", "repeated smudge-like artifacts". Three jurors read the motes as real depth of field and voted film for it. The idea is right. The drawing gives it away.

What the kit asks: "Fine dust motes drift past the lens in every `travel`. They are faint." "Dust motes near the lens, lit by the Sun, give the sense of speed." "Fast motion is a smooth blur. It never breaks into separate ghost copies of an edge."

The cure:

1. Grains, not blobs. A mote is a fine sharp grain with a core under 1.5 px at the master size, each with its own size, level and tint, a few glinting as they tumble. No soft oval, no out-of-focus disc, nothing that looks like a stamp: no two motes in a frame share a shape a viewer can match.
2. No pills. A mote that crosses more than about 2 px during the shutter is a hairline that tapers to nothing at both ends, never a capsule with round ends and a flat level. Its level falls with its length (same energy) and it is under one level once it is longer than about 20 px, so a fast turn shows no field of parallel dashes. Motes sit at many depths so their lengths differ.
3. Faint and sparse. At the final tier a still grain peaks at most 10 levels (of 255) over the sky behind it for the brightest few and 3 to 6 for most. Brighter toward the Sun's side, as now.
4. Nothing over a body. A mote in front of the disc of a planet, a moon or the Sun is not drawn, so no point ever shows inside a dark disc (5085) or on a lit globe. Use the bodies' depth or the drawing order, and say which.
5. Unchanged: the direction and speed of the stream (it follows the camera's real speed, out of the direction of flight), the windows in `travel.dust`, determinism (seeded, no time term outside the film time).

Send: native crops before and after, side by side, from finals of 495, 1642, 2212, 3352, 4492 and 5085 at the places the critics named (in the frame resized to 1400 wide: 1642 near x 350 y 555 and x 125 y 355; 2212 near x 1160 y 50 and x 720 y 590; 5085 inside the dark disc at the upper left); one strip of native crops from eight consecutive final frames at a slow place (1620 to 1627) and one at a fast place (1640 to 1647), to show a grain drifts and never pops; the count of visible grains per frame at 1612, 1642 and 1670.

## B. The Milky Way and the stars in flight (agent `sky_builder`, branch `agent/flightsky`)

Yours: the flight terms and the flight star look in `src/space/sky.ts`, `src/space/travel/field.ts`, the map loading in `src/core/engine.ts`, `config/showcase.json` under `travel.sky` only, new asset files under `public/assets/shared/full/` and `public/assets/shared/web/` (same names in both), a new folder `assets-src/flightsky/` (notebook `NOTES.md`, scripts, `RECIPE.md`). Not yours: the files `sky.jpg` and `skyband.jpg` as they are (add new files, the stops use the old ones), the Sun's disc and glare in `sky.ts` (the travel agent), `src/space/dust.ts`, `src/director/`, every stop.

Read first: `AGENTS.md`; `kit/03-METHOD.md` section 5; `kit/04-LOOK.md` sections 2, 6, 7 and the ladder "The sky looks fake"; `kit/06-ASSETS.md` (recipes); `assets-src/shared/RECIPE.md` (how `sky.jpg` and `skyband.jpg` were made); `assets-src/travel/NOTES.md` (search for flight, deep, veil, lift); `src/space/sky.ts`; `src/space/travel/field.ts`.

How it works now: the sky is drawn by `src/space/sky.ts` from a glow map (`sky.jpg`, 8192 x 4096, the whole sphere) with a band strip laid over it (`skyband.jpg`, 8192 x 2048 for 180 by 45 degrees, a generated strip with stars baked in), code stars on top, and in flight two more point sets and a dust glow from `field.ts`, all scaled by the flight lift. The lift is 0 inside every hold, dive and terrain, comes up during a rise (0.74 at the judged rise frames 1016, 1586, 2156, 3296, 3866, 4436, 5006) and is 1 in the travels and the ending.

What the critics wrote:

- 3352, severe: "the galactic background is an undersampled, blurry skybox texture that breaks into blocky, noisy mush at native size, with baked-in stars stretched into bloated 4-10 px oval blobs directly beneath crisp 1 px procedural overlay stars"
- 1072: "Fine stars and mottled dust smear together into short diagonal dashes, while nearby isolated points remain sharp. The bright patch looks stretched at native size."
- 1642: "the band starts along a fairly straight near-vertical edge with a sudden jump in star density, which reads as a mask edge rather than a soft galactic falloff" and "brighter stars in the dense regions are soft round discs of similar size that merge into a mottled, slightly airbrushed dust layer"
- 2212: "the cross-shaped diffraction spike star looks pasted on and does not match the spikeless rendering of every other star"
- 2782: "faint patches of the underlying skybox show up as gritty, blocky orange-red pixel speckles and chroma noise against black space" and "the bright star glare has a single-axis horizontal-only pixel spike with visible stair-stepping and no matching optical PSF symmetry"
- 4492: "medium stars are soft vertical ovals, and the brightest dust is mushy rather than filamentary"
- 5085: "Several stars look like soft circular blobs next to the much sharper surrounding field."
- Film jurors: "Razor-sharp 1 to 3 pixel point-sprite stars rendered directly over a noticeably lower-resolution, bilinearly stretched Milky Way skybox texture"; "an unnatural, tightly capped 1 to 2 pixel point-sprite size distribution (lacking bright foreground stars with optical halation)"; "discrete, un-antialiased 1 to 2 pixel procedural hash-grid stars"; "the layer of similarly sized, evenly scattered pinprick stars that reads like a procedural particle field over the detailed Milky Way backdrop"; "procedural multi-octave (fBm) shader noise paired with uniform point-sprite star dots".

The cause as the Builder reads it: at the lenses of the travels the two maps are magnified two to three times. Baked stars become 4 to 10 px ovals, JPEG blocks and chroma noise become visible, and all of it lies under code stars that are 1 px sharp: two star populations with two sharpnesses on a map past its resolution. The kit's method is the cure: the glow is "a real star map with the individual stars taken out or blurred away", and "The stars: points drawn in code on top of the glow ... A map alone cannot do this. At the long lenses of the orbit views a map's stars turn into blobs."

The cure, in flight only:

1. A star free band. A second strip and, where needed, a second glow map (new files with recipes) made from the existing ones with every star and every speck removed (taken out, not blurred into blobs), the dust lanes and star clouds kept as smooth light with their color, no JPEG block and no chroma speckle visible at three times magnification, sampled smoothly (bicubic or better, a little dither) so no texel shape shows. The old maps fade out and the new ones in with the flight lift.
2. The band's stars as points. What the map loses comes back as code stars that follow the band's light: the star clouds resolved into very many faint points whose density and level follow the strip's brightness and thin out in the lanes, colored groups where the strip has them. At native size the band is then a cloud of sharp points over smooth glow, and it holds at every lens a travel uses. Use the flight sets that exist (`travel.sky.flightStars`, `.deep`, the view list) or add one.
3. One star look. Every star in flight, from every set, has one point spread: a sharp round core, anti-aliased (never a hard one pixel square), sizes and levels in a long tail (most under 1 px, some 1.5 to 2.5 px, a few bright ones larger), color variety, and on the brightest a small soft round halo that stays compact so core and halo never merge into a flat disc (5085). No cross spike on one star alone and no one-axis streak with steps: either a smooth, symmetric, sub-pixel anti-aliased streak on the few brightest, or none. Nothing that reads as a uniform particle field.
4. The band's edge: a wide, broken falloff with no straight edge and no jump in star density (1642, the band's left edge near x 700 in the frame resized to 1400 wide).
5. At flight lift 0 every pixel is as on main.

Changes by design: the eight travel frames, 5085, 5235, 5362 and the seven judged rise frames. Send before and after of those rise frames as pairs so the Builder can look at each.

Send: native crops before and after from finals of 3352 (the band across the lower two thirds), 1072 (the bright patch at the lower right), 1642 (band edge and core), 2782 (dark sky at the upper right, the brightest star at the lower right), 4492 (band along the bottom), 5085 (brightest blue white stars); the same crops magnified three times for 3352; the render time of 3352 and 1642 at the final tier before and after; the texture memory the new maps add in each asset set (G15); the recipe.

## C. The ending: camera and the sky's timing (agent `ending_builder`, branch `agent/ending`)

Yours: in `src/director/film.ts` only the ending (the branch of `shotAt` for `ending.retreat`, `ending.lookback`, `ending.fade`, `lookback()`, the `LOOKBACK` constants, the `OPEN.retreat*` terms), `config/showcase.json` only the keys `travel.retreat*`, a new folder `assets-src/ending/` (notebook `NOTES.md`, probes). Keep your diff inside those places: the travel agent edits the travel block of the same file now, and the two must merge cleanly. Not yours: `src/stops/neptune/` (the Neptune agent works on the limb, the ring and the clouds of these frames now), `src/space/`.

Read first: `AGENTS.md`; `kit/01-FILM.md` "The ending", "Camera rules", "Light across the film"; `kit/03-METHOD.md` sections 5 and 6; `kit/04-LOOK.md` sections 3, 4, 7; `assets-src/travel/NOTES.md` (search for retreat and lookback); `src/director/film.ts`.

Segments at 30 fps: `ending.retreat` 5025 to 5144 (judged frame 5085), `ending.lookback` 5145 to 5324 (judged 5235), `ending.fade` 5325 to 5399 (5362). The frame numbers stay.

What the critics wrote:

- Retreat 5057 to 5079, severe: "in 11 frames Neptune goes from lit on its upper face to almost fully dark with a thin rim light. Its screen size barely changes and there is no motion blur, so the camera seems to swing more than 90 degrees around the planet in one step. The ring also loses its shape ... It reads as a cut or a solver jump, not one move". Fix named: "spread the orbit to the night side over many more frames with an eased angular speed".
- Retreat 5057 to 5068: "the Milky Way band appears at upper left at 5068. It is nowhere in 5025 to 5057, and the star density and exposure change at the same moment, so the background pops instead of sweeping in". Fix named: "let the band enter from a frame edge across several frames".
- The whole film critic at 5362: "The ending does not land. Neptune is a clipped sliver on the left edge, and the frame is the same galactic spacer used between worlds at 4492, 5085, and 5235. The trip stops on an interstitial instead of resolving." Fix named: "End on a composed last image that is not another spacer, held long enough to read as the close."
- Film jurors on 5235: "a stylized blue-rimmed ringed planet cropped at the left edge, and empty dark space that leaves room for text"; "planet cropped at the edge and a diagonal galaxy arranged for beauty, with no narrative subject".
- An older open item: "camera is nearly frozen for over 200 frames on a mostly black frame".

What the kit asks: retreat "After Neptune's rise the camera keeps pulling away, past Triton, and turns back to face the way it came"; lookback "The Sun is one bright star among thousands, with the Milky Way behind it. Neptune is a thin blue crescent at the edge of frame. The camera barely moves"; "The lookback is true 3D: the sky, the Sun as one bright star with a small glare, and Neptune as a thin crescent at the edge of frame"; fade "a slow fall to black. The last frame is black"; "The camera has mass. Starts and stops are eased. No instant change of direction or speed"; "Exposure moves slowly".

The cure:

1. One readable move round Neptune. The swing to the night side is spread over the whole retreat (it may run on gently into the lookback) so that Neptune's phase angle as seen from the camera never changes by more than about 1.2 degrees per frame, with no step in its rate, while Neptune shrinks steadily on screen (the camera keeps pulling away the whole time) and the camera's own turn is eased. A viewer of a twelve cell sheet must be able to follow the terminator closing from cell to cell.
2. The sky sweeps in. The band enters from a frame edge because the camera turns, across many frames. Star level and exposure ramp across the whole retreat with no step (the `OPEN.retreat*` windows).
3. A composed last image. In the lookback the whole crescent of Neptune is inside the frame with both horns, near the left edge as the kit asks, not cut by the frame; the Sun is the one bright star with a small glare on a strong point of the frame, the Milky Way behind it; Triton as a small crescent if it can sit in the frame honestly. The camera barely moves and never stops: a slow drift that makes Neptune and the Sun move against each other. The fade stays a slow fall to black with a black last frame.
4. Joins: position, direction, speed and field of view continuous from `neptune.rise` into the retreat (5020 to 5030) and from the retreat into the lookback (5140 to 5150).

Changes by design: every frame from 5025 on. Nothing before 5025 changes.

Send: the review tier sheets of the three segments; a table for 5025 to 5150, every fifth frame: camera turn per frame in degrees, Neptune's phase angle and its change per frame, Neptune's radius on screen in px, the sky's star level and exposure; a strip of draft frames 5050 to 5085, every third; finals of 5085, 5235 and 5362; frames where Neptune's ring, limb or clouds look wrong along the new path, for the Neptune agent.

## D. The travels (agent `travel_builder`, branch `agent/travel`)

Yours as before, with three changes for this task: `src/space/dust.ts` goes to a new agent (`dust_builder`); `src/space/travel/field.ts` and the flight terms of `src/space/sky.ts` go to a new agent (`sky_builder`), you keep the Sun's disc and glare there; the ending block of `src/director/film.ts` goes to a new agent (`ending_builder`), you keep the travel block and everything shared. Keep your diff out of their places so the four merge cleanly.

In order:

1. Item 5 of your last report: build it (cure B for `earth.travel`, `patchFrom.uranus 0.6`). Round 30 named both: `uranus.travel` 4495 to 4502 "the band changes from bright and warm-golden at the bottom (4495) to dim and cold blue-grey at upper left (4502) in 7 frames. The exposure and color jump" (fix named: "use one sky and one exposure curve. If a dimmer, outer-system look is wanted, ramp it over the whole travel").
2. `sun.travel` 474 to 499, major: "the Sun leaves at the top as an orange, textured disc with prominences. It comes back at upper right as a blown-out white disc with a different corona. Its look and exposure change as if it were another object, and its position jumps from top center (490 glow) to upper right (499)". Fix named: "keep the Sun's shading and exposure response the same throughout the travel, or blend exposure gradually. Make the yaw that brings it to upper right continuous through 482 to 499". One Sun through the whole segment: one path on screen with no jump, one look that changes only by a slow exposure ramp.
3. `earth.travel` 2188, major: "Earth is heavily smeared while the stars and the Milky Way right next to it stay pin-sharp. The blur also streaks the surface texture inside a fairly crisp limb. Blur on only one layer reads as a 2D effect, not camera motion". The kit forbids star streaks, so the cure is in the move: while any part of a leaving body is in frame the camera barely turns, and the body leaves because the camera flies on past it (parallax blurs a near body and rightly leaves the stars sharp). The turn toward the next body comes after the body is out, eased. Check all eight departures for the same thing and give the peak turn rate per travel while the body is in frame, before and after.
4. `jupiter.travel` 3328 to 3335, major: "at 3328 Jupiter sits at lower right against plain stars with no galactic band anywhere. By 3335 a thick, bright Milky Way band with haze fills the upper left. The background changes between these frames without any visible pan, so it pops". Fix named: "Either show the pan that brings the band in, or keep the band visible at the frame edge as Jupiter leaves". In every travel the band enters from a frame edge over at least ten frames and never comes up in place.
5. `earth.travel` 2215, minor: "the Milky Way bends into a strong arc, as if seen through a fisheye ... This suggests a field-of-view spike mid-travel". Field of view eased through every travel, no spike.
6. The Sun in the travels. The whole film critic's one severe issue: "The Sun does not shrink from stop to stop, and the light does not stay with it. It is a full disk, still a huge glaring disk at Mercury's upper right, then absent through Venus, Earth, Mars, Jupiter, Saturn, and Uranus, then a pinpoint at Neptune's upper right." The kit, on travel: "The Sun's glare is placed where the Sun is for each stop and shrinks from stop to stop." No travel but the first shows the Sun today. First send a table (a `PART` is fine): for each travel, per frame, the angle between the view axis and the arriving stop's Sun direction and the leaving stop's Sun direction, the half field of view, and the Sun's radius and glare for both stops. Then build what the table allows: in each travel the arriving stop's Sun, fixed on the sky, passes through or sits in the frame for a stretch that holds the judged frame (495, 1072, 1642, 2212, 2782, 3352, 3922, 4492) or lies within ten frames of it, as a disc with its glare at Mercury's size falling stop by stop to a bright star with a small glint at Neptune, the sky dimmed a little round it and never gone, the exposure change slow. Bend a path only as far as the camera still reads as having mass. Do not change `turnDeg` or `side` of `mars.travel` or `saturn.travel`, do not move any stop's world in a way that changes a judged stop frame. Where a travel cannot reach its Sun inside those limits, leave it and say why.

Not for you this time: the motes (A), the band's texture and the star look (B), the ending (C).

Send: the review tier sheets of every travel you changed; finals of the eight judged travel frames; the per travel table of peak turn rate while a body is in frame; for `sun.travel` every frame 470 to 500 at draft as a strip.

## E. The belt (agent `belt_builder`, branch `agent/belt`)

Frame 2782 is the judged frame of `mars.travel` and the weakest frame of the film jury: five of five jurors called it a real-time web 3D demo.

- "the lit surface is soft, airbrushed, and diagonally stretched/smeared at native resolution, while the lower-left lit limb has faceted low-poly straight segments with stair-stepped pixel aliasing". Fix named: "subdivide the asteroid mesh for a smooth organic silhouette, use higher-resolution triplanar or non-stretched displacement/normal/albedo maps with crisp regolith and crater-rim micro-detail, and properly anti-alias the bright limb".
- "a large semi-transparent brown streak displays parallel linear stripes with sharp background stars shining straight through it, reading as an artificial smeared billboard or broken motion-blur pass". Fix named: "render passing foreground debris with physically consistent multi-sample 3D motion blur and proper occlusion/exposure weighting, or remove close-camera streaking debris if shutter blur cannot be sampled cleanly".
- Jurors: "its low-detail, blobby, procedural-looking texture sits over a plain starfield, along with a smeared streak that looks like screen-space motion blur"; "the distinctly particle-effect appearance of uniformly streaked asteroid debris"; "the stepped low-sample real-time motion-blur artifacts on the passing rock alongside the simple procedural noise-displaced asteroid mesh"; "simple, low-detail asteroid geometry"; "simple faceted geometry and soft texture against a point-sprite starfield, with rasterized rather than filmic motion blur".

The cure:

1. The hero rock is a film asset at the judged frame: a silhouette with no straight segment at the final tier (edges under 2 px on screen), surface detail that holds at native size with at least two texels per pixel and no stretch (craters with sharp rims, boulders, fractures, fine regolith), hard sunlight with a crisp terminator and deep shadow, a faint cool fill so the night side parts from the sky, a clean anti-aliased limb. It is larger in frame and sits about a third in from the edge at 2782, whole and clear of every edge for at least twelve frames round it. A generated photo-real rock texture with a recipe is allowed (`kit/06-ASSETS.md`), a stock or extracted one is not.
2. The near rock's pass is one smooth blur with no stripe and no step at every tier, with the stars behind it dimmed by its coverage; or it passes slowly enough to read as a rock with motion blur and not as a bar. If neither holds at native size, take that rock out of the judged frame's window.
3. Sparse stays: "a few dark rocks tumble past close to the lens with motion blur. Sparse. It is a beat, not a field."
4. The small smudges round the rocks at 2782 are dust motes, another agent's (A). The star look is B's.

Yours as before (`src/space/belt`, `public/assets/shared/belt`, `assets-src/belt`). The camera of `mars.travel` may change a little in this round (the travel agent, D): place the rocks from the camera as the film gives it, not from copied numbers.

Send: finals of 2772, 2777, 2782, 2787, 2792 with native crops of the hero rock (limb and lit face) and of the near rock's blur, before and after; the review tier sheet of `mars.travel`.

## F. The hook (agent `sun_builder`, a new branch `agent/sun-hook` from `origin/main` that holds only this)

The scroll stop critic, 7 of 10, one major, on frame 0 and eight frames across the first two seconds at 400 px wide: "The glowing solar arch reads immediately against black space and could stop a scroll, but it is already fully formed in frame one. The later frames mostly shimmer within the same silhouette, so there is little visible payoff for staying." Fix named: "Keep the bright arch readable in frame one, then send a clearly visible pulse from one footpoint over the crest to the other before the hook ends."

The cure: frame 0 stays as readable as it is. Inside the first `film.hookSeconds` seconds one event changes the picture at 400 px wide: a bright surge that leaves one footpoint, climbs the arch, crosses the crest and comes down into the other foot, lighting the strands it passes and flaring the second foot as it lands, big enough that the silhouette of the light changes from frame to frame at phone size. It is plasma flowing along the loop ("the surface boils and plasma flows along the loops"), not a flash of the whole frame. Frame 90 (the judged terrain frame, matched to the approved close image) keeps its bytes, as do 247 and 360.

Send: frames 0, 8, 15, 23, 30, 38, 45, 53, 60 at the final tier resized to 400 px wide in one strip, before and after; finals of 0 and 60 at full size; the draft hashes of 90, 247, 360 before and after.

## G. Neptune in the ending (agent `neptune_builder`, a new branch `agent/neptune-ending` from `origin/main` that holds only this)

Frames after `neptune.rise`: the retreat 5025 to 5144 and the lookback 5145 to 5324 show Neptune backlit, drawn by your stop's code.

- 5235: "A thin bright contour and a broader cyan glow trace the same arc, giving the limb a doubled, outlined look." Fix named: "Blend the bright contour into a single continuous atmospheric falloff while preserving the hard occultation edge of the solid globe."
- 5057 to 5079: "The ring also loses its shape: a full tilted ellipse at 5057 becomes a thin streak across the disc plus a small coil at lower left at 5068, then only a tiny spiral at 5079." Fix named: "Keep the ring a single rigid ellipse that follows the camera's projection".
- 5235, minor: "The clouds break into similarly hooked, smeared wisps that line up along the rim, making the strip look pasted on."
- Film jurors on 5235: "the WebGL-style Fresnel rim glow and simple unshadowed alpha-blended ring geometry"; "the planet's smooth, uniformly rim-lit geometry, which looks like a 3D object against a skybox"; "geometrically perfect thin rings/atmospheric limb".

The cure: a backlit Neptune that reads as a real crescent at every phase angle from 60 to 175 degrees and every distance from the end of the rise to the lookback. One limb: the lit sliver of cloud tops with a terminator that falls off, and one glow of air that is brightest toward the Sun and thins to nothing at the horns, never a line plus a halo and never an even rim all the way round. The ring is one rigid ellipse through the whole swing, in front of the disc and behind it, with the planet's shadow across it and its brightness changing smoothly with the angle. Clouds near the limb vary in scale and fade through the terminator. Another agent (`ending_builder`) is changing the camera path of these frames now: the swing is spread over the whole retreat and the lookback is reframed with the whole crescent inside the frame, smaller than today. Build for the angles, not for today's poses.

Your judged frames 4605, 4707, 4860 and 5006 keep their bytes. The stop's polish on `agent/neptune` stays where it is and is not part of this branch.

Send: native crops of the limb and the ring before and after at 5057, 5068, 5079, 5085, 5235 on today's path, and stills of the globe at phase angles 90, 120, 150, 165 and 172 degrees from a probe of your own.
