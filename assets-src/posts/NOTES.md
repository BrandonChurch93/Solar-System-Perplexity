# Notebook: planet post intros

Work for `kit/addenda/003-planet-posts.md`, on branch `agent/posts`. Dates are UTC.

## What exists

- `assets-src/posts/intro.ts` drives the skill and writes `out/work/posts/intro-<stop>.mp4` with its record.
- `assets-src/posts/inputs.json` holds the skill inputs that are not kit numbers.
- `tools/post.ts` joins, checks and makes the sheets. `npm run post`.
- `tools/keep.ts` has `--posts`.
- `assets-src/posts/RECIPE.md` is the recipe of the nine intros.

## What was run, 2026-11-21

- The skill `org:synthetic-query-typing` loaded. Nine intros made in one run of about 1 min 50 s. No try failed.
- `npm run post -- --sheets`: nine sheets.
- `npm run post -- --stop mars` with the committed `out/clips/mars.mp4`: 139 + 495 = 634 frames, joined without encoding.
- `npm run post -- --check --stop mars`: pass. The frame after the cut is identical to the clip's first frame.
- `npm run post -- --stop mars --encode`: the encode path, 634 frames, 20.1 Mbps, 66 s. Check passed with the cut frame at 37.07 dB against the clip's first frame. The join without encoding was made again after it and is the Mars post on disk.
- `npm run post` with no stop: makes Mars, says the other eight have no clip yet, exit code 0.
- `npm run post -- --stop venus`: says there is no clip yet, exit code 1.
- `npm run post -- --check` with no stop: exit code 1, because eight posts do not exist yet.
- A post file swapped for another under its record: the check fails with "post record is of another file".
- `npm run keep -- --posts --stop mars`: copies the intro. It says "no current post for mars", because the committed Mars clip is of engine `73b844358c466906` and the build on this branch is `cae3193a3821716c`. With the record set to the current build for the test, the post was copied and a second run said "(current)". The test output in `out/posts/` was removed and the record put back.
- After the merge of main b4ae65c, with the fallback read removed: `npm run build`, `npm test` and `npm run post -- --check --stop mars` run again, all pass. The nine intro records carry the same prompt strings as the config block, checked by `--check` for Mars and by a comparison of all nine records.
- The Mars intro made a second time with `npx tsx assets-src/posts/intro.ts --stop mars`, reading the config only: the file is the same byte for byte (sha256 `dabd99b2...b88b8c8`). The first take and its record were kept.
- Not run: the text check of the addendum with a fresh agent. The sheets are ready for it.

## Decisions

1. Preset `full`. The skill offers `full` and `quick`. Its guide gives `full` to a composer that appears for the first time, and each post opens on the composer. `quick` would be about 3.6 s with a hold of 1.0 s. Both fit the limits. `full` leaves a calmer start for a sound cue.
2. `--cps 20` and `--hold 0.55`. With them the longest prompt (47 characters) gives 4.767 s, under `posts.introMaxSeconds`, and the full prompt stays 1.600 s, twice `posts.readHoldSeconds`. The skill's own check for the `full` preset asks for the hold input plus 1.0 s, less one frame, and passed.
3. The skill's send instant falls between two frames at 30 fps. The driver measures it with a one frame run and raises `--hold` by the missing part of a frame (at most 0.02 s here), so that the first frame with the pressed Send button is exactly the send instant. That frame is the last frame of the intro.
4. The submit frame is the first frame whose state has `illustrativeSubmit`. In the picture the Send button is pressed: a little smaller, with a ring. The caret is gone. The frame before it shows the full prompt with the button at rest.
5. The skill prefers 60 fps but says to render at the footage's frame rate, which is `film.fps`. Rendered straight at 30 fps and at `--dpr 1.5`, which gives 1920 x 1080 from the skill's 1280 x 720 layout. Both are parameters of the skill, so nothing is resampled or scaled afterward.
6. The skill's own video is not used (`--no-video 1`). Its PNG frames go into the encoder of this repo, with the same call `tools/film.ts` makes for a clip part. The skill's guide allows its frames to be fed into an assembly. This is what makes the join without encoding work.
7. The tail the skill renders after the send (a hold and a fade toward the background, 32 frames for Mars) is cut. The task mail calls that a trim.
8. cps 20 at 30 fps: a key lands every 1.5 frames, so keys come in a 2 frame, 1 frame rhythm. No frame adds two characters. The record lists the time of every key under `extra.keySeconds` for the sound cues.
9. Records have the shape of `OutputRecord`, so `readRecord` and the `keep()` of `tools/keep.ts` work on them unchanged. An intro has an empty `engineHash` and no stop hashes, because it does not depend on the build. A post carries the hashes of its clip, so `keep -- --posts` copies a post only when its clip is of the current build, as `--clips` does. All other data sits under `extra`.
10. `keep -- --posts` copies an intro without a build check, for the same reason.
11. Config. Every number and every prompt comes from the `posts` block of `config/showcase.json` (`postsConfig` in `tools/post.ts` returns `cfg.raw.posts`). There is no fallback. While the block was not on main yet, the intros were made with the same values from a file under `out/work/`, which git ignores, so no kit number was ever in a committed file. That read was removed when the block landed with main b4ae65c.
12. `--encode` was added to `npm run post` to force the encode path, so that path can be tested with a clip that also joins without encoding.
13. Sheets: `critics.contactSheetFrames` frames at `critics.phonePreviewWidthPx` in three columns, evenly spread from the first frame to the submit frame, and under them the prompt box from the frame before the submit at native size. No labels are drawn, so the sheet carries no text but the interface's own. The prompt card is 1410 px wide and `critics.maxImageLongEdgePx` is 1400, so the crop leaves out 5 px of the card's edge on each side. The text is not touched by that.

## How the join without encoding is decided

- The two files must agree in codec, profile, level, size, pixel format, sample aspect, field order, frame rate, time base, B frame depth and the color tags, must have the same sequence parameter set, and must have no audio.
- The picture parameter sets may differ. x264 in two passes sets the start quantizer in it from the content, so a still screen and a planet get different values. That is no obstacle. The committed Mars clip is itself a join of parts and carries 28 parameter sets in its stream, one pair per part. The intro's set travels the same way.
- The join is made with ffmpeg's concat demuxer and `-c copy`, with a `duration` line for the intro so the clip starts exactly one frame after the submit frame.
- The result is accepted only with proof: the frame count is the sum, every frame time is kept, and the hash of every decoded frame of the post equals the hash of the same frame of the intro or the clip. For Mars: 634 of 634.
- If the streams do not match or the proof fails, the post is encoded once, in two passes, at `export.bitrateMbps`, and the record says why.

## Things found

- The intro file is small: about 0.63 Mbps, 366 kB for Mars. It was encoded with the film's settings (target 20 Mbps), but a still screen with a few changing glyphs does not need the rate. The post as a whole is 16.2 Mbps for Mars, because the clip keeps its own bits.
- Quality of the intro: the last two frames decode to about 46 dB against their PNG. That number is the cost of 4:2:0 color on thin colored edges. Against the same picture in lossless 4:2:0 the encode measures 73 dB.
- The clip's frame times, for the Builder. `concatCopy` in `tools/lib/encode.ts` writes no `duration` lines. At each joint of two parts ffmpeg then places the next part 507 ticks after the last frame, not 512 (time base 1/15360). `out/clips/mars.mp4` has two such steps: its duration reads 16.499349 s and its average frame rate 760320/25343, not 30/1. The frame count is right (495) and players show nothing of it. The post keeps the clip's frame times as they are, and the check compares against them. A `duration` line per part in `concatCopy` would remove it, but that file is not mine to touch.
- `manifest.events` of the skill counts frames at the scene's own 60 per second. All times in the records come from the per frame `states`, which are at 30 fps.
- `npm run looks -- --add` needs `--stop posts` for a file named after a stop, else the file is filtered out.

## Open

- The eight other posts wait for their clips. `npm run post` makes them, nothing else is needed.
- The text check with a fresh agent is the Builder's.
