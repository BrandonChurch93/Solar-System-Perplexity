# Engine batch 19: frames that do not repeat

Branch `agent/engine-batch19`, cut from `agent/engine-batch18` 3189ca82, main `a67c9c34` (engine batch 18) merged in at `482de8a`. Task from the Builder's mails 59, 61 and 62 (22 Nov, 02:53 to 03:10 UTC). PART at 04:00 UTC, DONE when the audit, the shared fixes, the stop lists and the shared check are in.

## Working notes (read after a compaction)

Task as of mail 62: (1) audit every fragment shader for a `discard` or early `return` followed by `dFdx`, `dFdy`, `fwidth` or a `texture()` without a level, and for those inside a per pixel branch; shared code first, stop folders read only. (2) Fix shared code here, 53 draft frames byte equal against main `a67c9c34` where frames repeat today, Mars's four finals named, changed frames listed with pixel counts. (3) Per stop folder a list for the Builder: file, line, what is wrong, the change; Venus first. (4) A shared check under `tools/` that renders frames N times over fresh sessions and prints the count of distinct hashes per frame, with its run time.

What I found on my own before mail 62 (same cause as the Saturn agent, `agent/saturn` 7dc2542):
- Saturn 3594 at draft, 8 fresh pages: 7 different pictures, always inside the same 7 pixels at (1115 to 1117, 458 to 462), one level. Repeats inside one page differ as well.
- The stream of WebGL calls of the frame is the same in every render (hash of all calls and arguments), so the cause is below our JavaScript.
- Reading the sample target back after every draw: the sky and the stars are equal, the first draw that differs is always Saturn's haze shell (`Shell` in `src/stops/saturn/globe.ts`, 109440 indices), on frames 3465, 3567, 3594, 3840, 3866. Ten to seventeen pixels differ after it, most are covered by the globe later.
- The shell's fragment shader discards first and then calls `ringShadowAt`, which takes `dFdx(rho)`. With the `discard` moved to the last statement (patched at `shaderSource` in the page, no tree touched): 17 renders of the five frames, no draw differs, one hash per frame.
- That fix moves pictures: 3 to 8 pixels by 1 to 2 levels on 3465, 3567, 3594, 3840, and 36 pixels by up to 26 levels on 3866 (limb pixels whose random part was large).

Scratch tools (untracked, `out/scratch/`): `rep.ts` (frames over fresh pages, hashes), `tr.ts` (hash of the WebGL call stream), `tr3.ts` (`--frames a,b --n pages --count draws --patch file.json --dir out`: reads the sample target after each draw and counts pixels that differ from the first render of the same frame; writes the fragment sources as `frag-HASH.glsl`). Results under `/tmp/rep/`.
