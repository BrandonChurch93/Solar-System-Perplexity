# 00 · Read me first

Read `AGENTS.md` at the repo root before this file.

## Reading order

| File | What it settles |
| --- | --- |
| `config/showcase.json` | Every number, the list of stops, the timeline |
| `kit/01-FILM.md` | What the video is, segment by segment |
| `kit/02-STOPS.md` | Each of the nine stops: its two approved images, its spot, its moons, its motion |
| `kit/03-METHOD.md` | How each kind of picture is made: orbit view, terrain view, dive, travel, sky |
| `kit/04-LOOK.md` | The bar, the lens, the grade, and the ladder of techniques to climb when a picture falls short |
| `kit/05-ARCHITECTURE.md` | Code structure, determinism, modes, the harness, Export |
| `kit/06-ASSETS.md` | The approved images, generated assets, third-party sources and licenses |
| `kit/07-QUALITY-BAR.md` | Gates, critics, the pass bar, round limits |
| `kit/08-BUILD-ORDER.md` | The phases, the Mars review, and what ends the build |
| `kit/09-QA-GAUNTLET.md` | The final acceptance list |
| `kit/10-KICKOFF.md` | For Brandon. Not instructions for the Builder |
| `kit/PROGRESS.md` | The Builder's memory |
| `kit/addenda/` | Numbered changes made after the kit was written |

## When files disagree

| Topic | The file that wins |
| --- | --- |
| Any number, any time, any file path of an approved image | `config/showcase.json` |
| What a stop shows and where its spot is | `kit/02-STOPS.md` |
| Whether something passes, and how many rounds it gets | `kit/07-QUALITY-BAR.md` |
| Code structure and determinism | `kit/05-ARCHITECTURE.md` |
| How a picture should look | The approved image for that view, then `kit/04-LOOK.md` |
| How a picture is made | `kit/03-METHOD.md`, unless the ladder in `kit/04-LOOK.md` has moved you to another technique |
| What happens on screen and when | `kit/01-FILM.md` |

- An addendum beats every file above on its own topic. A higher number beats a lower one.
- If a conflict is still open, pick the reading that gets the frame closer to its approved image and log the choice.

## Working protocol

1. Read `kit/PROGRESS.md`, then every file in `kit/addenda/`.
2. Find the current phase in `kit/08-BUILD-ORDER.md`.
3. Re-read that phase's "Read first" files from disk.
4. Do the steps. Verify the gate with evidence, not with a feeling.
5. Log, commit, push, publish, write the progress note.
6. Go to the next phase without waiting, unless `AGENTS.md` says to stop.

## Vocabulary

| Word | Meaning |
| --- | --- |
| Stop | One body's part of the film. The ids are in `stops` in the config |
| Segment | One timed part of the film from `segments` in the config. Its kind is `hold`, `dive`, `terrain`, `rise`, `travel`, `retreat`, `lookback` or `fade` |
| Orbit view | The whole body in true 3D, as seen in a `hold` |
| Terrain view | The low flight over the stop's spot, as seen in a `terrain` segment |
| Spot | The place on a body where its terrain view happens |
| Cover | The short moment inside a `dive` or `rise` where the film hands over between the orbit view and the terrain view |
| Approved image | One of the 18 images in `references/approved/`. The hero image is the target for the orbit view. The close image is the target for the terrain view |
| Wrap map | A texture that wraps a globe |
| Detail patch | A higher resolution texture laid over the wrap map at the spot, so a dive stays sharp |
| Relief | A terrain view made from the approved close image, given real depth so the camera can move through it |
| Set | Everything one stop needs in memory: its globe, moons, rings, patches and relief |
| Frame | One output image of the film. Index 0 is the first |
| Tier | A quality level from `tiers` in the config |
| Sample | One jittered sub-render. A frame is the average of its samples |
| Asset set | A size class of textures from `assetSets` in the config: `web` or `full` |
| Still | A single frame rendered for review |
| Judged frame | A still on the fixed list the critics score |
| Comparison image | A judged frame beside its approved image, made by `npm run compare` |
| Machine check | An automated check on the code. Red means a bug |
| Measure | An automated number on the picture. Red means a severe issue for the round, not a blocker |
| Deliverable check | An automated check on a file that takes long to make, run only at the end of the phases that name it |
| Gate | What has to be true before a phase ends. Listed at the end of each phase in `kit/08-BUILD-ORDER.md` |
| Critic | A fresh agent that scores files against a rubric |
| Round | One pass of build, gate, pack, critics, fixes |
| Open item | An issue still unresolved when a limit was reached |
| Chunk | One segment of the film, encoded so chunks join without being encoded again |
| Harness | The scripts in `tools/` that render frames in a headless browser |
| Export | The in-browser mode that renders and encodes the film on a computer with a GPU |
