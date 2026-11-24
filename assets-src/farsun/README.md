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
its line wobbles off the arc at full exposure (none at burn 0). A loop may carry `gain` (its own strength, 1 if absent) and `burn` (the power of
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
the limb and is not a round bloom) with a wide weak patch on the face behind them. The middle one carries
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
close on that point, a plume with a wide foot on the limb and a tip in the sky. The depth of gas along the
eye grows with the distance from the point, and the rays are also weighted by the square of that distance
over `from` minus 1 (no more than 1), so the plume is bright at its foot and thins to nothing before its
tip: no hard point is drawn. The two plumes at the bottom of the approved Mercury image are such knots
(the last two of the list): their feet, tips and lean are read off that image by position angle and
radius. They are gas in the body's frame, marched like the other rays, and turn with the body.
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
the height and by `way[1]` times its square (a curl), about the layers' normal, so the tufts of the limb
lean one way as the approved ones do. Both are angles on the sphere, zero if absent.

`spike` is the strength of the two scales of the marched flames and their power (the thinness of the
places where they stand): lower strengths leave less of a smooth haze just outside the limb.

`hair` is the distinct fine strands of the limb. A march through a volume of thin strands adds many of
them along each line of sight and the sum is a haze, so the hair is not marched: it stands on three flat
layers fixed in the body's frame, parallel, `lay` radii apart, their normal the place `at` on the sphere
and the middle one `lift` radii from the centre (0: it is the plane of the limb as the hold at Mercury
sees it, with one layer a quarter of a radius in front of it and one behind). Each ray meets each layer once and reads the strands there, so a strand is one line and the
three layers pass each other as the body turns. `thick` is the depth of gas a layer stands for, `fine`
the count of strands across a radian, `sharp` their thinness, `fan` how far they close on the middle of
their lobe with height (a tuft), `curl` their bend (strength by height, scale on the sphere, change with
height). A lobe carries hair by `hair`: strength and height scale in radii. The pattern is read at the
place in the layer, not along the line of sight, so it holds still as the body turns under the camera.
The hair takes the fringe's colour, exposure and share of the far look, so it is absent at the handover
and in the Sun stop's own views. It is three layers and not a volume: seen far from the layers' normal it
would foreshorten into sheets. `see` keeps that from the eye by the angle alone, never by the time: the
hair is whole while the view stands within `see[1]` degrees of the normal and gone beyond `see[0]`
(45 and 26), a smoothstep of the cosine between them.

MEASURED, the angle in degrees between the view through the Sun's centre and that normal, every 20th frame
(the layers' place is unchanged since the look before, so the table holds for both):

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

It passes 25 degrees in two ranges with the Sun in the frame. From 746 to 761 it is 25.0 to 26.2 degrees
(26.2 at 753 to 756, MEASURED every third frame): the hair is still whole there, `see` starts at 26. From
978 to 1067 it is 47 to 63 degrees: `see` has taken the hair away, so no sheet is drawn, and the limb of
those frames is the marched fringe and the rays. From 762 to 977 and at 1087 the Sun is out of the frame.

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
absolute difference over the three channels: this look gives 4.17 in the box (the look before it 4.42, the
one before that 4.57), face 2.1, limb 3.1, gas 5.0, 7.7, 5.1 and 4.5. Every zone is inside its bound. The
box is over its 4.0: the rule stands and this look does not meet it yet. What is left is the form of the
light from 1.1 to 1.3 radii (the left flank of the streamer's root and a second thin tuft beside it are
missing, the gas from 1.3 to 1.6 is a little too warm) and the reach of the glare at the upper left.

## The cost

MEASURED on a machine of four cores with nothing else running, software GL, draft tier, frame 615, a fresh
page each time (seconds to the first picture, which holds the page's load and the program's link, and
seconds of the next two):

| state | first | next |
|-------|-------|------|
| d263ad28 | 106.9 | 85.4, 86.1 |
| c0a7f5ef | 116.0 | 94.8, 94.1 |
| this look | 58.0 | 37.8, 37.4 |

The page's load and the link are the first minus the next: about 21 s in all three. The gain is in the
march: a lobe's strands are computed only where its weight is not zero, a knot's march is skipped where
the ray misses its sphere, the fringe where its share is zero, a loop with no gain at all. The pictures of
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
