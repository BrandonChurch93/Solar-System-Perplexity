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
The last four loops are read off the approved Mercury image (`references/approved/mercury-hero.png`): the
flames of the active region at the left limb and the low loop at the bottom left. They stand behind the limb
of the Sun stop's view (their second angle is negative by more than their height can clear, so the body
hides them up to the handover) and the body's own turn brings them over the limb on the way to Mercury.

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
they are weighted by one minus the body's cover of the pixel (and by `edge`), so they never lie over the
limb and the limb law is seen to the edge. `white` is the ceiling of the shoulder. The shoulder is
`white * x / (x + white)` for each colour apart: it presses the contrast of the surface evenly and never
clips it, so at full exposure the red is full, the green nearly, and the blue still carries the whole
surface. That is the soft warm mottle of the burnt face, and the limb, darker by the limb law, stays warm.
`body.bright` is the body's own gain at the near and the far end of the wear.
`desat` is the range of luminance over which a gas colour loses its hue toward white, as a film does when
every layer is full, in the measure of the burn (none at burn 0, so the loops keep the hold's red at the
handover): it is one function for the chromosphere, the loops and the fringe. The face does not take it.
`chromosphere.burn` is the power of the gas exposure the chromosphere takes, under 1 so the thin shell does
not draw a white line round the burnt limb. The corona does not take the exposure: it stays at times 1.
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
472) and whole from `wear[1]` on. `lobe` is one place on the sphere (`at` as for the loops, `width` in
degrees) where the flames are `gain` times stronger and `tall` times taller: the active region at the left
limb of the approved Mercury image. From it stand thin strands (`strands` their strength, `fine` their
count across a radian, `sharp` their thinness, `reach` their height scale in radii) that spread with height
(`fan`): each point of a strand is read at the foot it comes from, nearer the middle of the region.

## The rule at frame 615

Frame 615 is judged against `references/approved/mercury-hero.png` in the box x 1240 to 1920, y 0 to 700 of
the 1920 by 1080 frame. The number is the mean absolute difference of the two pictures in levels of 255
after a blur of 12 px: at most 4.0 in the box, at most 5 on the face (inside 0.9 radii) and on the limb (0.9
to 1.0), at most 8 in each zone of gas (1.0 to 1.1, 1.1 to 1.3, 1.3 to 1.6, beyond 1.6). The plain number is
reported and not ruled. The box does not move.

## wiring/

The lines the far Sun needs in files that belong to other owners, one patch per owner, made by
`sh assets-src/farsun/wiring/make.sh` against the commit of main the branch started from. Each patch starts
with the reason for every hunk. They reach main through their owners.
