# Style pass

One hero image per body. One take each, no judge, no regeneration. These are look references, not final frames.

- Model: Seedream 5 Pro (`seedream_5`), 16:9, 2816x1584. Used instead of Nano Banana Pro because across the drafts it gave the more cinematic result (deeper contrast, richer grade, less plastic surfaces). Output re-encoded to PNG.
- Style anchor: `references/drafts/saturn/hero-r4-t2.jpg`, passed as image 1 into every generation as a look-only reference. Chosen over the other Saturn takes for its dominant globe, deep shadow and warm grade.
- Real photographs passed after the anchor are in `references/_real/<body>/` (sources and credits in each `sources.json`).
- `contact-sheet.jpg`: all nine in one labeled grid.

## Sun

File: `sun.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/sun/sun_sdo_aia304_full_disk_prominences.jpg`
3. `references/_real/sun/sun_inouye_sunspot_penumbra_closeup.jpg`
4. `references/_real/sun/sun_inouye_granulation_convection_cells.jpg`
5. `references/_real/sun/sun_eclipse_2017_corona_streamers.jpg`

Prompt:

```
The Sun: the whole disc, huge and dominant in the frame, composed like a film poster.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. The Sun itself is the light: a self-luminous sphere of plasma, with strong contrast between its darker textured surface and its white-hot regions, darkening toward the edge of the disc, and an intense glow and bloom around it. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

THE SUN: a raging ocean of fire. The entire surface is deeply textured with boiling granulation, millions of bright convection cells with dark lanes between them, in molten gold, deep orange and ember red. Clusters of dark sunspots with black cores and fine radial filaments, ringed by white-hot active regions and tangled glowing magnetic loops. Enormous prominences and looping plasma arcs leap off the edge of the disc: twisted ribbons of crimson and gold fire tens of thousands of kilometres high, with fine threads of plasma raining back down. A streaming corona of pearl-white and pale gold rays and long tapering streamers reaches far out into space on every side, full of fine structure. Expose for the surface: every granule and filament stays visible, nothing blown out to flat white. Beyond the reach of the corona, deep space with stars and the Milky Way.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 5 are real photographs of the Sun, used only so it stays recognizable at a glance: image 2 for the textured full disc, active regions and a prominence leaping off the edge; image 3 for the structure of a sunspot with its filaments; image 4 for the granulation cells; image 5 for the streaming corona. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Mercury

File: `mercury.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/mercury/messenger-enhanced-global-disc.jpg`
3. `references/_real/mercury/messenger-kuiper-ejecta-rays.jpg`
4. `references/_real/mercury/messenger-terminator-shadows.jpg`

Prompt:

```
Mercury: the whole planet, large and dominant in the frame, composed like a film poster, with the huge Sun glaring nearby.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic light from the Sun: hard directional sunlight, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

MERCURY: a scorched, battered world of grey, bronze and charcoal. Overlapping craters of every size, long cliffs and wrinkle ridges, smooth dark lava plains, the vast ringed Caloris basin, and brilliant young ray craters whose pale blue-white rays streak across half the globe. The day side blazes under ferocious sunlight, with glints of metallic mineral in the rock. Along the terminator every crater rim and peak throws a long razor-sharp shadow, and the night side falls into black. THE SUN: close by in the frame, enormous, far larger than it ever looks from Earth, white-gold with a brilliant streaming corona, heavy bloom and a strong anamorphic lens flare streaking across the frame. Stars and the Milky Way fill the darker part of the sky.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 4 are real photographs of Mercury, used only so it stays recognizable at a glance: image 2 for the whole globe, its terrains and ray craters; image 3 for a bright ray crater and its ejecta rays; image 4 for crater relief and hard shadows at the terminator. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Venus

File: `venus.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/venus/mariner10-golden-swirling-globe.jpg`
3. `references/_real/venus/akatsuki-uvi-chevron-bands.jpg`
4. `references/_real/venus/venus-express-polar-vortex-glow.jpg`

Prompt:

```
Venus: the whole planet, large and dominant in the frame, composed like a film poster.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic light from the Sun: hard directional sunlight, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

VENUS: a luminous golden world wrapped entirely in cloud. Vast swirling cloud bands sweep round the globe: giant V-shaped chevrons opening from the equator toward the poles, long streaks, mottled cells and curling vortices, and a great spiral vortex at the pole, all with deep sculpted structure like towering canyons and ridges of cloud, in pale gold, cream, amber and ochre. The atmosphere glows at the edge: a thick luminous gold-white halo of haze along the sunlit limb and a soft glowing twilight band where day turns to night. On the night side, lightning flickers faintly inside the clouds: soft pulses of pale violet-white light diffused through the cloud layers.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 4 are real photographs of Venus, used only so it stays recognizable at a glance: image 2 for the golden globe wrapped in swirling cloud bands; image 3 for the planet-wide V-shaped chevron pattern; image 4 for the swirling polar vortex. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Earth

File: `earth.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/earth/earth_full_disc_day_dscovr_epic_americas.jpg`
3. `references/_real/earth/earth_night_city_lights_black_marble_americas.jpg`
4. `references/_real/earth/earth_aurora_australis_limb_iss.jpg`

Prompt:

```
Earth: the whole planet, large and dominant in the frame, composed like a film poster, with the Moon in the distance.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic light from the Sun: hard directional sunlight, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

EARTH: vivid deep-blue oceans with turquoise shallows; brilliant white storm systems, a great hurricane spiral with a clear eye, long curling fronts and towering thunderheads that cast shadows on the sea; real, recognizable continent shapes, North and South America on the day side in rich greens, golds and desert ochres with snow on the mountain chains. A glowing electric-blue atmosphere line wraps the edge of the globe. The terminator crosses the planet, and across the night side city lights sparkle in gold webs along the coasts and river valleys. Shimmering green aurora curtains, tipped with red, ring the pole. THE MOON: small, grey and cratered, far off in the distance. Behind, stars and the Milky Way.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 4 are real photographs of Earth, used only so it stays recognizable at a glance: image 2 for the real continent shapes, oceans and cloud spirals; image 3 for city lights on the night side; image 4 for aurora curtains at the limb. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Mars

File: `mars.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/mars/viking-valles-tharsis-polar-cap.jpg`
3. `references/_real/mars/hirise-phobos-stickney.jpg`
4. `references/_real/mars/moc-regional-dust-storm.jpg`

Prompt:

```
Mars: the whole planet, large and dominant in the frame, composed like a film poster, with its moon Phobos in the foreground.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic light from the Sun: hard directional sunlight, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

MARS: deep rust, ochre and crimson, with dark basalt plains. The Valles Marineris canyon system cuts across the globe as a vast scar thousands of kilometres long, its branching walls and floor in deep shadow. West of it stand the giant Tharsis volcanoes, three great shields in a row and towering Olympus Mons, each with a summit caldera and long morning shadows. A bright white polar cap of layered ice. A dust storm curls across one region, a billowing ochre front with real volume. Thin haze glows along the edge of the planet, with pale blue-white clouds hanging near the limb. PHOBOS: in the foreground, dark, rugged and potato-shaped, pitted with craters and scored with long grooves, the huge Stickney crater on its end, rim-lit by the Sun. Behind, stars and the Milky Way.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 4 are real photographs of Mars, used only so it stays recognizable at a glance: image 2 for the globe with Valles Marineris, the Tharsis volcanoes and the polar cap; image 3 for Phobos; image 4 for a regional dust storm. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Jupiter

File: `jupiter.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/jupiter/hubble-jupiter-full-disc-great-red-spot.jpg`
3. `references/_real/jupiter/cassini-jupiter-io-transit-shadow-pia02860.jpg`
4. `references/_real/jupiter/juno-folded-filament-storms-shadows-pia25031.jpg`

Prompt:

```
Jupiter: the whole planet, colossal and dominant in the frame, composed like a film poster, with its moon Io in front of the disc.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic light from the Sun: hard directional sunlight, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

JUPITER: a colossal banded giant in cream, amber, rust and blue-grey. Every band edge is a chain of intricate swirling storms: curling eddies, folded filaments, scalloped waves, strings of white ovals and dark blue-grey festoons, with real depth, high clouds casting shadows on the decks below. The Great Red Spot is a deep churning vortex of brick red and salmon, with layered spiral walls and a turbulent wake trailing behind it. IO: in front of the disc, a small sulphur-yellow and orange volcanic moon, casting a crisp black shadow onto the cloud tops. Behind, stars and the Milky Way.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 4 are real photographs of Jupiter, used only so it stays recognizable at a glance: image 2 for the full banded globe and the Great Red Spot; image 3 for Io in front of Jupiter with its black shadow on the clouds; image 4 for the folded storm filaments and cloud shadows seen up close. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Saturn

File: `saturn.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/saturn/cassini-pia06193-natural-color.jpg`
3. `references/_real/saturn/hubble-2019-portrait.jpg`
4. `references/_real/saturn/cassini-multicolored-rings.jpg`

Prompt:

```
Saturn: the whole planet inside its rings, large and dominant in the frame, composed like a film poster, with Titan in the distance.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic light from the Sun: hard directional sunlight, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

SATURN: a golden banded globe inside immense rings tilted wide open. The globe is a hazy world of butterscotch, honey, champagne and cream bands with silk-fine filaments and ripples along every edge, cooling to blue-grey at the pole with its six-sided hexagon. The rings are resolved into thousands of shimmering bands of ice in champagne, pale gold, pearl and silver, with the broad dark Cassini Division between the two brightest rings. The rings throw a fan of fine shadow lines across the globe, and the globe throws its great shadow across the rings. Sunlight sparkles through the ice, the rings glowing softly from within, with a brilliant glint where the light strikes them. TITAN: hazy and orange, small in the distance. Behind, stars and the Milky Way.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. Give this new frame a fresh composition. Images 2 to 4 are real photographs of Saturn, used only so it stays recognizable at a glance: image 2 for the pale golden banded globe and its shadows; image 3 for the rings tilted wide open; image 4 for the fine ringlet structure and colours. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Uranus

File: `uranus.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/uranus/uranus_voyager2_true_color_1986.jpg`
3. `references/_real/uranus/uranus_webb_nircam_rings_polar_cap_2023.jpg`
4. `references/_real/uranus/uranus_keck_infrared_banding_vertical_rings_2012.jpg`

Prompt:

```
Uranus: the whole planet, large and dominant in the frame, composed like a film poster, with its rings standing nearly vertical and small moons nearby.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic light from the Sun: hard directional sunlight, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

URANUS: a glowing globe of pale cyan and turquoise, tipped on its side. Soft luminous banding in aquamarine, mint and ice blue, delicate bright cloud streaks and small white storms, and a bright polar cap, a luminous pale hood of haze over the pole facing the Sun. The atmosphere glows along the edge of the globe. THE RINGS: a set of thin, dark, narrow rings circling the planet nearly vertically, charcoal against the sky and catching the sunlight in bright glints along one side, the outermost ring the brightest. MOONS: a few small icy grey moons nearby, sharply lit. Behind, stars and the Milky Way.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 4 are real photographs of Uranus, used only so it stays recognizable at a glance: image 2 for the pale cyan colour of the globe; image 3 for the bright polar cap, thin rings and small moons; image 4 for soft banding, cloud streaks and the rings standing nearly vertical. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```

## Neptune

File: `neptune.png`

Reference images, in order:
1. `references/drafts/saturn/hero-r4-t2.jpg`
2. `references/_real/neptune/neptune-voyager-full-disk.jpg`
3. `references/_real/neptune/neptune-voyager-high-cloud-shadows.jpg`
4. `references/_real/neptune/triton-voyager-color-mosaic.jpg`

Prompt:

```
Neptune: the whole planet, large and dominant in the frame, composed like a film poster, with Triton in the distance and the Sun a small bright star.

THE LOOK: one frame from a top-budget science-fiction film or a AAA game cinematic, seen from inside a virtual-reality flight through the solar system. Photoreal and physically convincing: real light, real materials, real depth, as if the viewer is there. Wide lens and a huge sense of scale. Dramatic, cold light from the far-off Sun: hard directional light, a strong rim light, a glowing atmosphere edge, long shadows and deep contrast, with detail held in both the highlights and the shadows. Rich colour pushed past reality without turning garish. Space is alive: a dense field of pin-sharp stars, the glowing dusty band of the Milky Way, subtle nebular glow and dust. Extreme surface and cloud detail, far beyond anything a telescope or spacecraft has ever shown, with layered depth and volumetric atmosphere. Large-format anamorphic film look: deep blacks, luminous highlights with natural bloom, cool shadows against warm light, very fine film grain, a gentle vignette. Never cartoon, painterly, stylized, flat, plastic or plain; not a spacecraft photograph and not a textbook picture. No text, labels, borders, watermarks, interface elements, spacecraft or people. 16:9 landscape.

NEPTUNE: a deep electric-blue giant, with bands of azure, cobalt and indigo. Streaks of brilliant white high cloud race across it, long feathered cirrus that casts shadows on the blue cloud deck far below. A great dark storm, a vast oval vortex of deep navy rimmed with bright white companion clouds. The atmosphere glows a vivid blue along the edge of the globe. Faint, thin rings circle the planet, glinting where they catch the light. TRITON: pale pink, small in the distance. THE SUN: a small, intensely bright star with a sharp little flare. Behind, stars and the Milky Way.

REFERENCE IMAGES. Image 1 is an approved frame of Saturn from the same film. Match its finish exactly: the grade, contrast, depth of blacks, level of fine detail, star field and lens character. It is a different body: take nothing of its subject, rings, colours or composition. Images 2 to 4 are real photographs of Neptune, used only so it stays recognizable at a glance: image 2 for the blue globe, the Great Dark Spot and its bright companion clouds; image 3 for the white high clouds casting shadows on the deck below; image 4 for Triton. The real look is the starting point, not the target: do not copy their flat documentary look, their framing or their empty black backgrounds.
```
