# The far twin of the lab's ground: what the Sun's globe needs

Asked of the lab at 11:14 UTC, 2026-11-25 (MAIL 1048 point 2). All figures printed from the source of
agent/sun-place e6428c50 (`src/stops/sun/globe.ts`, `place.json`, `look.ts`).

## Why

From the hold the globe shows its own map (`wrap-color.jpg`, 8192 by 4096, 0.0439 degrees a texel, u = atan(x, z) /
(2 pi) + 0.5, v = asin(y) / pi + 0.5). At the place the map holds an active region of its own, about 28 by 18
degrees: a dark fibrous knot, a white plage to its lower left, combed strands round it. It is no twin of a ground
of cells with one spot and a penumbra. Under ONE BODY the globe must show, at the same coordinates, what the lab's
ground is when seen from far. The globe has the means already: square levels laid about the spot
(`place.json` plates.levels, today empty; `globe.ts` surface(), at most 4).

## The form of a level

- A square picture of N by N pixels, 8 bit, sRGB coded, PNG or JPG of quality 92 or better, N at most 4096.
- Gnomonic about the spot, north up, east to the right, seen from outside the ball. Pixel (i, j), i from the left,
  j from the top: q = ((i + 0.5) / N - 0.5, 0.5 - (j + 0.5) / N); g = q * 2 tan(W / 2), W the level's width in
  degrees; the direction on the ball d = normalize(S + g.x E + g.y Nn).
- In body axes (GROUND.md section 1): S = [0.23800208, 0.21349373, 0.94751013], E = Y x S normalized =
  [0.96987105, 0, -0.24361885], Nn = S x E = [-0.0520111, 0.97694444, -0.20706139].
- In the stage: the spot [0.107366, -0.277760, -2.447574], up [0.026656, 0.967987, 0.249582], north
  [0.006870, 0.249487, -0.968354], east [0.999621, -0.027527, 0].
- The globe blends a level into what lies under it over the outer 0.12 of its width at each edge
  (weight smoothstep(0.5, 0.38, max(|q.x|, |q.y|))).

## The levels asked for

- Level 0, the one that is needed: W = 40 degrees, N = 4096. One texel at its middle is 0.000178 radii
  (0.0102 degrees), a pixel of a 1080 frame at an eye's distance of 0.18 radii (field 55 degrees) to 0.36 radii
  (field 30 degrees). N = 2048 is enough (a pixel at 0.37 to 0.72 radii) if the ground itself stays in the picture
  to that distance.
- A level 1 (W = 12 degrees, N = 4096, a pixel at 0.05 to 0.10 radii) only if the ground gives way to the globe
  nearer than level 0 resolves.
- Outside level 0 the globe keeps its map. So that the two agree there: the set hands the ground the map and the
  turn from the map's axes to the stage (as today, GROUND.md section 4); outside the level the ground should take
  its tone at scales over about a degree from the map, and blend to its own inside by the weight above.

## What a level holds

- The ground as it is where it gives way to the globe, seen from straight above every point: the display colour
  its pass gives the picture (after its own grade, exposure 1, no vignette).
- Nothing that depends on the direction of the look: no law of the limb, no gas seen aslant, no glow at the limb.
  None of the opening flare's lights (uGlow, uLand, uKick, uFlash off). No arcade, no jets.
- The clock at 0 (the middle of the close view). What still moves at the size of a texel is better averaged over
  one life of a cell than frozen.

## What the globe does with it (the Sun builder's work)

- Level 0 shows at every distance (today a level shows only while its parent is enlarged), so the hold shows the
  twin. The frames of the hold change inside the level, frame 360 with them: at frame 269 the place stands 14.1
  degrees from the point under the eye, up and to the right (by `eye-path.json`), a quarter of the disc's radius
  from its middle.
- The level's colour goes to the picture as it is, past the globe's own grade and life; over it the law of the
  view angle. The globe's own law is light * (0.33 + 0.36 (1 - mu)) / 0.33 in linear light, mu the cosine between
  the normal and the look (`look.ts` limb).

## What the lab is asked to say

1. The law of its far hand over (the pixel size or the distance at which the ground gives way), and how far its
   ground reaches on the ball (a cap about the spot, or all of it).
2. Its law of the view angle as a formula or as a strip of 256 by 1 over mu, if it is not the globe's.
3. Whether its ground reads the globe's map outside the level.
4. The files with its NAMED: `public/assets/sun/full/place-far-0.jpg` (and `public/assets/sun/web/` at half the
   size), the script that bakes them in its folder, a row or a recipe for G11.
