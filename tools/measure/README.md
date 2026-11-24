# Measures

`npm run measure -- --stop ID` writes `out/work/measure/<stop>.json` and prints one pass or fail line for each of G5, G13 and G17. Options: `--every K` samples every Kth frame for G13 (a quick look; the gate only accepts `--every 1`), `--only G5,G13`, `--tier T` for the G5 and G17 renders (default `final`), `--no-cover a,b` for stops whose dive and rise have no cover.

## G5, sanity

Each judged frame of the stop (the judged list filtered to its hold, dive, terrain and rise) is rendered in `formats.master` and `window.showcase.sanity()` is read right after the render. It reads the float frame before lens and grade. A frame passes when no pixel is invalid or infinite, and, in hold and terrain frames, when the body or relief covers at least `detail.minBodyCoverage` of the frame. These renders use the `nograin` view, which changes only the post chain, so the float frame is the same as in beauty.

## G13, texture detail

Every frame of the stop's hold and terrain, and every dive and rise frame outside the cover window, is rendered at the draft tier in `formats.master` with the `texels` view. In that view red is texels per screen pixel divided by two, so exactly one texel per pixel is red 0.5, and green says whether the pixel counts. A pixel counts when green is above one half. A counted pixel is soft when its red byte is under 127.5 times `detail.minTexelsPerPixel`. A frame passes when soft pixels are at most `detail.maxSoftPixelFraction` of counted pixels. A frame with no counted pixels passes and is listed. The worst ten frames are kept in the JSON.

## G17, real sharpness

For each judged hold and terrain frame, the frame is rendered at the final tier with the `nograin` view, because film grain would read as detail. The approved image (hero for hold, close for terrain) is centre cropped to the frame's aspect and resized to the frame size with Lanczos.

Both pictures become luma: 0.2126 R + 0.7152 G + 0.0722 B on sRGB values from 0 to 1. Fine detail is a band of spatial frequencies: the luma blurred a little (Gaussian, sigma 0.6 px) minus the luma blurred more (sigma 2.0 px). That keeps detail from about 0.08 to 0.3 cycles per pixel, so it ignores broad shading and also ignores single pixel noise and aliasing. The energy of a region is the mean of the squared band signal.

Both pictures are cut into the same 12 by 8 grid of tiles. A tile is used only when the approved tile has mean luma above 0.04 and energy above a floor (the larger of 2e-5 and 5 percent of the 90th percentile of approved tile energies), so black sky and flat areas do not decide the result. For each used tile the ratio is film energy over approved energy. The result is the median ratio over used tiles, with the 25th percentile beside it and the five worst tiles. A frame passes when the median is at least `detail.minSharpnessRatio`.

Checks of the definition: the approved image against itself gives 1.0; the same image blurred by a 1 px Gaussian gives about 0.29; the same image with added noise gives about 1.2, which is why grain is turned off first. `npx tsx tools/measure/selftest.ts` runs the G13 parsing tests on synthetic images and the identity test for G17.

## The report beside G13

`npm run measure -- --stop ID --carried 3804,3810-3812` is a report, not a gate: it changes no threshold and no pass rule, no gate reads it, and it leaves `out/work/measure/<stop>.json` alone. `--stop` is the stop whose material is asked; the frames may be any frames of the film. Each frame is rendered twice in `formats.master`: the `texels` view at the draft tier, as G13 does, and the `nograin` view at `--tier T` (default `review`). Both PNGs are kept in `out/work/measure/<stop>/` and the numbers in `out/work/measure/<stop>-carried.json`.

The frame is cut into a 32 by 18 grid, so a tile of the master is 60 by 60 pixels. A pixel is used when it counts in the texels view and every pixel within 6 px of it counts too, so a limb or a matte edge adds nothing. A tile is judged when at least half of its pixels are used. For each judged tile the report gives what the material says (the median reported texels per pixel and the share of soft pixels, with the limit of G13) and what the picture carries: the energy of the band of G17 (luma blurred with sigma 0.6 px minus luma blurred with sigma 2.0 px, the mean of its square over the used pixels) and the energy of the band below it (sigma 2.0 minus 6.0). A picture that is a small map drawn large keeps its coarse band and loses its fine one, so fine over coarse falls.

A tile is flagged when it says sharp (median at least `detail.minTexelsPerPixel`), is not dark (mean luma above 0.04) and carries nothing (band energy under 2e-5, the flat tile floor of G17). The line of a frame gives the soft share of G13, the tiles judged and dark, the median energy and the median fine over coarse of the tiles that say sharp and of those that say soft, and the flagged tiles. Under it, one line for each band of the report (under 1.25, 1.25 to under 1.9, 1.9 and over; the view cannot say more than 2) gives the same numbers for the tiles of that band, so the tiles nearest the limit of G13 stand alone. `tests/carried.test.ts` holds the definition on synthetic pictures.

## Long runs: a lost page, the record, the parts

None of this changes a measured number: the frames, the tier, the view, the rule and the thresholds are the same, and a frame is always drawn whole on one page.

A lost page. When the page or the browser is lost in a frame (`PageFailure`), the run prints `restart i of N at frame F on a new page: reason`, opens a new page, sets the view again and draws the same frame again. `--restarts N` (default 3) is the most a run does; after that it stops with the frame and the reason. `--page-frames K` leaves a page for a fresh one after K frames (default 0: never). The judged finals always get a page that has drawn nothing. This holds for G13, for the finals of G5 and G17 and for `--carried`. Every tenth G13 line says what the browser holds and what the machine has free.

The record. Each finished frame is written at once to `out/work/measure/<stop>.progress.jsonl` (for a part `<stop>.part-<label>.progress.jsonl`). A run that died is taken up by the same command: it says how many frames it took up and draws none of them again. A record is taken up only when its first line is this run's to the letter: engine hash, stop hash, format, assets, browser, machine, the cover, the texel tier and view, the finals' view, the `detail` block of the config and the hash of `tools/measure/texels.ts`. A judged final is taken up only at the same tier and, where G17 needs its picture, when the picture on disk has the recorded hash; G17 is then computed again from it. A torn last line is dropped. `--fresh` takes up nothing. The record is removed when the run ends well. `--carried` is not taken up.

The parts. `--part I/N` draws only the G13 frames whose place in the list is I - 1 counted round N (so the costly frames of a stop are spread over the parts) and writes `out/work/measure/parts/<stop>-part-I-of-N.json`; `--part finals` draws the judged finals of G5 and G17 and writes `<stop>-part-finals.json`. A part writes no `<stop>.json` and gives no verdict on G13. `npm run measure -- --stop ID --join FOLDER` (with the same `--tier`, `--every` and `--only` as the whole run it stands for) opens no browser: it reads the parts of the stop in FOLDER and writes the `<stop>.json` and prints the lines of a whole run. It refuses, naming the file and what is off: a part that is not of this tree's commit (unless `--commit SHA` names the parts' commit), engine hash, stops' hashes, format, assets, `detail` block or rule files (`tools/measure/texels.ts`, `tools/measure/g17.py`); parts that differ in browser, cover or step; another tier or view; a list of frames other than the one this build gives; a part missing or there twice; a frame missing or in two parts; the finals missing or there twice. The joined file has `run.joined` (file, machine and seconds of each part) where a whole run has `run`.

Test hooks: `--close-page-at F[,F]` closes the page and `--kill-browser-at F[,F]` kills the browser 300 ms into the draw of that frame, once.

## Film check

`npx tsx tools/measure/verify-film.ts --film FILE [--frames a,b,c]` counts the frames of a joined film with ffprobe, renders stills of the chosen frames and reports the PSNR of each decoded frame against its still.
