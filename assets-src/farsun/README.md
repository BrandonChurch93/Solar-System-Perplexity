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

## The handover (look.json, `handover`, `wear`)

Both are distances of the camera from the Sun's centre in solar radii, never times. From `handover[0]` to
`handover[1]` the hold's globe gives way to the far Sun; from `wear[0]` to `wear[1]` the far Sun goes from
the hold's own law (the same map, grade, limb factor and motion as `src/stops/sun/globe.ts`) to its own.

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

## wiring/

The lines the far Sun needs in files that belong to other owners, one patch per owner, made by
`sh assets-src/farsun/wiring/make.sh` against the commit of main the branch started from. Each patch starts
with the reason for every hunk. They reach main through their owners.
