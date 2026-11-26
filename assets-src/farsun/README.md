# The far Sun: recipes

The far Sun (`src/space/farsun/`) is drawn from functions. It has one table and a handful of numbers; this
folder says where each comes from.

## face.ts

`python3 assets-src/farsun/make_face.py` (from the repository root) writes `src/space/farsun/face.ts` from the
approved hero's wrap of the Sun, `public/assets/sun/full/wrap-color.jpg`. The script's head says what the
table holds. Run it again whenever the wrap changes; the far Sun then follows the hero by itself.

## The limb law (look.json, `limb`)

The darkening of the disc toward its edge is the law of C. W. Allen, Astrophysical Quantities (1973),
section 81:

    I(theta) / I(0) = 1 - u - v + u cos(theta) + v cos(theta)^2

with his table of u and v by wavelength. The three colours take the rows nearest their wavelengths:

| colour | wavelength | u    | v     |
| ------ | ---------- | ---- | ----- |
| red    | 0.60 um    | 0.88 | -0.23 |
| green  | 0.55 um    | 0.93 | -0.23 |
| blue   | 0.45 um    | 0.99 | -0.17 |

The same table in code: https://sohoftp.nascom.nasa.gov/solarsoft/packages/forward/idl/FORCOMP/uv.f

## The loops (look.json, `loops`)

Each loop is `at` (the angle round the limb in the hold's view, degrees from the right, counter clockwise, and
the angle toward the camera), `span` (the angle between its feet), `turn` (the turn of the line of its feet),
`height` and `width` in solar radii and `lean` in radians. The places are read off the approved hero
(`references/approved/sun-hero.png`): the large systems stand at about 205, 30, -28 and 150 degrees.
`spinAt` is the body's turn at the moment those places are read (the middle of the handover, frame 474).
The last loops are read off the approved Mercury image (`references/approved/mercury-hero.png`): the low
ragged curl at the bottom left, a wide arch and a short strand hanging in it. `ragged` on a loop is how far
its line wobbles off the arc at full exposure (none at burn 0). `sheath` on a loop gives its strands a soft body at full
exposure (none at burn 0): its gain, its width as a multiple of the strand's, and the scale in the
body's frame of the noise that feathers it, so the loop reads as a flame with a core and not as wire. A loop may carry `gain` (its own strength, 1 if absent) and `burn` (the power of
the exposure it takes, `prominence.burn` if absent). The last loops are faint (`gain` 0.04) and take more than
the whole exposure, so they are all but absent at the handover and the exposure reveals them; the loops of the
Sun stop take a small negative power, so beside the burnt disc they sink into the glow as they do in a
camera that exposes for the ground. With the exposure the loops also grow thinner (`prominence.thin`, the
share of their width left at full exposure), break along their length (`prominence.broken`) and go pale
(`prominence.pale`, by `prominence.paleBy`): thin pale wisps in the glow, not red arches. All three are zero
at burn 0, so the loops at the handover are the hold's. They are marched in `prominence.steps` steps.
A loop is four strands about its path. `rope` on a loop is how they stand: the share of their spread that
is left (1 if absent, less than 1 nests them into one rope), and the amplitude in radii and the count of
turns with which they wind about the path, so the loop of the approved Mercury image is a dense twisted
rope and no thin arch. A loop with `gain` 0 is skipped. The count of loops in the look is the bound of the
shader's loop over them, as are the counts of lobes and of knots: a look with fewer costs less to build
and less to draw.

## The handover (look.json, `handover`, `wear`)

Both are spans of the camera's distance from the Sun's centre, never times, and no end of either is a typed
distance. Both numbers of each span are shares of the way, by the logarithm of the distance, from the
distance of the Sun stop's last view to the film's swap distance. The far end of that way is one over the
sine of `plan.light.sunRadiusDeg` of the first stop after the Sun, read from that stop's plan in `share.ts`
(`swapDistance`, the same number as `sunSwap` of `src/director/film.ts`). The near end of that way is the
film's `sunStart` (4.5741 solar radii, MEASURED). The first share, 0.1314, starts 0.046 radii above the last view,
so the Sun stop's own views keep worn 1 and the globe whole.

The film works `sunStart` out and hands it to this folder by `sunStartsAt` of `share.ts` (MAIL 886 item 1;
the hunk is in main, its reason in `wiring/film-sunstart.txt`). The look holds no stand-in for it: `spans`
throws where the film has not spoken. When the plan's radius or the Sun stop's last view changes, both
spans follow, and `spans` never puts an end beyond the swap distance (`tests/farsun-share.test.ts`).

Over `handover` the hold's globe gives way to the far Sun. `wear` is the film's law of the first part of
the burn and nothing else: `sunBurn` of `src/director/film.ts` is `burn.split` times one minus `wearShare`,
which is `(1 - x)` to the power `wear[2]`, x the distance between the two ends, and the ends are the whole
way from the Sun stop's last view to the swap (shares 0 and 1). What the far Sun wears of the Sun stop
goes by the burn alone (`wornAt`, see "The wear by the burn").

The far Sun wears the Sun stop's maps while that stop's set is there, and the engine holds it for every
frame of the travel out of the Sun (`setsForFrame`: the stop left and the next one). The wear is out at
burn `burn.worn.end[1]`, film frame 531.4, and the set leaves at 540, so no frame hangs on what the loader
holds. The test holds both.

## The burn (look.json, `burn`)

The body is one sphere and the camera's exposure for it climbs with the place of the camera, never with the
clock: `burn` goes from 0 at the start of the handover to `split` where the camera stands at Mercury's
distance from the Sun (by the logarithm of the distance from the Sun), and from `split` to 1 as the camera
closes on Mercury (by one over the distance from Mercury, which is the size of Mercury in the frame, from
where the travel changes frame to the hold's place: the camera exposes for the ground as the ground fills it). At every later stop it is 1. The exposure is `gain` to the power `burn`; the surface is
multiplied by it before the shoulder, so the face burns toward white from the centre outward while the limb
law keeps the rim darker and warmer. `gas` is the power of that exposure the chromosphere and the
prominences take. `glow`, `fall` and `colour` are the light of the burnt disc in the lens (irradiation): a
halo `glow * exp(-(fall * x)^2)` with x the distance from the limb in disc radii, grown with the exposure
and zero at burn 0.

`tight`, `tightFall` and `tightColour` are a second, narrow term of the same light,
`tight * exp(-tightFall * x)`; it is zero at burn 0 like the first. Both are light outside the body only:
they are weighted by one minus the body's cover of the pixel (and by `edge`). `white` is the ceiling of the
shoulder. The shoulder is `white * x / (x + white)` for each colour apart: it presses the contrast of the
surface evenly and never clips it, so at full exposure the red is full, the green nearly, and the blue
still carries the surface. `keep` gives back an even share of the surface's own contrast after the
shoulder: the shouldered colour is multiplied by `(detail / top)` to the power `gain * burn * tint`, where
detail is the surface's heat before the colour. That is the soft mottle of the burnt face in all three
colours, not in the blue alone. `spots.floor` is the low end of the heat at burn 0 and at burn 1: the
exposure lifts the darkest places, so no spot reads through the burn while the mottle stays. `plage` is a
wide soft brightening of the far look's face (`gain`, and `scale` its size on the sphere).
`limb` is the light of the lens over the last part of the disc: the shouldered colour goes toward the
ceiling by `limb[0] * burn * exp(-limb[1] * (1 - x))`, x the distance from the centre in disc radii. It is
measured on the approved Mercury image, where the limb is not darker than the face (blue 241 at 0.97 radii
against 228 to 233 further in): the warmth of that limb sits in the gas just outside it. It is zero at
burn 0, so the limb law is whole at the handover.
The mottle of `keep` is laid on after that light, so the limb's white does not wash it out, and its power
grows toward the limb by one plus `limb[2]` times one minus the cosine of the angle from the centre (the
bright network of the surface reads stronger toward the limb): MEASURED on the approved Mercury image the
fine contrast of the face is as high at 0.9 to 0.97 radii as at the centre.
`keep.floor` is the least heat the mottle reads, so the darkest grains of the surface do not come back as
spots when the mottle is stronger (`spots.floor` at burn 1 is raised with it). `keep.coarse` adds a wide
soft pattern to the heat the mottle reads: its strength, its cells across a radian of the sphere, and the
share of a second set 2.3 times finer. It is a value noise of the place on the sphere, fixed to the body,
and it fades where a cell is smaller than a pixel (by the angle a pixel spans, never by a count of
pixels). `keep.soft` widens the angle over which the surface's grain is read, by one plus `soft` times
the burn: the burnt face gives its finest grain to the light in the lens and keeps the mottle. All three
go with the burn and are nothing at burn 0.
The tint of `keep` now puts most
of the mottle in the blue and the green, where the approved image has it (cream against white), and the
ceiling `white` is higher in the green and the blue so the limb can go as white as the approved one.
The mottle is not laid over the white of a knot: it fades out between 0.6 and 1 of the knot's light.
`keep.warm` gives the burnt face wide warm zones: where a value noise of the place on the sphere
(`warm[1]` zones across a radian, fixed to the body) climbs from `keep.warmAt[0]` to `keep.warmAt[1]`,
the face loses the share `warm[2]` of its green and `warm[3]` of its blue, times `warm[0]` and the burn.
It tints the mottle that is there and draws no spot, and it is off now (`warm[0]` is 0).
`knot` is the white hot knots of the active regions as the lens sees them, `at` a list (its length is the shader's bound). Each is
a light about the place `at` on the sphere (`width` in disc radii, `gain` by the exposure, zero at burn 0;
`edge` is the power of its fall, 1 a Gaussian, more than 1 a flatter core with a harder edge), which takes
the face under it to white and adds `colour` outside the body. It fades as its place goes behind the limb.
`out` is the share of that light the lens shows outside the body and `body` the share that whitens the
face (both 1 when absent). The entries with `out` 0 and no rays are the burn's own unevenness on the face,
placed by position angle and radius read off the approved Mercury image: a negative `gain` leaves a patch creamier than the burnt face round
it, a positive one takes it nearer white. They move with the body, go with the exposure and are zero at
burn 0, so no patch shows at the handover or in the Sun stop's own views.
The knot of the left limb is three lights along the limb (four degrees apart, so the white zone runs along
the limb and is not a round bloom) with a wide weak patch on the face behind them.
`limb` on a knot (a cosine and a power) says the knot is a light of the limb: its light is whole while the
cosine between the outward normal at its place and the direction to the camera is under `limb[0]`, and
falls by `limb[0]` over that cosine, to the power `limb[1]`, as the body turns the place toward the
camera. A thin bright layer seen along the surface is a long path of light and seen from above a short
one. The four lights of the left limb carry it (0.2 and 3);
a knot with no `limb` is unchanged and costs nothing (a loop of count 0).
The patches of positive gain on the face are at 0.7 of their fitted strength, so the mottle stands
through them. The middle one carries
the tuft (short rays kept to a narrow cone), the one at 193 a few long thin streamers of low gain and a long
`reach`, so the light between the body and Mercury is strands with dark between them and less of it is the
even light of the lens (`glare.wide` 0.6; `glare.end` cuts the wide term further out, it is divided by
one plus `end` times the square of the distance, so the sky beyond about 1.1 radii stays dark and keeps its
stars). `burn.limb` is kept weak and wide (0.5 over an eighth of a
radius), so the limb whitens softly and is not a white band. `knot.clump` gathers the rays into uneven groups and bends them: strength of the grouping,
the scale of the groups against `fine`, and the bend of a ray's direction with its distance from the knot.
`burn.white` is the colour the burnt face rolls off to, and `glare.colour` the lens light round the body;
both were read off the same image (the face keeps blue near 0.9 of red, the glare is paler than the gas).
`rays` is the burst of straight rays from the knot: the gas is marched in `knot.steps` steps inside a sphere
of `radius` radii round the knot's place in the body's frame, and a point is lit by the direction from the
knot to it, where a value noise of that direction is high (`fine` rays across a radian, `sharp` their
thinness, a second finer set at half the strength). The rays fall off with the distance over `reach`, which
a slower noise of the direction varies from about a third to one and two thirds, so they are uneven in
length and in brightness; `cone` keeps them to a cone about the outward normal (0 is none), and they fade to
nothing at the sphere's edge. Their `gain` goes with the exposure and is zero at burn 0. They are in the
body's frame, so they turn with the body and have depth round it; nothing of them is a picture.
`rays.axis` on a knot is the axis of the cone of its rays, a place on the sphere as `at` (the knot's own
place if absent), and `rays.from` the distance from the centre, in radii, of the point the rays spread from
(1 if absent): with an axis that leans along the limb and a source under the surface the rays are a
streamer that leans one way and narrows, as the one at the bottom of the approved Mercury image does, not
a burst that stands on the normal. The knot is still hidden by its own place going behind the limb.
With `from` above 1 the point stands outside the body and the axis looks back at the limb: the rays then
close on that point, a plume with a wide foot on the limb and a tip in the sky.
`knot.shade` and `knot.shadeColour` colour a patch of negative gain (see the look after batch 9).
`body.bright` is the body's own gain at the near and the far end of the wear.
`desat` is the range of luminance over which a gas colour loses its hue toward white, as a film does when
every layer is full, in the measure of the burn (none at burn 0, so the loops keep the hold's red at the
handover): it is one function for the chromosphere, the loops and the fringe. The face does not take it.
`chromosphere.burn` is the power of the gas exposure the chromosphere takes, under 1 so the thin shell does
not draw a white line round the burnt limb. The corona does not take the exposure: it stays at times 1.
`corona.rim` is the colour of the lowest corona, up to `corona.rimTop` radii over the surface, where it
goes over to `corona.near`: the deep orange of the hold's globe just outside its limb (0.80, 0.28, 0.10
linear at 1.00 to 1.01 radii in the proof at frame 472).
`hide` is the range, in disc radii from the centre, over which the pass covers what is drawn behind it once
the burn passes one half: nothing behind a burnt Sun is seen through its light.

## The fringe (look.json, `fringe`)

A dim layer of fine flames all round the limb, part of the same body: it is marched in the body's frame
between the surface and `top` radii in `steps` steps (128: fewer draw bands; each ray starts its steps at an
offset hashed from the place on the sphere nearest to it, so the offset turns with the body and does not
sit on the screen), its flames stand where a value noise of the direction on the sphere is high (`scale`),
lean with height (`lean`), fall off with the height over `height` (low and high places) and fade to nothing
over the upper half of the shell.
It takes the same exposure as the loops, and it belongs to the far look: its strength goes with one minus
the wear, like the body's own white heat, so it is absent at the start of the handover (the proof at frame
472) and whole from `wear[1]` on. `lobes` are places on the sphere (`at` as for the loops, `width` in
degrees) where the flames are `gain` times stronger and `tall` times taller: the active region at the left
limb of the approved Mercury image (its two sides, its middle and its long faint rays) and the short fan at
the bottom. From a lobe stand thin strands (`strands` their strength, `reach` their height scale in radii,
which a noise of the foot varies from about a third to one and two thirds, so the rays are uneven in
length) that spread with height (`strand.fan`; `strand.fine` their count across a radian, `strand.sharp`
their thinness): each point of a strand is read at the foot it comes from, nearer the middle of the lobe.
`knot` on a lobe is a smooth low glow at its foot: strength, width in degrees and height scale in radii.
The count of lobes is the look's; two of them carry only such a glow, wide and low, about position angles 138
and 195 of the hold's view. A negative `tall` keeps a lobe's flames short.
A lobe with a negative `gain` thins the flames about its place (under the curl at the bottom, where the
approved image is dark between the strands).
The second angle of a lobe is the place of the limb in the hold's view at Mercury (about -4 degrees at the
left, +9 at the bottom), so the lobe stands on the limb there.

`way` is the side the hair leans to round the disc: the strands are bent along the limb by `way[0]` times
the height and by `way[1]` times its square (a curl), about the axis `hair.at`, so the tufts of the limb
lean one way as the approved ones do. Both are angles on the sphere, zero if absent.

`spike` is the strength of the two scales of the marched flames and their power (the thinness of the
places where they stand): lower strengths leave less of a smooth haze just outside the limb.
In the approved Mercury image the face runs out into dense fine spikes that hide the edge, so the flames
are dense and low.

`hair` is the distinct fine strands of the limb. It is a function of the place in three dimensions,
fixed in the body's frame, and it is drawn by a short march of its own along the ray: `steps` equal steps
through the shell from the surface to `top` radii above it, begun at the same body fixed offset as the
fringe's march. No plane and no layer is in it, so every angle of the camera reads the same hair and
nothing is taken away by the angle. A strand is a thin radial column: `fine` is the count of strands
across a radian of the sphere, `sharp` their thinness and their sparseness together (a ray along the limb
passes some fifty columns, so only a sparse field stays distinct and does not sum to a haze), `thick`
the light per radius of path, `fan` how far the strands close on the middle of their lobe with height,
`curl` their bend (strength by height, scale on the sphere, change with height), `way` their lean with
height about the axis `at` (the tufts lean one way round the disc). `tuft` adds a coarser family: its
gain, its count as a share of `fine`, and its height as a multiple of the fine strands' height. `all`
is the hair of the whole sphere (strength and height scale in radii), so every limb the camera can see
carries it; a lobe adds its own by `hair` (strength and height scale). A lobe with a negative strength
thins the hair about its place by that share (under the loop, where the approved image is dark between
the strands). The strands are few, long and curled (`fine` 27, `curl` 2.0 over a scale of 5,
the height scale of `all` 0.075). The two lobes at the bottom of the hold's
view carry taller hair and a few strands of the fringe with a longer `reach`, where the approved image
has tongues of flame; their smooth low glow is halved to make room for them. The lobe that thins the hair
under the loop is wider (10 degrees, 0.95 of the hair), so the taller hair does not stand in the loop. The hair has
a colour of its own, `hair.colour` (the fringe's if absent): a deeper orange (1, 0.36, 0.06) than the
fringe's gold, so the tongues at the lower left read orange and not pale. The hair takes the fringe's exposure and share of the far look, so
it is absent at the handover and in the Sun stop's own views.

MEASURED, the angle in degrees between the view through the Sun's centre and the direction `at` (the view
of the hold at Mercury), every 20th frame. It says how far round the body the camera has gone; nothing
in the picture is switched or faded by it:

| frame | angle | frame | angle | frame | angle | frame | angle |
|-------|-------|-------|-------|-------|-------|-------|-------|
| 467 | 16.8 | 627 | 1.4 | 787 | 19.5 | 947 | 37.6 |
| 487 | 14.5 | 647 | 3.6 | 807 | 21.8 | 967 | 62.0 |
| 527 | 10.0 | 687 | 8.2 | 847 | 26.3 | 1007 | 52.3 |
| 547 | 7.7 | 707 | 7.6 | 867 | 28.6 | 1027 | 46.9 |
| 567 | 5.4 | 727 | 12.9 | 887 | 30.8 | 1047 | 49.0 |
| 587 | 3.2 | 747 | 25.4 | 907 | 33.1 | 1067 | 51.2 |
| 607 | 0.9 | 767 | 25.3 | 927 | 35.4 | 1087 | 53.5 |

## Where it is drawn

`disc` is the radius of the Sun's disc in the lens, in master pixels of the 1920 by 1080 frame (an angle
times the lens, never a count of device pixels), from which the far Sun stands in for the sky's own Sun:
none below `disc[0]`, whole from `disc[1]`. It is 80 to 130: the Sun of the travel from the Sun and of
Mercury is 151 and more, the Sun of every later stop 63 and less, so from Venus on the sky draws its own
Sun and those frames keep main's bytes. The change falls in the travel from Mercury while the Sun is
behind the lens (82 to 95 degrees off its axis).

## The rule at frame 615

Frame 615 is judged against `references/approved/mercury-hero.png` in the box x 1240 to 1920, y 0 to 700 of
the 1920 by 1080 frame. The number is the mean absolute difference of the two pictures in levels of 255
after a blur of 12 px: at most 4.0 in the box, at most 5 on the face (inside 0.9 radii) and on the limb (0.9
to 1.0), at most 8 in each zone of gas (1.0 to 1.1, 1.1 to 1.3, 1.3 to 1.6, beyond 1.6). The plain number is
reported and not ruled. The box does not move.

The measure is `PIL` `GaussianBlur(12)` on both pictures at 1920 by 1080, the mean of the absolute
difference over the three channels. MEASURED now at the final tier: 2.57 in the box, every zone inside its
bound (see "hold.ts, the map of place").

## The sphere of 11.69 degrees

MEASURED on the approved Mercury image, the circle of its disc (a fit to its limb): centre 1892.1, 63.4,
radius 443.7 px of the 1920 by 1080 frame. As a true sphere in the hold's lens that is 11.69 degrees of radius (plus or minus 0.09).
Mercury's plan hands that sphere from a4f61cec on (`plan.light.sunRadiusDeg` 11.69 and `sunDir`; the centre
projects to 1925.7, 46.0 at 615). The far Sun draws the sphere it is handed and fakes no circle: the size
and the place belong to Mercury's plan, and this look was set again on the larger sphere. Every number
above this section is taken on the sphere of 9.2 degrees with the zones on its circle; the numbers of this
section are taken on the larger sphere with the zones on the approved circle.

The mottle is not
pushed further than the approved image's: the warm zones tint what is there.

## The look after the final cut of batch 9 (MAIL 882, 886 and 908)

What changed in the body's law, each by an angle or a radius and none by the pixel:

- The face is flattened before its mottle is drawn (`spots.flat`: amount, level of the face table, mean).
  The fine heat is divided by the face table read at a coarse level, so the broad fields of the table no
  longer come back as yellow patches and the mottle stands on an even ground. `plage.gain` is 0 (both at
  full burn only, see "One body at the seam"),
  `keep.warm` is off, `keep.coarse` is weaker (0.25), `keep.gain` 0.14 over a floor of 0.8.
- A dark knot shades with a colour and not with grey (`knot.shadeColour`, `knot.shade`: share of the colour,
  strength). MEASURED on the approved image: where its face is darker, red falls 0.09 and green 0.36 of
  what blue falls, so its mottle is peach on cream and never grey or lemon. The shade takes that ratio.
- The 50 knots of the face are found by `fit/knotfit.py` on the present sphere (width 0.09 radii, 35 of them dark, gains from -0.9 to
  0.8). The six knots of the limb's burst and bloom stay. The knots are a loop bound that the look sets.
- The tongue of the lower limb is a tube with body (`fringe.tongues`: foot, tip and height, width, gain,
  taper, strands), an analytic law of the ray and the tube's axis.
- The corona has streamers by position (`corona.streamers`: place on the limb, width in degrees, gain,
  scale height in radii; `corona.streamerRays` is the share of the streamer that carries the corona's rays).
  Two stand at position angles 137 and 184 with small gains (0.12 and 0.2).
- The tongue's tube ends below its foot as it ends at its tip.
- The tongue fades toward its tip and is cut into strands (`fringe.tongues[0].fade` 0.8, `strand` 0.9).
## hold.ts, the map of place (MAIL 979)

A law that does not place each ray stops near 4.3 at frame 615. `src/space/farsun/hold.ts` is a small
table that says where a patch of the face and a ray of the gas stand and how strong, in the frame of the far
Sun as Mercury's hold sees it. The law keeps every grain: the table is read between its texels and holds
nothing finer than its pitch. It is in code, as `face.ts` is, so no frame waits for a file.

`python3 assets-src/farsun/make_hold.py` writes it; the script's head says what the two channels hold and
which inputs it reads (the approved Mercury image, read only, and renders of frame 615 of this folder at
the draft tier, `npm run still -- --frame 615 --tier draft`). `fit/holdframe.mts` prints the eye and the
axes of that frame from the film (`npx tsx assets-src/farsun/fit/holdframe.mts 615`), which is the
`--frame` file of the script.

- The frame. The eye of the middle of Mercury's hold, in the body's frame at the turn `spinAt`: 4.9354
  radii from the centre, which is the film's swap distance. `tests/farsun-share.test.ts` holds the table's
  eye to the film's within 0.002 radii, so a hold that moves turns the test red.
- The face (channel 0) is read on the sphere at the place the hold's eye sees a point of the surface,
  across the hold's line to the centre with the limb at radius 1. It is added to the mark of the knots:
  over 0 a glint toward white, under 0 the knots' peach shade. It fades where the surface turns away from
  the hold's eye (`hold.edge`, the cosine from and to), so nothing of it is smeared along the body.
- The gas (channel 1) is read in space by the turn about the hold's line and the distance from the centre:
  a ray of the table is a sheet that stands on the body along a radius, and it fades with the lean of a
  point out of the hold's plane of sky (`hold.depth`, the sine of the lean at which it has fallen to 1 / e).
  It is a gain in stops on the corona, the fringe, the hair, the tongue, the rays of the knots and the
  chromosphere. The loops take `hold.loops` of it and this look sets 0: with the gain on them the loop of
  the lower limb lost its strands where the approved loop stands a few pixels beside them.
- Both go with the exposure as the knots do (the share of the burn's gain above 1), and the gas also with
  one minus the wear. So the table is nothing at burn 0: the Sun stop's views and the start of the
  handover keep their bytes, and the map grows in with the burn along the flight from 474 on.
- It belongs to the body. Its frame turns with the body's spin, and no term of it reads the clock.
- `hold.face` and `hold.gas` are the strengths. The table was fitted at 1 and 1; `hold.gas` is 1.35 so
  the rays of the upper left have the approved image's contrast.

The takes (`assets.maxTakesPerAsset` is 6, and 6 were made in this phase; the rejected ones stay under
`out/work/farsun-hold/`). Each take is one pass of `make_hold.py step` on the render of the take before,
so a finer pitch starts from the coarser table. Four renders with flat tables (face +0.5 and -0.5, gas +1
and -1) gave the slopes; they measure and are no takes. MEASURED at 615, draft tier, the box x 1240 to
1920, y 0 to 700, blur 12 px:

| take | pitch | box | face | limb | gas 1.0 to 1.1 | 1.1 to 1.3 | 1.3 to 1.6 | beyond 1.6 |
|------|-------|-----|------|------|----------------|------------|------------|------------|
| none (96a7a7ee) | | 4.33 | 2.7 | 3.4 | 7.0 | 7.6 | 4.3 | 2.8 |
| 1 | 40 px | 3.35 | 2.5 | 2.8 | 4.6 | 4.9 | 3.5 | 2.7 |
| 2 | 40 px | 3.00 | 2.4 | 2.4 | 3.7 | 4.1 | 3.2 | 2.6 |
| 3 | 20 px | 2.64 | 2.1 | 1.9 | 2.8 | 3.5 | 3.0 | 2.6 |
| 4 | 20 px | 2.45 | 1.9 | 1.7 | 2.3 | 3.2 | 3.0 | 2.5 |
| 5 | 12 px | 2.29 | 1.6 | 1.4 | 2.0 | 3.1 | 2.9 | 2.5 |
| 6 | 12 px, kept | 2.21 | 1.5 | 1.3 | 1.8 | 3.0 | 2.9 | 2.5 |

The table of
12 px gains 0.79 on the table of 40 px and is kept (93 by 89 texels, two bytes each).

MEASURED at 615, final tier, with `hold.gas` 1.35 and `hold.loops` 0: the box 2.57 (96a7a7ee 4.34); the
face 1.5, the limb 1.3, the gas 3.0, 3.7 and 3.5, beyond 1.6 radii 2.5; spike contrast of the upper left
11.1 (the approved image 11.0, 96a7a7ee 7.9).

What the table can not do: it is one number for the face and one for the gas, so it moves no hue. The gas
from 1.1 to 1.3 radii stays 3 to 4 levels short of red and the gas from 1.3 to 1.6 radii 2 levels over in
red and green; the face stays 1.5 to 2 levels over in red and green.

## One body at the seam (MAIL 1002)

The flight away from the Sun stop shows the stop's own globe until the far Sun stands in for it: the far
Sun's share is 0 up to frame 470, 0.18 at 474, 0.89 at 480 and 1 from 483 on, and the stop's globe has
gone at 484 (shares of the way by distance, never frames; the frames are where the film's path puts
them). The spots and the bright regions of the stop's face may not go out while the share runs, so
the three laws that flatten the burnt face (`spots.flat`, `spots.power`, `plage.gain`) go with the
exposure after the handover, not before. `faceLaw` in `farsun.ts`
takes the burn; up to `burn.split` (0.2, the exposure the film reaches where the handover ends) the
face is the stop's (`spots.power[0]`, `plage.gain[0]`, no flattening), and from there to burn 1 it goes
evenly to the burnt look (`spots.power[1]`, `plage.gain[1]`, `spots.flat[0]`). `tests/farsun-share.test.ts` holds it: at 471, 475, 480, 484, 485, 495 and 500
the flattening is 0 and the power and the plage are the stop's.

A thing the stop stands on the body (the arcade the set lends in `gas.arcade`) is the stop's drawable and
is drawn once in a frame: by the stop's globe while the far Sun's share is under 1, by the far Sun from
there on. The far Sun takes it into `carry`, which sits at the body's place and turn, and `render` draws
`carry` after the body through the view's camera, with the camera's near and far set round the Sun for
that one draw (the distance less and plus `look.reach`) and put back after: the film's near plane stands
behind the Sun's near side for a stretch of the flight (4 against 3.97, read at frames 490 and 500), and a
drawable cut by it would leave by distance while it can be seen (MAIL 1070). The depth range of that
draw is 0 to 0, so no depth left in the target stands in front of it. Its strength is the wear's, and it
is gone with the wear or under its own size, never by a frame. With no arcade lent, nothing of this runs.
`tests/farsun-share.test.ts` holds it in a WebGL2 browser: a dark stand-in of the chromosphere's height
at the stop's spot, drawn by the far Sun in every frame from the end of the handover while the spot is
in the frame, must darken more than half its own disc of lit pixels, and the camera must leave with the
near and far it came with.

## The wear by the burn (MAIL 1017, 1027 and 1043)

The share shows nothing and the burn does the bleaching.

- At burn 0 the far Sun is the Sun stop's globe. The face is the stop's own map and law (`uWear` 1). The
  gas goes by `from(near, own)` in `farsun.ts`, which is `own` to the bit where the wear is 0: the corona's
  gain, scale heights and colours (`corona.worn`), the loops' gain and width (`prominence.worn`) and their
  colour (`prominence.wornHot`, the red of the stop's prominences where the far look's are pale).
- `wornAt(burn)` is the wear, by the burn alone: 1 at burn 0, `burn.worn.at` (0.85) at `burn.split`, then
  down by `fall[0]` with the power `ease[1]` and by `fall[1]` with the power `ease[2]` of the rest of the
  burn, and out between burns `end[0]` and `end[1]` (0.9 and 0.99). It has no step and never rises.
- The burn is the film's (`sunBurn` of `src/director/film.ts`), a law of the place and never of the clock:
  from 0 to `burn.split` by the distance from the Sun stop's last view to the swap distance (film frames
  461 to 487), still while the camera turns to Mercury (487 to 503), and from `burn.split` to 1 by the
  inverse distance to Mercury (504 to 538, the travel's pull).
- At burn 1 the wear is 0 and every law gives the numbers of 47c2ef0d.
- No frame hangs on what is loaded: MEASURED on previews, 495 and 520 on a fresh page each are the bytes
  of the same frames drawn in a run from 440.

MEASURED at 455 (burn 0), drafts of 1920 px, the stop's globe against the far Sun forced to share 1
(`?farsun=far`), the face inside 0.7 radii, detail as the spread of the level after a blur of 12 px is
taken out: 186.4 106.0 45.8 and 29.72 against 186.6 106.5 46.3 and 29.57 (0.5 percent less). Any mix of
the two holds the mean within 0.5 levels a channel and the detail within 0.5 percent, so the share shows
nothing on the face.

The gas at burn 0 is the stop's too (MAIL 1065): the Sun is one body at every distance and the stop's corona
and prominences are the judged ones, so the far Sun wears them as it wears the face map. The set lends
them with the map (`gas` of `FarSunHold`, see `wiring/sun-gas.txt`): its corona picture and `look.corona`,
its prominence picture, flow map and `look.prominence`, and the globe's turn. The far Sun draws them by
the ray with the stop's own laws and the stop's own time (film time less `plan.holdMid`):
the corona by the ray's least distance from the centre and its angle round the disc in the set's frame,
the prominences as the stop's card, hidden where the sphere stands in front (the test holds the stop's
lines of time word for word).

Their weight is the wear (`uWear * uGasOn`) and the far look's own gas has one minus it, so the bleaching
is still the burn's alone. Without the field (the hunk not applied) the far Sun keeps its own gas, fitted
by `corona.worn`, `prominence.worn` and `prominence.wornHot` as before.

MEASURED at 455 (burn 0), drafts, the stop's globe against the far Sun forced to share 1, mean difference
after a blur of 6 px in the rings to 1.1, 1.3 and 1.6 radii: 1.1, 3.0 and 6.2 levels, where the far look's
own gas gave 29.7, 27.8 and 16.4. What is left from 1.3 radii out is the sky and not the gas: the stop's
sky card against the film's sky (the means differ by 4 to 6 levels there and by 0.1 to 0.6 at the rim).
MEASURED on previews in the handover, the film's frame against the stop's globe forced to stay
(`?farsun=globe`), the same three rings: 0.9, 0.5 and 0.2 at 475; 2.5, 2.0 and 1.1 at 480; 5.9, 3.4 and
1.8 at 485, which is one minus the wear of the far look's gas and the burn's light on the limb. Against
465 at the same place on the body the film gives 12, 11 and 6 at 475, 19, 18 and 10 at 480, 22, 23 and
14 at 485, and the stop's own globe forced to stay gives the same to 0.9 levels: that is the flight (the
card turns with the body, the corona does not, the eye moves), not a second body.

MEASURED on previews of 960 by 540, the face inside 0.75 radii, luminance in levels; the bands are the
spread of the difference of two blurs (8 and 40 px, 40 and 160 px, in pixels of the master frame):

| frame | far Sun's share | burn | mean | R G B | band 8 to 40 | band 40 to 160 |
|-------|-----------------|------|------|-------|--------------|----------------|
| 470 | 0.00 | 0.019 | 121.0 | 187 109 49 | 19.0 | 14.2 |
| 495 | 1.00 | 0.200 | 160.3 | 211 153 81 | 13.6 | 10.3 |
| 540 | 1.00 | 1.000 | 248.6 | 253 249 231 | 1.5 | 1.1 |

The largest change of the mean in one film frame is 4.9 levels on the Sun's side (479 to 481) and 5.6 on
Mercury's side (515 to 517). At twice the film's rate (previews at every half frame from 460 to 500,
with the stop's gas worn) it is 2.51 levels a half frame (479.5 to 480): there is
no step. In the ring 1.1 to 1.3 radii it is 2.50 at 494, where the brightest of the ring leaves the frame.

## The cost

MEASURED on a machine of four cores with nothing else running, software GL, draft tier, frame 615, a fresh
page: 57.0 s to the first picture, of which about 20 s are the page's load and the
program's link, and 35.7 and 35.4 s for the next two. The gain is in the
march: a lobe's strands are computed only where its weight is not zero, a knot's march is skipped where
the ray misses its sphere, the fringe where its share is zero, a loop with no gain at all. The strands of
the fringe walk only the lobes that have strands, by a list of their numbers (`uStrandLobe`).

## Nothing by the pixel

The body, the gas, the knots, the rays, the glare and the halo are measured in angles and in disc radii.
Three things are counted by the pixel, and all three take the master's pixel through `bufferFrame()` of
`src/core/frame.ts`, so the 4K picture is the 16 by 9 picture and no byte moves at 16 by 9: the cover of the
disc's edge and the softness of the limb's last pixel (`uPixel`, the angle of one master pixel at the
body's distance), the fade of each grain octave and the level of the face map as a grain falls under the
pixel (the same `uPixel`), and the footprint of the hold's map (`dFdx`, `dFdy` times `uMaster`).

## fit/

`knotfit.py` finds the fitted knots of the face (its head says how and with which numbers) and `geopx.mts`
turns pixels of frame 615 into the body's longitude and latitude with the film's own camera. They are
tools of the recipe and no part of a frame.

## wiring/

The lines the far Sun needs in files that belong to other owners, one patch per owner, made by
`sh assets-src/farsun/wiring/make.sh` against the commit of main the branch started from. Each patch starts
with the reason for every hunk. They reach main through their owners.

The patches of the travel, the Sun, Mercury and the film's `sunStart` are in main and are no longer kept.
Their reasons stay beside (`travel.txt`, `sun.txt`, `mercury.txt`, `film-sunstart.txt`).
`sun-gas.patch` (the stop's corona and prominences lent to the far Sun) and
`film-truesun.patch` are not in main yet and stay. The last takes the ride with the stars out of the film
(MAIL 1113 and 1119): in a dive and a rise the far Sun stands at `sun.dir` and its body keeps its place
while the sky turns. The test holds it at every half frame and is red until the hunk is on `film.ts`.
`sky-sample.patch` (MAIL 1176 and 1195) hands the sky the orientation of the sample of the shutter it
draws, beside the one of the middle that the stars keep, and the sky turns its camera to it for the far
Sun's set and draw alone. So the body, its corona, loops, rays and lens light are drawn where each sample
sees them, and a turn smears them along their own path as it smears every body of the world's pass; the
stars are the stated exception and stay at the middle. A frame of one sample keeps its bytes. At a hold
the body takes the blur of the camera's own drift (0.4 px either side of the middle at Mercury), as the
planet beside it does. One test holds the sky's half (the far Sun's camera is the sample's, the stars'
is the middle's, and without the argument both are the middle's). A second holds the engine's half
(MAIL 1263): the engine's own `renderSample` is run on a stand-in engine with no set, twice for one
frame with two sky orientations and one middle, and the far Sun has to be set through each sample's own.
Both are red until the hunk is laid, and the second is red with either half alone.
