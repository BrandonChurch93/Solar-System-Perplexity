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

1. t = frame / fps in seconds, where frame is the film frame the engine draws (k / rate in capture and export, so t = k / 60 at rate 2; the fractional frame of the clock in autopilot). Word windows, fades, rise, blur, haze and dither are functions of t and of the frame size only. No count of drawn frames, no wall clock. No line at t: nothing is drawn, no GL call.
2. Haze: CPU, grid of 13.5 cells to the em (480 by 101 at 16:9), into a float texture.
3. Words: on a line's first frame each word is drawn once with fillText on a 2D canvas, one cell a word, at subs.py's size (108 px) and supersample; a shader takes the area mean. Settled words go to the word plane with MAX; a word coming in is blurred (two passes, OpenCV's kernel) and shifted (subs.py's 1/32 px step).
4. Shadow: two separable Gaussian blurs of the word plane, OpenCV's kernels.
5. Over: the band of the canvas is copied to a texture; one shader lays haze, shadow and words over it in the encoded values, adds the dither, rounds to 8 bit itself and writes the band. No GL blending on the canvas.

## Decisions

- d1 The blurs are shader passes with OpenCV's kernels, not the 2D canvas filter (that blur is not OpenCV's and changes with the system).
- d2 The over is computed from a copy of the band, not by GL blending: blending at 8 bit can lose the dither and the half code.
- d3 The dither is a hash of the pixel and of round(t times 60000), not numpy's numbers for the frame: at most one code away from subs.py's, and the same at 30 and at 60 frames a second for the same film time.
- d4 The font inside is renamed (licence). The family name on the page is Subs Sans.
- d5 The hook is one field and two calls in src/core/engine.ts (after the post chain in drawFrame and renderLive) and one line in src/main.ts. FOREIGN LINES, its own commit.
- d6 The engine hash moves, because tools/lib/hashes.ts walks all of src.

## Log

- 22:36 UTC first state. Frame 99 (3.3 s) draft 1920 by 1080 against subs.py over the same frame: mean abs 0.27 of 255 in the band; haze away from letters 0.35 (0.27 against subs.py without its dither); at the letters 6.2 (edges only, no shift at 1/8 px: Chrome's text raster against FreeType's hinted one); outside the band 0.
- 22:40 UTC MAIL 1325: the four departures and the foreign lines stand; letters' edges accepted; asked for frames 360 and 1215, proof a, the cost, the 60 fps proof and the address; ruled export and autopilot yes, fly mode no.
- d7 The switch is honoured in capture, export and autopilot, not in mode=live (MAIL 1325 item 6). The call in renderLive (engine.ts 307) is then never reached with a layer; it is the Builder's line to keep or drop.
- d8 The layer's draw takes t only. mount.ts turns the engine's frame into t = frame / config.fps.
- 22:45 UTC a fault found and mended: three's state cache skipped the bind of the read framebuffer before the copy of the band, so every frame after the first of a session read a stale band. The bind is now a raw GL call. Clear colour and autoClear are saved and put back.
- 22:50 UTC the haze fill made faster (the two time slices of each lattice blended once a frame, the blur only over rows and columns that carry a star, power of two wraps by mask): 67 to 77 ms a frame in node for 3840 by 2160 here, 42 to 57 ms in the page. The grid still equals subs.py's to 2e-4 (unit test).
- 22:52 UTC cost at 3840 by 2160, frame 360 (t 12.0 s, 11 words shown, 1 coming), eight draws: 42 to 57 ms to submit (CPU haze and the GL calls); 2.9 to 3.25 s until the canvas is done on this machine, whose GL is SwiftShader (software, no GPU). The whole draft frame without the layer takes 27.6 s on the same machine.
- `assets-src/subs/step.py LINE WORD FPS DIR K...` prints a word's fade over frames and writes the crops side by side.
