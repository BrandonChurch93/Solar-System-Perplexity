# Cues

Written by `npm run cues` (`tools/cues.ts`) from `segments`, `cover` and `posts` in `config/showcase.json` and from the records of the nine intros. `npm run cues -- --check` fails when this file or `cut/SHOTS.md` no longer matches the config.

The film runs 03:00.000, 5400 frames at 30 frames per second, with no sound. Time is minutes, seconds and thousandths. Timecode is hours, minutes, seconds and frames at 30 frames per second, with no dropped frames. A frame number counts from 0.

## The film

| Segment | Cue | Time | Timecode | Frame | Sound |
| --- | --- | --- | --- | --- | --- |
| `sun.terrain` | start of terrain | 00:00.000 | 00:00:00:00 | 0 | The film opens here at full level, with no fade in. The hush: music drops to a quiet bed on the first frame, under a soft air tone. Plasma: a low roar with crackle, loudest here. |
| `sun.rise` | start of rise | 00:06.000 | 00:00:06:00 | 180 | A shorter rush that peaks at the cover center and opens out after it. |
| `sun.rise` | center of the cover | 00:07.200 | 00:00:07:06 | 216 | The peak of the rush. The cover runs from frame 208 to 223 and the view changes under it. |
| `sun.hold` | start of hold | 00:09.000 | 00:00:09:00 | 270 | Music lands on the first frame and carries the hold. Plasma: a low roar, further off. |
| `sun.travel` | start of travel | 00:15.000 | 00:00:15:00 | 450 | Music builds from the first frame toward the next hold. |
| `mercury.hold` | start of hold | 00:18.000 | 00:00:18:00 | 540 | Music lands on the first frame and carries the hold. |
| `mercury.dive` | start of dive | 00:23.000 | 00:00:23:00 | 690 | The rush of the dive: a rising rush of air from the first frame that peaks at the cover center. |
| `mercury.dive` | center of the cover | 00:24.800 | 00:00:24:24 | 744 | The peak of the rush. The cover runs from frame 736 to 751 and the view changes under it. |
| `mercury.terrain` | start of terrain | 00:26.000 | 00:00:26:00 | 780 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `mercury.rise` | start of rise | 00:32.000 | 00:00:32:00 | 960 | A shorter rush that peaks at the cover center and opens out after it. |
| `mercury.rise` | center of the cover | 00:33.000 | 00:00:33:00 | 990 | The peak of the rush. The cover runs from frame 982 to 997 and the view changes under it. |
| `mercury.travel` | start of travel | 00:34.500 | 00:00:34:15 | 1035 | Music builds from the first frame toward the next hold. |
| `venus.hold` | start of hold | 00:37.000 | 00:00:37:00 | 1110 | Music lands on the first frame and carries the hold. |
| `venus.dive` | start of dive | 00:42.000 | 00:00:42:00 | 1260 | The rush of the dive: a rising rush of air from the first frame that peaks at the cover center. |
| `venus.dive` | center of the cover | 00:43.800 | 00:00:43:24 | 1314 | The peak of the rush. The cover runs from frame 1299 to 1329 and the view changes under it. |
| `venus.terrain` | start of terrain | 00:45.000 | 00:00:45:00 | 1350 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `venus.rise` | start of rise | 00:51.000 | 00:00:51:00 | 1530 | A shorter rush that peaks at the cover center and opens out after it. |
| `venus.rise` | center of the cover | 00:52.000 | 00:00:52:00 | 1560 | The peak of the rush. The cover runs from frame 1545 to 1575 and the view changes under it. |
| `venus.travel` | start of travel | 00:53.500 | 00:00:53:15 | 1605 | Music builds from the first frame toward the next hold. |
| `earth.hold` | start of hold | 00:56.000 | 00:00:56:00 | 1680 | Music lands on the first frame and carries the hold. |
| `earth.dive` | start of dive | 01:01.000 | 00:01:01:00 | 1830 | The rush of the dive: a rising rush of air from the first frame that peaks at the cover center. |
| `earth.dive` | center of the cover | 01:02.800 | 00:01:02:24 | 1884 | The peak of the rush. The cover runs from frame 1876 to 1891 and the view changes under it. |
| `earth.terrain` | start of terrain | 01:04.000 | 00:01:04:00 | 1920 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `earth.rise` | start of rise | 01:10.000 | 00:01:10:00 | 2100 | A shorter rush that peaks at the cover center and opens out after it. |
| `earth.rise` | center of the cover | 01:11.000 | 00:01:11:00 | 2130 | The peak of the rush. The cover runs from frame 2122 to 2137 and the view changes under it. |
| `earth.travel` | start of travel | 01:12.500 | 00:01:12:15 | 2175 | Music builds from the first frame toward the next hold. |
| `mars.hold` | start of hold | 01:15.000 | 00:01:15:00 | 2250 | Music lands on the first frame and carries the hold. |
| `mars.dive` | start of dive | 01:20.000 | 00:01:20:00 | 2400 | The rush of the dive: a rising rush of air from the first frame that peaks at the handover. |
| `mars.dive` | the handover | 01:21.808 | 00:01:21:24 | 2454 | The peak of the rush. The view changes in frame 2454 with no cover: the place stays in view. |
| `mars.terrain` | start of terrain | 01:23.000 | 00:01:23:00 | 2490 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `mars.rise` | start of rise | 01:29.000 | 00:01:29:00 | 2670 | A shorter rush that peaks at the handover and opens out after it. |
| `mars.rise` | the handover | 01:30.008 | 00:01:30:00 | 2700 | The peak of the rush. The view changes in frame 2700 with no cover: the place stays in view. |
| `mars.travel` | start of travel | 01:31.500 | 00:01:31:15 | 2745 | Music builds from the first frame toward the next hold. A few rocks pass close to the lens: one low pass for each. |
| `jupiter.hold` | start of hold | 01:34.000 | 00:01:34:00 | 2820 | Music lands on the first frame and carries the hold. |
| `jupiter.dive` | start of dive | 01:39.000 | 00:01:39:00 | 2970 | The rush of the dive: a rising rush of air from the first frame that peaks at the cover center. |
| `jupiter.dive` | center of the cover | 01:40.800 | 00:01:40:24 | 3024 | The peak of the rush. The cover runs from frame 3016 to 3031 and the view changes under it. |
| `jupiter.terrain` | start of terrain | 01:42.000 | 00:01:42:00 | 3060 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `jupiter.rise` | start of rise | 01:48.000 | 00:01:48:00 | 3240 | A shorter rush that peaks at the cover center and opens out after it. |
| `jupiter.rise` | center of the cover | 01:49.000 | 00:01:49:00 | 3270 | The peak of the rush. The cover runs from frame 3262 to 3277 and the view changes under it. |
| `jupiter.travel` | start of travel | 01:50.500 | 00:01:50:15 | 3315 | Music builds from the first frame toward the next hold. |
| `saturn.hold` | start of hold | 01:53.000 | 00:01:53:00 | 3390 | Music lands on the first frame and carries the hold. |
| `saturn.dive` | start of dive | 01:58.000 | 00:01:58:00 | 3540 | The rush of the dive: a rising rush of air from the first frame that peaks at the cover center. |
| `saturn.dive` | center of the cover | 01:59.800 | 00:01:59:24 | 3594 | The peak of the rush. The cover runs from frame 3586 to 3601 and the view changes under it. |
| `saturn.terrain` | start of terrain | 02:01.000 | 00:02:01:00 | 3630 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `saturn.rise` | start of rise | 02:07.000 | 00:02:07:00 | 3810 | A shorter rush that peaks at the cover center and opens out after it. |
| `saturn.rise` | center of the cover | 02:08.000 | 00:02:08:00 | 3840 | The peak of the rush. The cover runs from frame 3832 to 3847 and the view changes under it. |
| `saturn.travel` | start of travel | 02:09.500 | 00:02:09:15 | 3885 | Music builds from the first frame toward the next hold. |
| `uranus.hold` | start of hold | 02:12.000 | 00:02:12:00 | 3960 | Music lands on the first frame and carries the hold. |
| `uranus.dive` | start of dive | 02:17.000 | 00:02:17:00 | 4110 | The rush of the dive: a rising rush of air from the first frame that peaks at the cover center. |
| `uranus.dive` | center of the cover | 02:18.800 | 00:02:18:24 | 4164 | The peak of the rush. The cover runs from frame 4156 to 4171 and the view changes under it. |
| `uranus.terrain` | start of terrain | 02:20.000 | 00:02:20:00 | 4200 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `uranus.rise` | start of rise | 02:26.000 | 00:02:26:00 | 4380 | A shorter rush that peaks at the cover center and opens out after it. |
| `uranus.rise` | center of the cover | 02:27.000 | 00:02:27:00 | 4410 | The peak of the rush. The cover runs from frame 4402 to 4417 and the view changes under it. |
| `uranus.travel` | start of travel | 02:28.500 | 00:02:28:15 | 4455 | Music builds from the first frame toward the next hold. |
| `neptune.hold` | start of hold | 02:31.000 | 00:02:31:00 | 4530 | Music lands on the first frame and carries the hold. |
| `neptune.dive` | start of dive | 02:36.000 | 00:02:36:00 | 4680 | The rush of the dive: a rising rush of air from the first frame that peaks at the cover center. |
| `neptune.dive` | center of the cover | 02:38.100 | 00:02:38:03 | 4743 | The peak of the rush. The cover runs from frame 4728 to 4758 and the view changes under it. |
| `neptune.terrain` | start of terrain | 02:39.000 | 00:02:39:00 | 4770 | The hush: music drops to a quiet bed on the first frame, under a soft air tone. |
| `neptune.rise` | start of rise | 02:45.000 | 00:02:45:00 | 4950 | A shorter rush that peaks at the cover center and opens out after it. |
| `neptune.rise` | center of the cover | 02:46.000 | 00:02:46:00 | 4980 | The peak of the rush. The cover runs from frame 4972 to 4987 and the view changes under it. |
| `ending.retreat` | start of retreat | 02:47.500 | 00:02:47:15 | 5025 | Music begins to fall away. |
| `ending.lookback` | start of lookback | 02:51.500 | 00:02:51:15 | 5145 | Music lands for the last time and thins to one held tone. |
| `ending.fade` | start of fade | 02:57.500 | 00:02:57:15 | 5325 | All sound fades with the picture. The last frame is silent. |
| | end of the film | 03:00.000 | 00:03:00:00 | 5400 | The last picture frame is frame 5399. It is black and silent. |

## Music

- The opening: frame 0 is a finished picture with no fade in, so the sound starts at full level on the first frame. The hook is the first 2 seconds, to 00:02.000.
- Music builds through every travel, from its first frame to the first frame of the next hold: 00:15.000 to 00:18.000, 00:34.500 to 00:37.000, 00:53.500 to 00:56.000, 01:12.500 to 01:15.000, 01:31.500 to 01:34.000, 01:50.500 to 01:53.000, 02:09.500 to 02:12.000, 02:28.500 to 02:31.000.
- Music lands on the first frame of every hold: 00:09.000 sun, 00:18.000 mercury, 00:37.000 venus, 00:56.000 earth, 01:15.000 mars, 01:34.000 jupiter, 01:53.000 saturn, 02:12.000 uranus, 02:31.000 neptune.
- Music drops to a quiet bed for every terrain view, the hush: 00:00.000 to 00:06.000, 00:26.000 to 00:32.000, 00:45.000 to 00:51.000, 01:04.000 to 01:10.000, 01:23.000 to 01:29.000, 01:42.000 to 01:48.000, 02:01.000 to 02:07.000, 02:20.000 to 02:26.000, 02:39.000 to 02:45.000.
- A rush of air peaks at the center of every cover: 00:07.200, 00:24.800, 00:33.000, 00:43.800, 00:52.000, 01:02.800, 01:11.000, 01:40.800, 01:49.000, 01:59.800, 02:08.000, 02:18.800, 02:27.000, 02:38.100, 02:46.000.
- A rush of air peaks at every handover: 01:21.808, 01:30.008.
- The ending: music lands for the last time at 02:51.500, the start of the lookback, and fades with the picture from 02:57.500 to silence at 03:00.000.

## The clips

A clip is cut from the same frames as the film. Its cues are the film's cues counted from the clip's first frame.

| Clip | Segment | Cue | Time in the clip | Frame in the clip | Time in the film |
| --- | --- | --- | --- | --- | --- |
| `sun` | `sun.terrain` | start of terrain | 00:00.000 | 0 | 00:00.000 |
| `sun` | `sun.rise` | start of rise | 00:06.000 | 180 | 00:06.000 |
| `sun` | `sun.rise` | center of the cover | 00:07.200 | 216 | 00:07.200 |
| `sun` | `sun.hold` | start of hold | 00:09.000 | 270 | 00:09.000 |
| `sun` | | end of the clip | 00:15.000 | 450 | 00:15.000 |
| `mercury` | `mercury.hold` | start of hold | 00:00.000 | 0 | 00:18.000 |
| `mercury` | `mercury.dive` | start of dive | 00:05.000 | 150 | 00:23.000 |
| `mercury` | `mercury.dive` | center of the cover | 00:06.800 | 204 | 00:24.800 |
| `mercury` | `mercury.terrain` | start of terrain | 00:08.000 | 240 | 00:26.000 |
| `mercury` | `mercury.rise` | start of rise | 00:14.000 | 420 | 00:32.000 |
| `mercury` | `mercury.rise` | center of the cover | 00:15.000 | 450 | 00:33.000 |
| `mercury` | | end of the clip | 00:16.500 | 495 | 00:34.500 |
| `venus` | `venus.hold` | start of hold | 00:00.000 | 0 | 00:37.000 |
| `venus` | `venus.dive` | start of dive | 00:05.000 | 150 | 00:42.000 |
| `venus` | `venus.dive` | center of the cover | 00:06.800 | 204 | 00:43.800 |
| `venus` | `venus.terrain` | start of terrain | 00:08.000 | 240 | 00:45.000 |
| `venus` | `venus.rise` | start of rise | 00:14.000 | 420 | 00:51.000 |
| `venus` | `venus.rise` | center of the cover | 00:15.000 | 450 | 00:52.000 |
| `venus` | | end of the clip | 00:16.500 | 495 | 00:53.500 |
| `earth` | `earth.hold` | start of hold | 00:00.000 | 0 | 00:56.000 |
| `earth` | `earth.dive` | start of dive | 00:05.000 | 150 | 01:01.000 |
| `earth` | `earth.dive` | center of the cover | 00:06.800 | 204 | 01:02.800 |
| `earth` | `earth.terrain` | start of terrain | 00:08.000 | 240 | 01:04.000 |
| `earth` | `earth.rise` | start of rise | 00:14.000 | 420 | 01:10.000 |
| `earth` | `earth.rise` | center of the cover | 00:15.000 | 450 | 01:11.000 |
| `earth` | | end of the clip | 00:16.500 | 495 | 01:12.500 |
| `mars` | `mars.hold` | start of hold | 00:00.000 | 0 | 01:15.000 |
| `mars` | `mars.dive` | start of dive | 00:05.000 | 150 | 01:20.000 |
| `mars` | `mars.dive` | the handover | 00:06.808 | 204 | 01:21.808 |
| `mars` | `mars.terrain` | start of terrain | 00:08.000 | 240 | 01:23.000 |
| `mars` | `mars.rise` | start of rise | 00:14.000 | 420 | 01:29.000 |
| `mars` | `mars.rise` | the handover | 00:15.008 | 450 | 01:30.008 |
| `mars` | | end of the clip | 00:16.500 | 495 | 01:31.500 |
| `jupiter` | `jupiter.hold` | start of hold | 00:00.000 | 0 | 01:34.000 |
| `jupiter` | `jupiter.dive` | start of dive | 00:05.000 | 150 | 01:39.000 |
| `jupiter` | `jupiter.dive` | center of the cover | 00:06.800 | 204 | 01:40.800 |
| `jupiter` | `jupiter.terrain` | start of terrain | 00:08.000 | 240 | 01:42.000 |
| `jupiter` | `jupiter.rise` | start of rise | 00:14.000 | 420 | 01:48.000 |
| `jupiter` | `jupiter.rise` | center of the cover | 00:15.000 | 450 | 01:49.000 |
| `jupiter` | | end of the clip | 00:16.500 | 495 | 01:50.500 |
| `saturn` | `saturn.hold` | start of hold | 00:00.000 | 0 | 01:53.000 |
| `saturn` | `saturn.dive` | start of dive | 00:05.000 | 150 | 01:58.000 |
| `saturn` | `saturn.dive` | center of the cover | 00:06.800 | 204 | 01:59.800 |
| `saturn` | `saturn.terrain` | start of terrain | 00:08.000 | 240 | 02:01.000 |
| `saturn` | `saturn.rise` | start of rise | 00:14.000 | 420 | 02:07.000 |
| `saturn` | `saturn.rise` | center of the cover | 00:15.000 | 450 | 02:08.000 |
| `saturn` | | end of the clip | 00:16.500 | 495 | 02:09.500 |
| `uranus` | `uranus.hold` | start of hold | 00:00.000 | 0 | 02:12.000 |
| `uranus` | `uranus.dive` | start of dive | 00:05.000 | 150 | 02:17.000 |
| `uranus` | `uranus.dive` | center of the cover | 00:06.800 | 204 | 02:18.800 |
| `uranus` | `uranus.terrain` | start of terrain | 00:08.000 | 240 | 02:20.000 |
| `uranus` | `uranus.rise` | start of rise | 00:14.000 | 420 | 02:26.000 |
| `uranus` | `uranus.rise` | center of the cover | 00:15.000 | 450 | 02:27.000 |
| `uranus` | | end of the clip | 00:16.500 | 495 | 02:28.500 |
| `neptune` | `neptune.hold` | start of hold | 00:00.000 | 0 | 02:31.000 |
| `neptune` | `neptune.dive` | start of dive | 00:05.000 | 150 | 02:36.000 |
| `neptune` | `neptune.dive` | center of the cover | 00:07.100 | 213 | 02:38.100 |
| `neptune` | `neptune.terrain` | start of terrain | 00:08.000 | 240 | 02:39.000 |
| `neptune` | `neptune.rise` | start of rise | 00:14.000 | 420 | 02:45.000 |
| `neptune` | `neptune.rise` | center of the cover | 00:15.000 | 450 | 02:46.000 |
| `neptune` | | end of the clip | 00:16.500 | 495 | 02:47.500 |

## The posts

A post is the intro, then a hard cut to the first frame of the stop's clip. Times count from the first frame of the post. The submit is on the last frame of the intro and the cut is the next frame. Typing sound runs from the first key to the last key, with one key for each character of the prompt. Each record lies beside its intro, in `out/posts/` once `npm run keep -- --posts` has run.

| Post | Prompt | Keys | First key | Last key | Submit | Cut to the clip | Frame of the cut | End of the post | Record |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sun` | Give me a hyperrealistic Sun using three.js | 43 | 00:00.833 | 00:02.933 | 00:04.533 | 00:04.567 | 137 | 00:19.567 | `intro-sun.mp4.json` |
| `mercury` | Give me a hyperrealistic Mercury using three.js | 47 | 00:00.833 | 00:03.133 | 00:04.733 | 00:04.767 | 143 | 00:21.267 | `intro-mercury.mp4.json` |
| `venus` | Give me a hyperrealistic Venus using three.js | 45 | 00:00.833 | 00:03.033 | 00:04.633 | 00:04.667 | 140 | 00:21.167 | `intro-venus.mp4.json` |
| `earth` | Give me a hyperrealistic Earth using three.js | 45 | 00:00.833 | 00:03.033 | 00:04.633 | 00:04.667 | 140 | 00:21.167 | `intro-earth.mp4.json` |
| `mars` | Give me a hyperrealistic Mars using three.js | 44 | 00:00.833 | 00:03.000 | 00:04.600 | 00:04.633 | 139 | 00:21.133 | `intro-mars.mp4.json` |
| `jupiter` | Give me a hyperrealistic Jupiter using three.js | 47 | 00:00.833 | 00:03.133 | 00:04.733 | 00:04.767 | 143 | 00:21.267 | `intro-jupiter.mp4.json` |
| `saturn` | Give me a hyperrealistic Saturn using three.js | 46 | 00:00.833 | 00:03.100 | 00:04.700 | 00:04.733 | 142 | 00:21.233 | `intro-saturn.mp4.json` |
| `uranus` | Give me a hyperrealistic Uranus using three.js | 46 | 00:00.833 | 00:03.100 | 00:04.700 | 00:04.733 | 142 | 00:21.233 | `intro-uranus.mp4.json` |
| `neptune` | Give me a hyperrealistic Neptune using three.js | 47 | 00:00.833 | 00:03.133 | 00:04.733 | 00:04.767 | 143 | 00:21.267 | `intro-neptune.mp4.json` |

The time of every key, in seconds from the first frame of the post:

- `sun`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933
- `mercury`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000 3.033 3.100 3.133
- `venus`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000 3.033
- `earth`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000 3.033
- `mars`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000
- `jupiter`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000 3.033 3.100 3.133
- `saturn`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000 3.033 3.100
- `uranus`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000 3.033 3.100
- `neptune`: 0.833 0.900 0.933 1.000 1.033 1.100 1.133 1.200 1.233 1.300 1.333 1.400 1.433 1.500 1.533 1.600 1.633 1.700 1.733 1.800 1.833 1.900 1.933 2.000 2.033 2.100 2.133 2.200 2.233 2.300 2.333 2.400 2.433 2.500 2.533 2.600 2.633 2.700 2.733 2.800 2.833 2.900 2.933 3.000 3.033 3.100 3.133

The clip's cues inside each post, after the cut:

| Post | Segment | Cue | Time in the post | Frame in the post |
| --- | --- | --- | --- | --- |
| `sun` | `sun.terrain` | start of terrain | 00:04.567 | 137 |
| `sun` | `sun.rise` | start of rise | 00:10.567 | 317 |
| `sun` | `sun.rise` | center of the cover | 00:11.767 | 353 |
| `sun` | `sun.hold` | start of hold | 00:13.567 | 407 |
| `mercury` | `mercury.hold` | start of hold | 00:04.767 | 143 |
| `mercury` | `mercury.dive` | start of dive | 00:09.767 | 293 |
| `mercury` | `mercury.dive` | center of the cover | 00:11.567 | 347 |
| `mercury` | `mercury.terrain` | start of terrain | 00:12.767 | 383 |
| `mercury` | `mercury.rise` | start of rise | 00:18.767 | 563 |
| `mercury` | `mercury.rise` | center of the cover | 00:19.767 | 593 |
| `venus` | `venus.hold` | start of hold | 00:04.667 | 140 |
| `venus` | `venus.dive` | start of dive | 00:09.667 | 290 |
| `venus` | `venus.dive` | center of the cover | 00:11.467 | 344 |
| `venus` | `venus.terrain` | start of terrain | 00:12.667 | 380 |
| `venus` | `venus.rise` | start of rise | 00:18.667 | 560 |
| `venus` | `venus.rise` | center of the cover | 00:19.667 | 590 |
| `earth` | `earth.hold` | start of hold | 00:04.667 | 140 |
| `earth` | `earth.dive` | start of dive | 00:09.667 | 290 |
| `earth` | `earth.dive` | center of the cover | 00:11.467 | 344 |
| `earth` | `earth.terrain` | start of terrain | 00:12.667 | 380 |
| `earth` | `earth.rise` | start of rise | 00:18.667 | 560 |
| `earth` | `earth.rise` | center of the cover | 00:19.667 | 590 |
| `mars` | `mars.hold` | start of hold | 00:04.633 | 139 |
| `mars` | `mars.dive` | start of dive | 00:09.633 | 289 |
| `mars` | `mars.dive` | the handover | 00:11.442 | 343 |
| `mars` | `mars.terrain` | start of terrain | 00:12.633 | 379 |
| `mars` | `mars.rise` | start of rise | 00:18.633 | 559 |
| `mars` | `mars.rise` | the handover | 00:19.642 | 589 |
| `jupiter` | `jupiter.hold` | start of hold | 00:04.767 | 143 |
| `jupiter` | `jupiter.dive` | start of dive | 00:09.767 | 293 |
| `jupiter` | `jupiter.dive` | center of the cover | 00:11.567 | 347 |
| `jupiter` | `jupiter.terrain` | start of terrain | 00:12.767 | 383 |
| `jupiter` | `jupiter.rise` | start of rise | 00:18.767 | 563 |
| `jupiter` | `jupiter.rise` | center of the cover | 00:19.767 | 593 |
| `saturn` | `saturn.hold` | start of hold | 00:04.733 | 142 |
| `saturn` | `saturn.dive` | start of dive | 00:09.733 | 292 |
| `saturn` | `saturn.dive` | center of the cover | 00:11.533 | 346 |
| `saturn` | `saturn.terrain` | start of terrain | 00:12.733 | 382 |
| `saturn` | `saturn.rise` | start of rise | 00:18.733 | 562 |
| `saturn` | `saturn.rise` | center of the cover | 00:19.733 | 592 |
| `uranus` | `uranus.hold` | start of hold | 00:04.733 | 142 |
| `uranus` | `uranus.dive` | start of dive | 00:09.733 | 292 |
| `uranus` | `uranus.dive` | center of the cover | 00:11.533 | 346 |
| `uranus` | `uranus.terrain` | start of terrain | 00:12.733 | 382 |
| `uranus` | `uranus.rise` | start of rise | 00:18.733 | 562 |
| `uranus` | `uranus.rise` | center of the cover | 00:19.733 | 592 |
| `neptune` | `neptune.hold` | start of hold | 00:04.767 | 143 |
| `neptune` | `neptune.dive` | start of dive | 00:09.767 | 293 |
| `neptune` | `neptune.dive` | center of the cover | 00:11.867 | 356 |
| `neptune` | `neptune.terrain` | start of terrain | 00:12.767 | 383 |
| `neptune` | `neptune.rise` | start of rise | 00:18.767 | 563 |
| `neptune` | `neptune.rise` | center of the cover | 00:19.767 | 593 |
