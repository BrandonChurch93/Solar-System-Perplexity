# 01 · The film

## What it is

- Working title: `name` in the config.
- One unbroken flight through the solar system. It starts on the surface of the Sun and ends beyond Neptune.
- Nine stops, in order: the ids in `stops` in the config.
- Length `film.durationSeconds` seconds at `film.fps` frames per second.
- No people, no spacecraft, no dialogue. No titles, labels, captions or logos in the picture.
- Sound is added later in the edit. The film is built and judged silent.

## Where it runs

- X. Video starts playing muted in the timeline.
- The film is longer than `platform.standardAccountMaxSeconds`, so it is posted from an account with long video. That is settled and is not the Builder's concern.
- The film is longer than `platform.loopsAtOrUnderSeconds`, so it does not loop. It ends with a fade.
- Each stop is also cut as its own short clip. See "Clips" below.
- The master is `formats.master`. There is no vertical version.
- The post will say this was built with Perplexity Computer. The film has to make that hard to believe.

## The viewer

- Someone scrolling who has seen a thousand space videos and scrolls past all of them.
- They stop because the first frame is the surface of a star, close enough to feel.
- They stay because every stop shows a world in more detail than they have ever seen it.
- They feel like they are inside a virtual reality flight, sitting in the camera.

## Rules for the opening

- Frame 0 is the poster frame. No fade in from black. The first frame is already a finished picture: the Sun's surface with plasma loops arching over a sunspot.
- The first `film.hookSeconds` seconds have to work muted, on a phone, at a glance.
- Something visibly moves inside the first `film.hookSeconds` seconds: the surface boils and plasma flows along the loops.

## The shape of one stop

Every stop after the Sun has the same five segments. Timings are in `segments` in the config.

| Kind | What happens | What it has to prove |
| --- | --- | --- |
| `hold` | The camera arrives and the whole body fills the frame, composed like its approved hero image. The camera drifts slowly. The body turns. Moons move | This is the world, in more detail than anyone has seen |
| `dive` | The camera drops toward the spot, fast, with real motion blur. A cover hides the handover to the terrain view | The world is a place you can go down to. Detail holds all the way in |
| `terrain` | A low flight over the spot, composed like the approved close image at its midpoint. The camera moves forward through real depth | You are there. Depth, scale, air, light |
| `rise` | The camera climbs back out through a cover until the whole body is in frame again | The two views are the same place |
| `travel` | The camera turns to open space. The next body grows from a point of light until it fills the frame | The solar system is one connected space |

## The Sun

The Sun runs in a different order, because the film opens on its surface.

| Segment | What happens |
| --- | --- |
| `sun.terrain` | Low flight over the boiling surface toward a sunspot, under plasma loops. Frame 0 is here |
| `sun.rise` | The camera pulls back and up through a flash of light until the whole Sun is in frame |
| `sun.hold` | The whole Sun, composed like its approved hero image: prominences, sunspots, corona |
| `sun.travel` | The camera turns away. Mercury grows from a dark speck in the glare |

## The ending

| Segment | What happens |
| --- | --- |
| `ending.retreat` | After Neptune's rise the camera keeps pulling away, past Triton, and turns back to face the way it came |
| `ending.lookback` | The Sun is one bright star among thousands, with the Milky Way behind it. Neptune is a thin blue crescent at the edge of frame. The camera barely moves |
| `ending.fade` | The picture fades to black. The last frame is black |

## Each stop

`kit/02-STOPS.md` gives every stop its spot, its moons, its motion and its cover. This table is the short version.

| Stop | Orbit view shows | Spot for the terrain view |
| --- | --- | --- |
| `sun` | The full disc with prominences, sunspots and corona | A sunspot under arching plasma loops |
| `mercury` | The scorched globe with the huge Sun glaring beside it | A terraced crater near the edge of night |
| `venus` | The golden globe wrapped in swirling cloud | Cloud towers and canyons with shafts of sunlight |
| `earth` | The Americas, a hurricane, aurora, city lights, the Moon | A tropical coast: turquoise shallows, sun glint, thunderheads |
| `mars` | Valles Marineris, the volcanoes, the polar cap, Phobos in front | Valles Marineris at dawn, with mist on the canyon floor |
| `jupiter` | The banded giant, the Great Red Spot, Io and its shadow | The Great Red Spot from just above the cloud tops |
| `saturn` | The globe inside wide open rings, Titan in the distance | Skimming just above the ring plane, Saturn huge behind |
| `uranus` | The cyan globe, thin rings nearly vertical, small moons | The upper haze under gleaming ring arcs |
| `neptune` | The deep blue giant, the dark storm, Triton, the Sun as a star | White cirrus streaming round the dark storm |

## Camera rules

- The film reads as one continuous shot. There is no visible cut anywhere. The only joins are inside covers, and a viewer must not be able to find them.
- The camera has mass. Starts and stops are eased. No instant change of direction or speed.
- A small seeded drift sits on top of every move, like a stabilized camera on a craft. It is never a visible shake.
- Every stop gets its own approach side, its own dive path and its own terrain move. No two stops use the same camera move back to back.
- At the midpoint of every `hold`, the frame matches the composition of that stop's approved hero image. At the midpoint of every `terrain`, the frame matches the composition of that stop's approved close image.
- The camera never passes through a body and never shows the edge of anything: no texture seam, no end of a relief, no unlit back of a billboard.
- Speed is felt through things near the camera: ring ice, dust, cloud wisps, rocks. Stars do not streak. There is no warp effect.
- Lens rules are in `kit/04-LOOK.md`.

## Light across the film

- The Sun is the only light source. Its direction is set per stop so the terminator falls where the approved hero image puts it.
- The Sun gets smaller and its glare tighter at every stop, from a wall of fire at Mercury to a bright star at Neptune.
- Exposure is set per stop so each world is well exposed. The outer planets are not dim. Changes of exposure happen during `travel`, slowly.

## Travel

- The departing body leaves frame behind the camera. It is not seen shrinking.
- The next body starts as a point of light and grows into its hero framing by the start of its `hold`.
- `mars.travel` crosses the asteroid belt: a few dark rocks tumble past close to the lens with motion blur. Sparse. It is a beat, not a field.
- Fine dust motes drift past the lens in every `travel`. They are faint.

## Clips

- Each stop is also delivered as its own clip: every segment of that stop except `travel`.
- A clip starts on the first frame of the stop's first segment and ends on the last frame of its `rise`. For the Sun it ends on the last frame of `sun.hold`. Neptune's clip ends on the last frame of `neptune.rise`.
- Clips are cut from the same frames as the film. Nothing is rendered differently for them.

## Sound hand-off

The Builder writes `cut/CUES.md`:

- A timecode for the start of every segment.
- A timecode for the center of every cover.
- A note on where music should build and where it should land, and which moments want a sound effect: plasma, the rush of a dive, the hush of each terrain view.

## Not in this film

- People, spacecraft, satellites, text of any kind.
- Pluto, the dwarf planets, comets.
- An intro of someone typing a prompt, and an end card. The team adds those in the edit with its own tools.

## What the Builder may tune

- The length of any segment, when the motion critic's notes call for it. The total stays at `film.durationSeconds` and every time stays on a whole frame.
- The keys under `cover` and `judged.fractions`.
- Every change is made in the config and logged.
- Brandon reviews the pacing from the rough cut. If he asks for timing changes they arrive as an addendum.
