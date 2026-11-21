# 003 · Planet posts

Added 2026-11-20. Brandon wants nine short videos as well as the long film: one for the Sun and one for each planet. Each one opens with a prompt being typed into the Perplexity interface, then shows that stop.

This adds deliverables to Phase 6. It does not change the film, the nine clips, any round, any critic or any limit. It is not a stop and not a reason to pause work on a stop.

This addendum does not ask for changes to Mars or to the look. Do not run rounds on any stop because of it.

## What is delivered

| File | What it is |
| --- | --- |
| `out/clips/<stop>.mp4` | The stop's clip, as the kit already has it. No intro, no interface |
| `out/posts/intro-<stop>.mp4` | The intro alone |
| `out/posts/<stop>.mp4` | The post: the intro, then a hard cut to the first frame of the stop's clip |

Nine of each. A post is in `formats.master` at `film.fps`, encoded at `export.bitrateMbps`.

## Config

Add these keys to `config/showcase.json` and read them from there:

| Key | Value |
| --- | --- |
| `posts.introMaxSeconds` | 5 |
| `posts.readHoldSeconds` | 0.8 |
| `posts.introMaxTries` | 3 |
| `posts.checkMaxFixes` | 2 |
| `posts.prompts.sun` | Give me a hyperrealistic Sun using three.js |
| `posts.prompts.mercury` | Give me a hyperrealistic Mercury using three.js |
| `posts.prompts.venus` | Give me a hyperrealistic Venus using three.js |
| `posts.prompts.earth` | Give me a hyperrealistic Earth using three.js |
| `posts.prompts.mars` | Give me a hyperrealistic Mars using three.js |
| `posts.prompts.jupiter` | Give me a hyperrealistic Jupiter using three.js |
| `posts.prompts.saturn` | Give me a hyperrealistic Saturn using three.js |
| `posts.prompts.uranus` | Give me a hyperrealistic Uranus using three.js |
| `posts.prompts.neptune` | Give me a hyperrealistic Neptune using three.js |

## The intro

- Use the prompt typing skill of this workspace: the showcase team's skill that recreates the Perplexity interface in code and types a prompt out. Look for it once in the workspace's skill list. Use it as it is. Do not restyle it.
- The intro shows the stop's prompt from `posts.prompts` being typed into the prompt box, one character at a time, and then submitted. The text is exactly the config string.
- The full prompt stays on screen for at least `posts.readHoldSeconds` before it is submitted, so it can be read on a phone.
- The intro is at most `posts.introMaxSeconds` long.
- It ends on the submit. The next frame is the first frame of the stop's clip. No fade, no title, no other text.
- Each intro has its recipe beside it, as `kit/06-ASSETS.md` asks for a generated asset: the skill, its inputs and the prompt string.

Rules that change for the intro, and only for the intro:

- The Perplexity interface and name may appear, as the skill draws them. No other brand appears.
- "three.js" may appear in the typed text.

Every frame of the film and of the nine clips still carries no text, logo, caption or interface.

## If the skill is not there

- If the skill is not in the skill list, or an intro fails `posts.introMaxTries` times, do not imitate the interface by hand.
- Deliver the nine clips as the kit already says, write what is missing in `out/posts/README.md`, and list it under "Open items" with what was tried.
- This is not a blocker. The build completes.

## When and how

- A supporting agent may build the nine intros at any time from now, in its own folder, without holding up a stop. Show one intro frame inline in a status once the first intro exists.
- Add a harness command: `npm run post -- --stop ID`. It joins the stop's intro and the stop's clip into `out/work/posts/<stop>.mp4`. Where the two streams match it joins them without encoding the clip again. Where they do not, it encodes the post once at `export.bitrateMbps`. With no `--stop` it makes all nine.
- In Phase 6, after step 7: run `npm run post` for all nine from the clips of the frozen build, then `npm run keep -- --posts`, which copies the intros and the posts to `out/posts/` with their records.
- In Phase 6 step 9, `cut/CUES.md` also lists for each post: the time of the first key, the last key and the submit, and the time of the cut to the clip, so typing sound can be laid in.
- In Phase 6 step 10, `README.md` says where the posts are.
- In Phase 6 step 11, the review page shows the nine posts first, above the clips. The page's own size rule applies: where it cannot carry a post at full size it carries a smaller copy and says so.
- In Phase 6 step 13, a clip that is remade has its post joined again. An intro is not made again.
- A post is committed only in Phase 6, as the clips are. No file is over `repo.maxFileMb`.

## The one check

Once, after the nine intros exist:

1. Make one contact sheet per intro at `critics.phonePreviewWidthPx`, with a native-size crop of the prompt box from the frame before the submit.
2. Give the nine sheets to one fresh agent with this question, word for word: "Type exactly the text you can read in the text box in each image. Then list anything that looks broken: cut off text, overlapping text, a missing character, a wrong character."
3. An intro passes when the text typed back equals its config string and nothing broken is listed.
4. Fix an intro that fails and ask a fresh agent again, for at most `posts.checkMaxFixes` fix passes in all. After that, what is still wrong becomes an open item and the post is delivered as it is.

This check is not a round and does not count as one.

## QA items added to `kit/09-QA-GAUNTLET.md`

| Item | Evidence |
| --- | --- |
| Nine intros exist in `out/posts/`, each with its record and recipe, each at most `posts.introMaxSeconds` long | File list and durations |
| Nine posts exist in `out/posts/`, each in `formats.master` at `film.fps`, and each has as many frames as its intro and its clip together | Frame counts of all three files per stop |
| The first frame after the intro in each post equals the first frame of that stop's clip | A pixel comparison per stop |
| The text check passed for each intro, or what is wrong is listed under "Open items" | The agent's answers |
| No frame of the film or of any file in `out/clips/` shows text or interface | The existing check, run on the clips as well |

If the skill was not there, the first four items are listed under "Failed QA items" with the reason, and the build completes.

## The BUILD COMPLETE block

Add one line after `Clips: out/clips/`:

```
Posts: out/posts/ <nine posts, or what is missing>
```
