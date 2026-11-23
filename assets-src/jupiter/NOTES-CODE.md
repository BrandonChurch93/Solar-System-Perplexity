# Jupiter from code: lab notebook

Agent: jupiter_coder. Branch `agent/jupiter-code`, looks folder `jupiter-code`. Builder is `/root`.
After a compaction: read this file first, then the start message if still there, then `cut/HANDOVER.md` (Part C, then Part B).

## The job (short)

- Brandon's note of 2026-11-23: the dive and rise are a blurry mess and read as a transition; the surface view of Jupiter looks like an image being stretched. It should look generated out of code.
- Part C of `cut/HANDOVER.md`: rebuild the terrain view (frames 3060 to 3239, judged 3150) as a cloud deck in true 3D on the sphere at the red storm. Then Part B (S1 to S5) for the dive (2970 to 3059, judged 2997) and the rise (3240 to 3314, judged 3296). The hold (2820 to 2969, judged 2895) must stay the same picture.
- Milestones to report to `/root`: M1 first deck at 3150 beside the approved image plus 3060, 3150, 3239 in a row. M2 whole surface view (12 frame sheet, every sixth frame at review tier, compare at 3150, G5, G13, G17, seconds per sample). M3 dive and rise by Part B with proofs. Then the stop as a whole.
- Folders: `src/stops/jupiter/`, `assets-src/jupiter/`, `public/assets/jupiter/`. Nothing else is edited.
- Every commit ends with the trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`.
- Looks at least every 30 minutes: `npm run looks -- --push --folder jupiter-code --note "..."`.

## Mail 218 from the Builder (what "from code" allows)

Order of what matters:
1. In motion nothing may read as a picture that bends. True 3D, real parallax, nothing stretches, every frame 3060 to 3239.
2. At 3150 the picture must be as rich as the approved image to a critic who sees both side by side. Plain noise bands will not hold up.
3. The means are mine.

Allowed as fixed input: fields that a tool of mine derives from the approved close image and lays onto the sphere top down, stored with their recipe (large scale colour, cloud top height, the storm's outline, a stream function for the flow). Such a field never moves over the surface, is never dragged along a flow, and is never the finest thing in view: every structure smaller than what the laid back image truly resolves at that spot comes from functions, made at the scale of the pixel. Toward the limb, where laying back stretches the image, the fields are made again by code or by a repaint, never used stretched.

Motion comes from the camera first: a real flight forward over a deck with real height. A storm of this size would hardly turn in six seconds. If it turns, only fine detail made by functions carries it (advection with reset, flow noise), slowly; the large forms stay where they are on the sphere. If in doubt, less.

A deck from functions and a stored simulation alone is just as welcome if it reaches the richness. Put candidates beside the approved image at 3150, pick the best in crops, say why at M1.

Judging: R1 compares 3150 with the approved image region by region (composition, where each feature sits, colour and grade, contrast and blacks, fine detail, light, limb glow, sky). R4 judges motion on sheets (near ground and horizon move against each other, nothing stretches, tears, slides or swims). R3 looks at native crops (soft areas, stretched texture, repeats, banding, airbrushed surface).

## Facts read from disk (2026-11-23)

- VM: 4 cores, 7 GB RAM, 14 GB free disk after clone and `npm ci`. `npm run build` passes on a fresh clone of main 6da6c64.
- Segments: hold 2820 to 2969, dive 2970 to 3059, terrain 3060 to 3239, rise 3240 to 3314. Judged: 2895, 2997, 3150, 3296.
- Tiers: draft 1 sample, review 4 (16 in fast kinds), final 16 (64 in fast kinds). The terrain view is not a fast kind.
- Old fit of the close image (old notebook, `relief/camfit.py`): vfov 64, focal 1267.46 px at 2816 wide, nadir in camera space (-0.272, -0.885, -0.377), dip 4.44 deg, roll 17.09 deg. Height above the sphere from the dip: 1 / cos(4.44 deg) - 1 = 0.00301 radii.
- The storm in the close image, from the old deck: centre px (1132, 552) of 2816 x 1584, ground half axes 1.12 x 2.18 camera heights, so about 0.19 x 0.38 degrees on the sphere at that height.
- The storm on the hold globe (hero pixels in the wrap): lon -17.5, lat -10, half axes about 13.2 x 7.9 degrees. So the globe's storm is about 35 times larger than the close view's storm at the close view's horizon. One scale cannot serve both: this is the main design question (see "Design").
- Sun at the hold: sunDir (-0.744, 0.140, 0.653) in the set frame, n.l at the storm about 0.81. The close image has a low raking Sun from the upper left and a terminator at the lower right.
- Engine: the terrain view is drawn in a frame with its origin at the spot on the unit sphere and axes (right, normal, -heading), camera relative (`set.world.position = origin - camera`). Poses of `plan.terrain()` are in that frame.
