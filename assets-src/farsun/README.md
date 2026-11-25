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

Both are distances of the camera from the Sun's centre in solar radii, never times. From `handover[0]` to
`handover[1]` the hold's globe gives way to the far Sun; from `wear[0]` to `wear[1]` the far Sun goes from
the hold's own law (the same map, grade, limb factor and motion as `src/stops/sun/globe.ts`) to its own.
The wear is `sqrt(1 - x)` with x the distance between the two ends: the camera leaves the Sun on an ease
and stands still at `wear[1]` (the distance where the Sun has the size it has from the next stop, one over
the sine of that stop's sunRadiusDeg), so a law that is steep in distance there is even in the film: the lit
part of the frame gains at most about 4 levels in one film frame. If that stop's radius changes, `wear[1]`
changes with it. The first part of the burn (0 to `burn.split`) follows the same share.

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
go with the burn and are nothing at burn 0. MEASURED on the approved Mercury image the contrast of the
face lies as much in the wide bands (5 to 30 px at frame 615) as in the fine ones; the look before this
one had too little in the wide bands and the face read as washed white. The tint of `keep` now puts most
of the mottle in the blue and the green, where the approved image has it (cream against white), and the
ceiling `white` is higher in the green and the blue so the limb can go as white as the approved one.
The mottle is not laid over the white of a knot: it fades out between 0.6 and 1 of the knot's light.
`keep.warm` gives the burnt face wide warm zones: where a value noise of the place on the sphere
(`warm[1]` zones across a radian, fixed to the body) climbs from `keep.warmAt[0]` to `keep.warmAt[1]`,
the face loses the share `warm[2]` of its green and `warm[3]` of its blue, times `warm[0]` and the burn.
It is a tint of the mottle that is there and draws no spot: MEASURED on the approved Mercury image the
darker quarter of the face is orange (red over green by 9.2 to 10.2 levels), where the look before was
pale (6.1 to 6.5). It is nothing at burn 0, and a look without it pays nothing (a loop of count 0).
`tight` is 1.0 where it was 2.6 and `tightColour` has less blue: the narrow light just outside the limb
was too white (MEASURED 6 to 12 levels too much blue from 1.0 to 1.09 radii), which made the limb read
soft. With less of it the body ends at a limb and the gas outside it is gold.
`knot` is the white hot knots of the active regions as the lens sees them, `at` a list (its length is the shader's bound). Each is
a light about the place `at` on the sphere (`width` in disc radii, `gain` by the exposure, zero at burn 0;
`edge` is the power of its fall, 1 a Gaussian, more than 1 a flatter core with a harder edge), which takes
the face under it to white and adds `colour` outside the body. It fades as its place goes behind the limb.
`out` is the share of that light the lens shows outside the body and `body` the share that whitens the
face (both 1 when absent). The entries with `out` 0 and no rays are the burn's own unevenness on the face,
placed by position angle and radius read off the approved Mercury image (the first by hand, blue channel,
mine against the approved in sectors of ten degrees; the later ones by a greedy fit of Gaussian patches to
the difference of the two pictures on the face after a blur of 6 px, each patch held between -1.1 and 0.8
and no narrower than 0.08 radii, so it stays mottle and is no spot): a negative `gain` leaves a patch creamier than the burnt face round
it, a positive one takes it nearer white. They move with the body, go with the exposure and are zero at
burn 0, so no patch shows at the handover or in the Sun stop's own views.
The knot of the left limb is three lights along the limb (four degrees apart, so the white zone runs along
the limb and is not a round bloom) with a wide weak patch on the face behind them.
`limb` on a knot (a cosine and a power) says the knot is a light of the limb: its light is whole while the
cosine between the outward normal at its place and the direction to the camera is under `limb[0]`, and
falls by `limb[0]` over that cosine, to the power `limb[1]`, as the body turns the place toward the
camera. A thin bright layer seen along the surface is a long path of light and seen from above a short
one. The four lights of the left limb carry it (0.2 and 3). Without it they stood on the face as a soft
white oval once the body had turned 47 degrees from the hold's view (frames 1022 to 1047, where the Sun
comes back into the frame): a knot with no `limb` is unchanged and costs nothing (a loop of count 0).
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
close on that point, a plume with a wide foot on the limb and a tip in the sky. No knot of this look is of
that kind any more. The look before this one held two (the plumes at the bottom of the approved Mercury
image), with gains of 6500 and 12000 on a cone that was all but closed: seen from the hold at Mercury they
were a soft plume, but seen from the side (frames 520 and 580 of the dive) the gain burnt the whole cone
to one white and it read as a flat triangle with straight edges and a point. They are taken out. The
light they gave at the hold comes from two low glows of the fringe (`knot` on a lobe, about position
angles 85 and 105) which are smooth from every side.
`knot.shade` is how a patch of negative gain colours the face: the darkening is mixed toward its own
luminance by the first number and scaled by the second ([0, 0] is the plain darkening), so the mottle of
the burnt face is a faint warm grey in all three colours and no yellow patch.
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
In this look the flames are dense and low (`spike` 60 and 40 over a power of 6 where it was 22 and 14 over
8, `height` 0.02 and 0.07 where it was 0.03 and 0.12): in the approved Mercury image the face runs out
into dense fine spikes that hide the edge, and the look before read as a clean pale arc with thin threads
standing off it. The three lobes at the lower left of the hold's view carry more of them (`gain` 8, 4 and
8 where it was 4, 1.5 and 4).

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
the strands). The strands are few, long and curled (`fine` 27 where it was 45 and 70 before that, `curl`
2.0 over a scale of 5, the height scale of `all` 0.075 where it was 0.06, the lobes at the lower left of
the hold's view 0.09 and 0.10): MEASURED beside the approved image its flames at the lower left are
fewer, longer and more curled than the hair of the look before. The two lobes at the bottom of the hold's
view carry taller hair and a few strands of the fringe with a longer `reach`, where the approved image
has tongues of flame; their smooth low glow is halved to make room for them. The lobe that thins the hair
under the loop is wider (10 degrees, 0.95 of the hair), so the taller hair does not stand in the loop. The hair has
a colour of its own, `hair.colour` (the fringe's if absent): a deeper orange (1, 0.36, 0.06) than the
fringe's gold, so the tongues at the lower left read orange and not pale. The strands are thicker and
closer than in the look before (`sharp` 12 where it was 20; `thick` 0.6 where it was 0.85, since strands
that are thicker sum to more light). The hair takes the fringe's exposure and share of the far look, so
it is absent at the handover and in the Sun stop's own views. The rays of the knot at the left limb are
closer too (`fine` 12 where it was 9).

MEASURED, the angle in degrees between the view through the Sun's centre and the direction `at` (the view
of the hold at Mercury), every 20th frame. It says how far round the body the camera has gone; nothing
in the picture is switched or faded by it:

| frame | angle | frame | angle | frame | angle | frame | angle |
|-------|-------|-------|-------|-------|-------|-------|-------|
| 467 | 16.8 | 627 | 1.4 | 787 | 19.5 | 947 | 37.6 |
| 487 | 14.5 | 647 | 3.6 | 807 | 21.8 | 967 | 62.0 |
| 507 | 12.2 | 667 | 5.9 | 827 | 24.0 | 987 | 62.6 |
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
behind the lens (82 to 95 degrees off its axis). With `disc` at 5 to 9 the far Sun would also be drawn
at the stops from Venus to Uranus.

## The rule at frame 615

Frame 615 is judged against `references/approved/mercury-hero.png` in the box x 1240 to 1920, y 0 to 700 of
the 1920 by 1080 frame. The number is the mean absolute difference of the two pictures in levels of 255
after a blur of 12 px: at most 4.0 in the box, at most 5 on the face (inside 0.9 radii) and on the limb (0.9
to 1.0), at most 8 in each zone of gas (1.0 to 1.1, 1.1 to 1.3, 1.3 to 1.6, beyond 1.6). The plain number is
reported and not ruled. The box does not move.

MEASURED at the draft tier with `PIL` `GaussianBlur(12)` on both pictures at 1920 by 1080, mean of the
absolute difference over the three channels: this look gives 4.35 in the box (the looks before it 4.39,
4.40, 4.07, 4.13, 4.42 and 4.57), face 2.9, limb 3.2, gas 4.8, 7.6, 4.7 and 4.5. Every zone is inside its bound.
The box is over its 4.0: the rule stands and this look does not meet it. The look of a3df7524 had 4.07
with a face of 2.0, and its face was washed white beside the approved image: the number went up by 0.33
because the face now carries mottle, and mottle that does not lie grain for grain where the approved
image has its own does not cancel under a blur of 12 px (the face adds 1.01 of the 4.40 levels where it added 0.68 of
the 4.07). The picture beside the approved image has the last word, so the mottle stays. What is left
outside the face, by the cells of the difference: the light from 1.2 to 1.3 radii about position angles
80 to 110 (the approved image has tongues of flame with body there, this look thinner hair, 13 to 16
levels too dark where it was 17 to 21), the gas from 1.3 to 1.6 radii between position angles 130 and 170
(11 levels too little blue), the bloom of the left limb at 1.3 radii (8 to 10 levels too much red and
green) and the reach of the glare at the upper left.

MEASURED on the approved Mercury image, the circle of its disc (a fit to its limb): centre 1892.1, 63.4,
radius 443.7 px of the 1920 by 1080 frame, where the sphere the far Sun is handed at the hold draws
centre 1808.6, 132.1, radius 339.6. As a true sphere in the hold's lens that is 11.69 degrees of radius
(plus or minus 0.09) where the plan hands 9.2. The far Sun draws the sphere it is handed and fakes no
circle: the size and the place belong to Mercury's plan. Every number of this section is taken on the
sphere of 9.2 degrees, with the zones on its circle. When the plan hands the larger sphere the values of
this look that are lengths beside the disc (the glare, the halo, the heights of the gas) are set again
with it, and `wear[1]` goes from 6.2546 to one over the sine of the new radius. The rays of the left limb
are still hazier and fewer than the approved image's: closer and brighter rays (`fine` 14, `gain` 70 to
110) were tried and cost 0.15 to 0.3 levels in the box and took the gas from 1.1 to 1.3 radii to its
bound of 8 and over it (8.2 and 8.3 at 110).

MEASURED, the contrast of the face by band (the standard deviation of the luminance, in levels, of the
picture split into bands of 0 to 2, 2 to 5, 5 to 12 and 12 to 30 px), at 0 to 0.5, 0.5 to 0.8, 0.8 to 0.9
and 0.9 to 0.97 radii:

| radii | approved | this look | a3df7524 |
|-------|----------|-----------|-----------------|
| 0 to 0.5 | 1.23, 1.23, 1.46, 1.77 | 1.25, 1.40, 1.47, 1.39 | 1.23, 1.17, 1.14, 1.35 |
| 0.5 to 0.8 | 1.23, 1.17, 1.20, 1.43 | 1.26, 1.34, 1.50, 1.50 | 1.42, 1.14, 1.10, 1.23 |
| 0.8 to 0.9 | 1.46, 1.23, 1.16, 1.40 | 1.18, 1.14, 1.32, 1.26 | 1.58, 1.09, 1.02, 1.37 |
| 0.9 to 0.97 | 1.45, 1.18, 1.60, 3.96 | 1.12, 1.14, 1.24, 2.91 | 1.34, 0.77, 0.88, 2.71 |

The face is still short of the approved image in the widest band at the centre and in every band from 0.9
radii to the limb. Where it is over the approved image's it is over by at most 0.30 levels (the band of 5 to 12 px at 0.5
to 0.8 radii). The mottle grows toward the limb by `limb[2]` 1.6 where it was 1.2. The mottle is not
pushed further than the approved image's: the warm zones tint what is there.

MEASURED, the colour of the darker quarter of the face (red over green, in levels) at the same four
ranges of radius: the approved image 9.2, 9.9, 10.2 and 10.2; this look 6.7, 7.9, 7.1 and 7.0; the look
before 6.1 to 6.5. The face is warmer and still short of the approved image's orange. A stronger tint
(`warm` 0.034 and 0.06 over 5.5 zones) gave 7.5, 7.7, 6.3 and 7.1 and cost 0.09 levels in the box.

MEASURED, the limb between position angles 110 and 150 (mean colour at a radius, draft tier): at 0.976
radii the approved image 252, 252, 244, this look 253, 249, 237, a3df7524 252, 248, 236; at 1.011
radii 249, 240, 211 against 251, 243, 218 (a3df7524 251, 244, 227); at 1.029 radii 244, 229, 192 against
247, 235, 202 (a3df7524 246, 236, 213); at 1.047 radii 239, 220, 179 against 243, 229, 189; at 1.082
radii 227, 202, 154 against 234, 212, 162. The dense flames that hide the edge make the first tenth of a
radius outside the limb up to 10 levels whiter than the approved image's there (the look of 12b9c5ef was
within 4 levels and read as a clean arc).

MEASURED, the colour of the loop's strands (the brightest 3 percent of the place of the loop) and of the
ground under them: the approved image 234, 211, 166 on 193, 163, 116; the look of 12b9c5ef 221, 194, 143
on 178, 151, 108. The loop's own values are unchanged in this look and it is not measured again.

MEASURED at the final tier on the look before this one (12b9c5ef, one picture, 573 s with nothing else
running): 4.39 in the box as at its draft tier; the plain number 7.77. This look is measured at the draft
tier only (plain 7.63).

## The cost

MEASURED on a machine of four cores with nothing else running, software GL, draft tier, frame 615, a fresh
page each time (seconds to the first picture, which holds the page's load and the program's link, and
seconds of the next two):

| state | first | next |
|-------|-------|------|
| d263ad28 | 106.9 | 85.4, 86.1 |
| c0a7f5ef | 116.0 | 94.8, 94.1 |
| 6f6f1229 | 60.7 | 41.4, 41.0 |
| a3df7524 | 55.0 | 35.1, 34.5 |
| 261f6dff | 57.0 | 35.7, 35.4 |

The page's load and the link are the first minus the next: about 20 s in all five. The look after 261f6dff changes values only and is not timed again alone (35 to 36 s a picture in a batch). The face of this look reads a second pattern on the sphere and the knots of the limb one more term: 0.6 to 0.9 s a picture. The gain is in the
march: a lobe's strands are computed only where its weight is not zero, a knot's march is skipped where
the ray misses its sphere, the fringe where its share is zero, a loop with no gain at all. The strands of
the fringe walk only the lobes that have strands, by a list of their numbers (`uStrandLobe`, the cut of
the engine's profile, the same bytes at 615 and 470 as the look without it). The hair is now a march of
200 steps of its own and the two cones of 256 steps are gone, which is where the rest of the gain is. The pictures of
c0a7f5ef kept their bytes under those skips (MEASURED at 615 and 616 before the look changed).

## Nothing by the pixel

The body, the gas, the knots, the rays, the glare and the halo are measured in angles and in disc radii.
Three things are counted by the pixel, and all three take the master's pixel through `bufferFrame()` of
`src/core/frame.ts`, so the 4K picture is the 16 by 9 picture and no byte moves at 16 by 9: the cover of the
disc's edge and the softness of the limb's last pixel (`uPixel`, the angle of one master pixel at the
body's distance), the fade of each grain octave and the level of the face map as a grain falls under the
pixel (the same `uPixel`), and the footprint of the hold's map (`dFdx`, `dFdy` times `uMaster`).

## wiring/

The lines the far Sun needs in files that belong to other owners, one patch per owner, made by
`sh assets-src/farsun/wiring/make.sh` against the commit of main the branch started from. Each patch starts
with the reason for every hunk. They reach main through their owners.
