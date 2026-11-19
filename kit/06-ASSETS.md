# 06 · Assets

Three kinds of asset go into this film: the approved images, assets generated from them, and third-party files.

## The approved images

- `references/approved/` holds two images per stop: `<stop>-hero.png` and `<stop>-close.jpg`. The paths are in `stops` in the config. `contact-sheet.jpg` shows all 18.
- Each close image has its generation prompt beside it. The hero prompts are in `references/style-pass/NOTES.md`.
- Brandon approved these. They are the target for every judged `hold` and `terrain` frame.
- They may be used in the film: unprojected into wrap maps, turned into reliefs, used as style inputs for every generated asset.
- Never edit the files in `references/approved/`. Work on copies under `out/work/` or in a stop's asset folder.
- The other takes in `references/drafts/` may be used as extra style inputs or as material for a far side, a patch or a moon. They are never a target.

## Generated assets

Made with the workspace's image tools: wrap maps, far sides, detail patches, relief layers and the paint behind them, moon maps, ring profiles, cloud and night maps, the Sun's surface and plasma, the graded sky.

### Rules

- The approved image for the view is always one of the inputs, as the style to match.
- Say what must not change. An image tool asked to add resolution or to relight evenly must leave every feature where it was.
- Check that it obeyed: scale the result back to the size of its input and compare. If features moved, appeared or vanished, reject the take.
- No text, watermark, border, logo or stray object in any asset. Look for them at native size.
- No baked stars in anything that is not the sky.
- At most `assets.maxTakesPerAsset` takes per asset in one round, and the same number per phase for an asset made outside a round. Keep the best and move on. A better take can be made in a later round if a critic asks for it.
- Rejected takes stay under `out/work/`. Only the chosen take is committed, once, at the end of the round.
- The reference run found one image model clearly more cinematic than the others for this look. Its name and settings are in `references/style-pass/NOTES.md`. Start there, and use another model when a job needs something that one does badly, such as keeping a layout exactly.

### Sizes and formats

- Sizes come from `assetSets` in the config. Build the `full` set first and derive the `web` set from it.
- Those sizes are for the color maps the camera gets close to. Night lights, masks, height and normal maps can be half that size or less. A relief layer is cropped to what it holds, not stored at the size of the whole image.
- Two `full` sets and the sky have to fit in memory together. Measure it in Phase 0 and again on Mars, and size the maps so they do.
- Color maps in a compressed format that shows no blocking at native size.
- Height and depth need more than 8 bits. A browser may quietly reduce a 16 bit image to 8 when it decodes it, so ship these as raw numbers loaded straight into a data texture, and check that the values arrive intact.
- No file over `repo.maxFileMb`. Split a map into tiles if it would be.
- A GPU texture format may be used if it helps memory. It is not required.

### Tools for resolution and depth

- Adding resolution without redrawing, and estimating depth, are jobs for small models that run on a CPU. Phase 0 finds or installs one of each and tests it.
- Run them in tiles if an image is too large for memory.
- An estimated depth map is a starting point. Look at it, fix what is wrong by hand or with masks, and log what you changed.

### Recipes

Every generated asset has its recipe in `assets-src/<stop>/RECIPE.md`, text only:

- The output file.
- The tool and the model.
- The input files, by path.
- The exact prompt.
- Which take was kept and why.
- The checks it passed.

A recipe is complete enough that a fresh agent could make the asset again.

## Third-party files

Real maps and data, used where they help.

### What they are for

- A layout guide for the far side of a globe and for the parts of a wrap map the approved hero image does not show.
- Height data for relief on rocky bodies.
- The star map under the sky.
- A real map is never shown as it is. It is painted into the approved style first.

### Where to look

Check the license on each asset's own page when you download it. These are starting points, not guarantees.

| Need | Source to try first |
| --- | --- |
| The Milky Way's glow | NASA Scientific Visualization Studio, Deep Star Maps 2020. Take a version no larger than the sky needs. The largest files run to gigabytes |
| Star positions, if the seeded generator is not used | A public domain bright star catalog |
| The Moon, color and height | NASA Scientific Visualization Studio, CGI Moon Kit |
| Earth: land and sea, night lights, clouds | NASA Visible Earth: Blue Marble Next Generation, Black Marble |
| Mars: color and height | USGS Astrogeology: Viking global color mosaic, MOLA elevation |
| Mercury | USGS Astrogeology: MESSENGER global mosaics |
| Jupiter and Saturn cloud maps | NASA Photojournal: Cassini global maps |
| Io, Titan, Triton, Miranda, Ariel, Phobos | USGS Astrogeology and JPL planetary maps |
| Venus cloud tops, Uranus, Neptune | Little usable real data exists. Generate these from the approved images |

### Rules

- The rules on what is allowed are in `AGENTS.md`.
- Every third-party file lives under `public/assets/third-party/`, or under `references/cache/` if it is only an input. Nothing else lives in `public/assets/third-party/`.
- `ASSETS.md` at the repo root is the ledger. One row per third-party file that the app ships or that fed a generated asset: file, what it is, source URL, license, credit line, date fetched.
- A credit line in the ledger is a record. It never appears in the film.

## What is committed

- Everything under `public/assets/` and `assets-src/`.
- Not the takes that were rejected, not downloads that are only inputs, not frame dumps. Those stay under `out/work/` and `references/cache/`.
