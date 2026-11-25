# src/subs notebook

The subtitle layer of the narrated film on the page (MAIL 1319). Branch agent/subs. Owner: sky_builder.

## What is here

- `cues.json`: the 19 lines as given (words with film times on and off, t_in, t_out, t_end, rows). Rows are taken from it, never broken here.
- `font/subs-sans-medium.woff2`: Lato Medium 2.015 cut down to the characters of the 19 lines (kerning, ligatures and hinting kept), renamed inside to Subs Sans because the Open Font License keeps the name Lato for the unchanged font. `font/OFL.txt` is the licence.
- `metrics.json`: the font's heights in font units and the width of every word as PIL reads it at 108 px and 81 px (the type sizes of the three formats after subs.py's supersample). Other sizes scale the 108 px table.
- `look.ts`: subs.py's constants. `mt.ts`: the Mersenne Twister of numpy's RandomState. `layout.ts`: band, grid, word places, tiles, pills, the state of a line at a time, OpenCV's Gaussian kernel. `haze.ts`: the haze on its grid on the CPU. `layer.ts`: the passes. `mount.ts`: the font and the hook.
- `assets-src/subs/`: subs.py as received, the full ttf, `make.py` (font subset, width table, test fixture), `compare.py` (the page's frame beside subs.py's picture).
- `tests/subs.test.ts`, `tests/fixtures/subs.json`.

## How a frame is drawn (switch subs=1)

1. t = frame / fps (frame = k / rate). No line at t: nothing is drawn, no GL call.
2. Haze: CPU, grid of 13.5 cells to the em (480 by 101 at 16:9), into a float texture.
3. Words: on a line's first frame each word is drawn once with fillText on a 2D canvas, one cell a word, at subs.py's size (108 px) and supersample; a shader takes the area mean. Settled words go to the word plane with MAX; a word coming in is blurred (two passes, OpenCV's kernel) and shifted (subs.py's 1/32 px step).
4. Shadow: two separable Gaussian blurs of the word plane, OpenCV's kernels.
5. Over: the band of the canvas is copied to a texture; one shader lays haze, shadow and words over it in the encoded values, adds the dither, rounds to 8 bit itself and writes the band. No GL blending on the canvas.

## Decisions

- d1 The blurs are shader passes with OpenCV's kernels, not the 2D canvas filter (that blur is not OpenCV's and changes with the system).
- d2 The over is computed from a copy of the band, not by GL blending: blending at 8 bit can lose the dither and the half code.
- d3 The dither is a hash of pixel and frame number, not numpy's numbers for the frame: at most one code away from subs.py's.
- d4 The font inside is renamed (licence). The family name on the page is Subs Sans.
- d5 The hook is one field and two calls in src/core/engine.ts (after the post chain in drawFrame and renderLive) and one line in src/main.ts. FOREIGN LINES, its own commit.
- d6 The engine hash moves, because tools/lib/hashes.ts walks all of src.

## Log

- 22:36 UTC first state. Frame 99 (3.3 s) draft 1920 by 1080 against subs.py over the same frame: mean abs 0.27 of 255 in the band; haze away from letters 0.35 (0.27 against subs.py without its dither); at the letters 6.2 (edges only, no shift at 1/8 px: Chrome's text raster against FreeType's hinted one); outside the band 0.
