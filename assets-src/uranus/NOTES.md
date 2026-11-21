# Uranus notebook

Stop agent for `uranus`, branch `agent/uranus`, looks on `agent/uranus-looks`. Parent is `/root` (message with `message_agent`, never wait for a reply).
After a compaction: read `assets-src/shared/STOP-AGENT.md`, then this file.

## Fixed facts

- Frames: hold 3960 to 4109 (judged 4035), dive 4110 to 4199 (judged 4137), terrain 4200 to 4379 (judged 4290), rise 4380 to 4454 (judged 4436). Travel is not mine.
- Tiers: draft 1/1, review 4/16, final 16/64 samples. Judged stills at `final`, master 1920 x 1080, `full` assets.
- Budgets: texture memory full 1400 MB, web 450 MB, disk full 150 MB, web 40 MB, 6 takes per asset.
- Approved images are 2816 x 1584. Hero: globe circle cx 1460, cy 859, r 529 px. Miranda (671, 344) r 29 px, Ariel (2425, 444) r 24 px.
- Stand-in fit (`src/stops/uranus/fit.json`): vfov 30, camera `[-0.097815, 0.125613, 5.680177]` identity rotation, sunDir `[-0.519344, 0.736074, 0.43414]`, rings inner 1.4118 outer 1.5395, ring normal `[-0.110925, 0.133303, 0.984848]`.
- Commands: `npm run compare -- --stop uranus --view hold|terrain --tier draft|final`, `npm run looks -- --push --folder uranus --note "..."`, `npm run measure -- --stop uranus`, `npm run sheet -- --segment uranus.hold`, `npm run crops`.
- Commit only `src/stops/uranus public/assets/uranus assets-src/uranus`. Trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`.

## What the approved images show

- Hero: pale cyan globe centre right, bands running lower left to upper right as parallels seen side on, bright hazy limb upper left with a warm thin outer fringe, white cloud flecks in the upper half, broad soft dark terminator across the lower right, hair-fine rings as near face-on ellipses round the globe (many concentric lines, brightest outer one), Miranda upper left, Ariel upper right, Milky Way diagonal behind the right side.
- Close: horizon runs upper left to lower right, bright cyan limb glow, dark blue depths lower left with white wispy streaks, ring arcs as a great arch overhead (hair-fine concentric lines, bright silver on the sun side), Sun as a white star with flare just above the horizon right of centre, Milky Way, stars.
- Inconsistency kept from the image: the stand-in fit takes the globe pole from the ring normal (sub camera latitude 81.6), but the bands run like parallels seen side on. Plan: fit the band axis from the hero's bands (pole toward upper left, about in the image plane), spin about that axis, keep the rings in their fitted near face-on plane. The image wins.

## Log

- 02:43 UTC Nov 21 2026: cloned, `npm ci`, build passes. Stand-in compares rendered at draft, first looks pushed 02:46 (a27c3d89 on `agent/uranus-looks`).
- Reading done: STOP-AGENT, AGENTS, kit 02 to 07, addenda, PROGRESS (look lock, tool record, budget, Phase 3 and 4 decisions), Mars set, planet, haze, moonbody, relief, cover, sky patches recipe.

## Hero analysis (03:05 UTC)

- Pixel to ray in the fitted hold frame: `((px-1408)/792*tan15, (792-py)/792*tan15, -1)`, camera `[-0.097815, 0.125613, 5.680177]`, globe radius 1 at origin. Helpers in `assets-src/uranus/geo.py`.
- Rings: the stand-in ring normal is wrong. Planet-centred circles in one plane fitted by sharpness of the unwrap: normal `[-0.1989, -0.6042, 0.7716]` (39.5 deg from the view axis, top of the rings nearer the camera, far side passes behind the lower-left limb). Strong lines at radius 1.314 (strongest), 1.347, 1.36, 1.538; inner bundle 1.30 to 1.36, outer line 1.54; lines wavy by about 0.03 R; visible mainly over the upper half, fading below. In-plane basis of the unwrap: e1 `[0.9498, -0.3127, 0]`, e2 `[0.2413, 0.7329, 0.6361]`. Ring normal is perpendicular to the sun direction.
- Band axis (minimum within-latitude variance of band-passed log luma, flecks masked): `[-0.5457, 0.8049, 0.2331]`, 12 deg from the sun direction, 11 deg off the ring plane. Sub-camera latitude 13.5 N. The globe spins about this axis, the rings keep their fitted plane. The image wins over science.
- Light by ndl (median scene-linear rgb, view cosine over 0.45): -0.5 `[.006,.047,.067]`, -0.1 `[.002,.036,.051]`, 0.1 `[.003,.039,.049]`, 0.2 `[.023,.109,.125]`, 0.4 `[.085,.31,.34]`, 0.6 `[.17,.53,.53]`, 0.8 `[.35,.94,.91]`, 0.9 `[.58,1.25,1.25]`. Night side is a flat deep teal, not black; terminator between ndl 0.1 and 0.3.
- Limb (display luma by position angle, radius/R 0.9 .. 1.26): bright upper-left limb falls 236 to 153 to 98 to 57 across 0.995 .. 1.05; a halo out to 1.2 R on the lit side; night limb at 240 to 270 deg shows a faint rim (29 at 0.985, 13 outside). Warm thin outer fringe on the lit limb.
- Hero details: flecks with bluish shadows, faint rainbow lens smudge in the lower-left sky (keep in the sky patch), moons gibbous grey cratered lit from upper left.
- Terrain spot candidate from the close image (camera high over the night side near the terminator looking sunward, Sun about 3 deg above the apparent horizon, ring arch 14 to 24 deg above the horizon): globe point `(0.721, -0.233, 0.653)`, hold frame normalised spot about `(0.654, 0.619)`. Close image focal at vfov 60 is 1372 px. To be confirmed by a fit of the close image.

## Builder notes (03:05 UTC)

- Web set at most 35 MB on disk (not 40). Full stays 150 MB.
- Engine requests as early as known; batch integration moves every stop's hash. Prefer stop-local code.
- Travel before the hold (body grows from a point, FarPoint as in Mars) and after the rise must work without pops; judged in Phase 5.

## Design

- Globe: own shader. Wrap 8192 x 4096 in the band-axis frame from the 2x hero (albedo = hero / light curve), faded toward the limb, far side zonal fill plus transplanted structure, poles on polar projection. Bands in albedo, light curve smooth. Zonal differential drift by latitude, flecks as a separate RGBA layer with its own rate and a soft shadow offset away from the Sun. At hold mid all offsets are zero, so the composite equals the hero.
- Limb: measured halo (impact parameter by ndl) plus one veil across the disc edge on lit and night sides.
- Rings: own module shared by orbit and terrain. 1D radial profile texture sampled with footprint filtering (mips, energy kept), low-res polar modulation. Alpha blended, not counted.
- Moons: two spheres placed to match hero pixels, slow orbit.
- Sky patch for the hold: hero minus film on black sky, one generated planet-removed fill.

## Plan

1. Orbit view: own `UranusGlobe` shader (wrap from hero pixels on the seen side, painted elsewhere, light curve, haze layers, fleck layer with soft shadow, band drift), own `Rings` module (true 3D, analytic thin lines filtered by pixel footprint so they do not shimmer), two `MoonBody` moons, hero sky patch.
2. Terrain view: relief with flow from the close image, ring arcs from the same ring module, sky patch, cyan haze cover.
3. Dive and rise: patch levels at most 2x apart, predictor, cover.
4. Self checks, then READY.
