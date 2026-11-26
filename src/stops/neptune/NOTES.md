# Neptune: the state at the freeze of 26 Nov (MAIL 1548)

Written 26 Nov, about 21:00 UTC, by the builder of this stop. Short on purpose. The full record is the notebook,
`assets-src/neptune/NOTES.md` (every mail word for word, every lab log; `grep -n "^## " assets-src/neptune/NOTES.md`).

## What the state is

- Branch `agent/neptune-place`. Its head is main `262b9a68df0a6bda8d77518539580de554bb0dc5` (the fifth cut) merged in, plus
  the notebook, this file and two patch files under `assets-src/neptune/check`. Never rebased, never forced.
- The stop on main IS this stop: Neptune's name `7a620a3966314e7abeecc70b206990d2cc588499` rides the fifth cut (MAIL 1540).
  `git diff 262b9a68 HEAD --stat` names only `assets-src/neptune` and this file: the code, the values and the assets of the
  stop are main's, byte for byte.
- Frames: hold 4530 to 4679, dive 4680 to 4769, terrain 4770 to 4949, rise 4950 to 5024. Judged: 4605, 4707, 4860, 5006.
- One Neptune from code at every height (`deep.ts`): no decal, no dissolve. Near the place the surface view; from 3 to 8
  scene units away from the place the scene shows the globe's own map (`deep.json`, far). Values live in the JSON files here.

## What is proven (on the name 7a620a39, 26 Nov 16:04 to 16:48 UTC; base then main 07d517b8)

- MEASURED by me on the sha: the unit tests, last lines "Test Files  95 passed (95)", "Tests  1106 passed (1106)"; tsc exit 0;
  the cues and the shots exit 0 with no change under cut/; the path line "smooth neptune: green."
- MEASURED by me, the judged four at 1920, draft tier: 4605 plain 2.923, G17 0.856 / 0.720; 4707 plain 47.2517; 4860 plain
  21.144, G17 0.972 / 0.659 (main before the cut 0.934 / 0.549); seconds a frame about 23, 29, 92, 14.
- STATED (my proxy at 960 wide, draft, half frames; the Builder's reader rules): dive 1 pattern 0.3732 at 4707, pop 1.0932 at
  4713 + 1/2; dive 2 pattern 0.4695 at 4745, OVER the limit 0.45; rise 1 pattern 0.3419 at 4972; rise 2 pattern 0.3937 at
  4989 + 1/2.
- The Builder's rows (MAIL 1525, 17:45): rise part 2 and dive part 1 green where main was red; the pop 1.1101 at 4713 + 1/2
  ruled no worse (d387). Dive part 2, rise part 1 and the G17 measure were still out then; the name rode the cut at 19:54.
- UNKNOWN to me: the Builder's rows for dive part 2 and rise part 1; every frame at final tier; anything at 3840 wide; any
  60 frames a second piece. At review tier I drew 4707 alone.
- NOT RUN: no test of mine on the merge with 262b9a68 (its code is main's to the byte, see above).

## What is still wrong, by frame and place

1. RISE 4973 to 4991, lower left and lower edge (Brandon's note: the surface image leaving). Soft pale patches come in over
   the lower left edge from 4973; a small round white blob sits at the lower edge from 4976 to about 4990; a short row of
   dark upright ticks stands at the lower edge near the middle at 4977 to 4985. They read as things laid on, not as cloud.
   The same soft patches stand at the lower left of the dive at 4736 to 4740. Cause of the patches and the blob, by control:
   the globe's map's cloud layer as the far look draws it (gone with `deep.json` far.cloud 0). Not cured: see below.
2. DIVE 4737 to 4747, under the limb: the far white bank loses its lumps (my proxy 0.4695 at 4745).
3. DIVE 4741 to 4745, the sky's corner: the edge of the surface view's star field crosses it in four frames.
4. The entry (the shutter with ends, one line of `config/showcase.json`) at review tier, by handover_engineer's frames: no
   double exposure at 4757, 4758, 4951, 4952, 4953, 4954, 4956. Open by him: a mesh of period 2 px in the bright wisp (5185
   px at draft, 878 at review); the step 4951 to 4952 is the largest of the onset (he can name it at 2 to 1, not at 1 to 1);
   no frame without the entry at 4952 and 4953; 4955 not drawn. His offer for a later day: fromPx 3 for Neptune's own entry.
5. Night side: in the dive its blue is 2.0 under the hold's at 4707 (cause by control: the near grade); in the rise 3.1
   under its own later value at 5006 (cause not found).
6. 4707: a stair on thin lines, seen from 4 times up. 4860: a blue dot about 8 px wide at 1177, 741; green 3.5 against the
   bar of 3 at 4 pixels (1318 to 1325, 723 to 726; 1141, 732).
7. Standing from earlier rounds: the thin line with white knots from 4720; the soft slope of the surface view's card in
   the rise's sky at 4978 and 4980; the tone edge of wrap.webp at y 1033 of 4529 and 4530; at 4860 against the approved
   picture the bank in lumps, the oval shorter, the dark halo gone; ruling 6 of MAIL 1363 not begun.

## How to go on (fault 1; the research of 26 Nov 17:00 to 19:50, lab logs in the notebook)

- The trial is far.grain: a field fixed on the body, multiplied onto the map's cover, so that the soft patches break into
  bodies. It is NOT in the stop. Its code is kept as two patches against `deep.ts` and `deep.json` of the name:
  `assets-src/neptune/check/far-grain-trial.patch`, then `far-grain-mid-run.patch`.
- Cause 1, controlled (D5, D6): read at the ray's entry point the field stood still while the cover, a mean along the run
  through the slab, slid under it; the bodies changed form frame by frame (pattern 0.5383 at 4975, 0.6086 at 4723). Read
  at the middle of the run the pattern is the name's (0.1723 at 4975). The second patch does this.
- Cause 2, controlled (G1, G3, G4; G2 as the fine end): the onset by the texel's size lets bodies of 4 to 8 texels come and
  go while they are large: a hump at 4979 to 4985 (0.4267 at 4983). Without the onset no hump. With the onset only 2 texels
  hold, and they read as speckle.
- G4 (no onset, bodies of 8 texels) gives the best form, the patches as small broken cloud. Its prices: at 4860 0.939
  percent of the pixels move by more than 8 levels (x 740 to 1919, y 216 to 506 of 1920), which is against (h) of MAIL 1475
  (the far ground stays as it is); at 4979 to 4987 the long bright streaks toward the limb break into flecks; 4707 moves
  56666 px, largest 22.
- G5 (G4 only within 3 to 8 units of the place): the border does not divide them. 4860 still moves 0.679 percent and the
  rise's patches lose part of the field. The patches of the rise and the far ground of 4860 are one ground.
- So the next step needs a ruling first: either (h) is opened for this layer (then G4's kind, with a cure that spares the
  bright streaks, and then the whole proof: the dive, whole and half frames, the tests, the path lines, review tier), or
  another road to form than a field multiplied onto the cover. Untried: a lower gain without the cut at 0; shade from the
  field's gradient toward the Sun; the map's cloud shadow moved with the field.
- The white blob and the dark ticks are cured by no trial. The ticks were placed in the lab log of 26 Nov 16:49 to 17:04.

## Rules that bind this stop (the mails are in the notebook)

The timeline does not change. No decal, no dissolve; nothing of a dive or a rise appears, fades or changes with the clock.
One tone curve at every height, the hold's. G17 at 4860 stays green and is never won by a sharpening pass or a plate. The
far ground stays as it is (h). No Sun is painted into anything of this stop. The aim of the rise and the ending's turn are
not this stop's to change. The air is not thinned to win a number. Draft tier to iterate, review tier to prove.
