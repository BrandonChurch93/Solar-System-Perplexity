# Local render: the 4K 60 fps release of the Solar System Fly-Through

This file is for Claude Code on Brandon's own machine. It holds everything in order. Read it to the end before you run anything.

The release of this film is the 4K film at 60 frames a second, drawn on Brandon's own graphics card. The cloud machines of this project draw in software and need days for it; a graphics card needs hours. The 1080p film at 60 frames a second is the second run, or the fallback when 4K does not work.

## Who you are working with

Another agent, the Builder, leads this project from a cloud chat and cannot see this machine. Brandon sits at this machine. Work on your own and ask Brandon only for a password, a sign in, a system permission prompt, or the word "go" where this file says so.

## Rules

- Do not edit any file in this repo. Do not fix code or shader errors yourself. Copy the full error text into your report; the Builder fixes it at the source.
- Do not commit and do not push. The only thing you upload is the release in step 9.
- Run only the commands in this file, with the flags written here. Do not try other flags.
- The whole film is drawn on one machine. Frames from this machine are never mixed with frames from another machine or from the cloud.
- Step 2 (the render) starts only after step 1 (the test) has ended with the verdict PASS and Brandon has looked at the test pictures and said "go". With the verdict LOOK or STOP you stop, and Brandon takes the report to the Builder.
- Nothing here changes the picture, the cut, the sound or the subtitles. They are approved. The tools only draw the approved film at more frames and more pixels.
- Use the Windows desktop first (Part A). The MacBook (Part B) is second.

## What the run makes

Step 2 leaves these files in `out/release/`:

| File | What it is |
|---|---|
| `Solar System Fly-Through - Without Prompt 4K 60 fps - 3840x2160.mp4` | The release: 3840 by 2160, 60 frames a second, 3:00, with the approved sound and subtitles |
| `Solar System Fly-Through - Without Prompt 60 fps from the 4K picture - 1920x1080.mp4` | The same film made smaller, for the review page |
| `finish-report.json` | The measured values of both films |

## Part A: the Windows desktop with the RTX 5080 (start here)

Use a native Windows shell: PowerShell, or the Git Bash that Claude Code uses on Windows. Do not use WSL. Inside WSL the browser is a Linux browser that does not draw on the card the way the film needs, and the test stops there.

### A1. Tools

Run these and note the answers:

```
node -v
git --version
ffmpeg -version
nvidia-smi
```

Node must be 20 or newer. `ffmpeg -version` must show `--enable-libx264` and `--enable-libvpx`. Google Chrome must be installed. What is missing, install with winget, then open a new shell so the new program is found:

```
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
winget install --id Gyan.FFmpeg -e
winget install --id Google.Chrome -e
winget install --id GitHub.cli -e
```

If a new program is still not found after a new shell, tell Brandon to close and open Claude Code once.

### A2. The project

Pick a folder on a drive with at least 80 GB free. If the repo is not on this machine yet:

```
git clone --depth 1 -c core.autocrlf=false https://github.com/BrandonChurch93/Solar-System-Perplexity.git
cd Solar-System-Perplexity
npm ci
```

If it is here already, in its folder:

```
git pull --ff-only
npm ci
```

The repo is private. If git asks for a sign in, Brandon signs in (a browser window opens, or run `gh auth login` and then `gh auth setup-git`).

### A3. Step 1: the test (draws test frames only, no film)

Before it, close games and other programs that use the graphics card. Then:

```
node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080"
```

A Chrome window opens and closes several times. Leave it alone and do not minimize it; it may sit behind other windows.

What the test does:

1. It reads the machine and stops inside WSL.
2. It proves that the code is the approved build (engine hash `a455bc02904b0d42`) and fetches the large handoff files (the subtitle strips, the sound, the reference frames) from the branch `handoff-local-render-assets`, each proved by size and sha256.
3. It proves that ffmpeg can encode with libx264 and can read the see through subtitle strip.
4. It draws 6 small frames, 24 frames at 1920 by 1080 and 13 frames at 3840 by 2160 with the film's own capture tool.
5. It compares every frame with the same frame of the approved film, writes side by side pictures, and works out the hours and the disk the whole film needs.

How the test proves that the film is drawn on the graphics card and not in software:

- The capture tool asks the browser page that draws the film for the name of its graphics (the WebGL value UNMASKED_RENDERER). With `--expect-gpu "RTX 5080"` the tool stops before the first frame when that name does not hold the words "RTX 5080". It also stops when the name is a software renderer (SwiftShader, llvmpipe, Microsoft Basic Render Driver). The name is written to the report and to `manifest.json` of every run.
- While frames are drawn, the test reads `nvidia-smi` every two seconds and writes the busiest value and the most memory in use to the report. A card that stays idle while frames are drawn gives the verdict LOOK.
- The time per frame is in the report. In software a 4K frame of this film takes many minutes.

The test ends with one line: `VERDICT: PASS`, `VERDICT: LOOK` or `VERDICT: STOP`. Its files:

- `out/work/capture-check/REPORT.md` (the whole report in plain words)
- `out/work/capture-check/report.json` (the same as numbers)
- `out/work/capture-check/side/` (side by side pictures: the approved film left, this machine right)

### A4. Report for step 1

Give Brandon one block he can copy, with:

- the answers from A1 and the commit (`git rev-parse HEAD`)
- the full text of `out/work/capture-check/REPORT.md`
- if the test stopped early: the full error text, uncut

Then open the folder `out/work/capture-check/side/` for him (`explorer out\work\capture-check\side` on Windows) and ask him to look at the 4K pictures at full size. Then stop and wait.

- Verdict PASS and Brandon says "go": do step 2.
- Verdict LOOK or STOP, or Brandon does not like a picture: stop. Brandon takes the report to the Builder. Change nothing yourself.

### A5. Step 2: the render (only after "go")

Keep the machine awake for the run. Note the old value first, then switch sleep off, and set the old value back when the run has ended:

```
powershell -NoProfile -Command "powercfg /query SCHEME_CURRENT SUB_SLEEP STANDBYIDLE"
powershell -NoProfile -Command "powercfg /change standby-timeout-ac 0"
```

The render. It draws 10,800 frames at 3840 by 2160 and encodes them in parts of 600 frames; the frame pictures of a part are removed when its part is proved:

```
node node_modules/tsx/dist/cli.mjs tools/capture.ts --format uhd --rate 2 --tier final --expect-gpu "RTX 5080"
```

- If it stops for any reason, run the same command again. It goes on after the last finished frame.
- Do not minimize the Chrome window, do not lock the screen, and do not start a game while it runs. Switching the monitor off by its button is fine.
- When it ends, the captured film is `out/work/capture/uhd-r2-final/grand-tour-uhd-60fps.mp4` and its record is `out/work/capture/uhd-r2-final/manifest.json`.

Then the finish, which lays the approved subtitles over the picture, adds the approved sound and writes the two release files:

```
node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts
```

Its last line must be `FINISH: PASS`. With any other last line, stop and report.

Set sleep back to the old value (in minutes; the query above printed it in seconds as "Current AC Power Setting Index"):

```
powershell -NoProfile -Command "powercfg /change standby-timeout-ac <old minutes>"
```

### A6. Step 9: bring it back

The Builder picks the release up from a GitHub release of this repo (private, like the repo). In the repo folder:

```
gh release create local-render-4k60 --title "Local render 4K 60 fps" --notes "Drawn on Brandon's machine. See finish-report.json." "out/release/Solar System Fly-Through - Without Prompt 4K 60 fps - 3840x2160.mp4" "out/release/Solar System Fly-Through - Without Prompt 60 fps from the 4K picture - 1920x1080.mp4" out/release/finish-report.json out/work/capture/uhd-r2-final/manifest.json out/work/capture-check/REPORT.md out/work/capture-check/report.json
```

If `gh` is not signed in, Brandon runs `gh auth login` once. If the upload fails, do not try another way: leave the files where they are and tell Brandon the full path of `out/release/`. He can then drag the 1920x1080 film and the three small files into the Builder chat.

### A7. Report for step 2

One block with: the last 40 lines the render printed, the whole output of the finish, the full text of `out/release/finish-report.json`, the address of the release (or the path of `out/release/`), and the free disk space.

### A8. Cleanup

Delete nothing until the Builder has confirmed that the release arrived and is good. Then the render files can go: the folder `out/work/capture/` and the folder `out/work/capture-check/`. Keep `out/release/`.

### A9. Second run, or fallback: 1080p at 60 frames a second

Only when Brandon or the Builder asks for it, or when the 4K test ends with STOP for a reason that is about 4K only. Same rules, same machine for the whole film:

```
node node_modules/tsx/dist/cli.mjs tools/capture.ts --format master --rate 2 --tier final --expect-gpu "RTX 5080"
node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts --format master
```

It writes `out/release/Solar System Fly-Through - Without Prompt 60 fps - 1920x1080.mp4`. The captured film is `out/work/capture/16x9-r2-final/grand-tour-16x9-60fps.mp4`.

## Part B: the MacBook Pro with the M4 Pro (second)

Same steps and the same rules as Part A, with these differences.

- Tools: `brew install node ffmpeg gh` for what is missing; Google Chrome must be installed. Record `sw_vers`, `sysctl -n machdep.cpu.brand_string`, `node -v`, `ffmpeg -version`, `df -h ~`.
- Clone into the home folder with the same clone command, then `npm ci`.
- Keep the Mac on power. Start `screen` or `tmux` first, so the run survives a closed window.
- The name of the graphics is Apple's, so the words are "Apple":

```
caffeinate -is node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "Apple"
```

- Step 2 on the Mac, only after PASS and "go":

```
caffeinate -is node node_modules/tsx/dist/cli.mjs tools/capture.ts --format uhd --rate 2 --tier final --expect-gpu "Apple"
caffeinate -is node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts
```

- Open the pictures with `open out/work/capture-check/side`.
- Disk: see "Disk" below. Run `df -h ~` before the run and after every hour. Under 15 GB free, stop the run with Ctrl-C and report.
- Expect the capture tool to stop at its machine check on the Mac: see the first line of the table of unknowns for the Mac.

## Disk

DISK_SECTION

## What is measured, what is stated, what is unknown

MSU_SECTION

## If something goes wrong

- Copy the full text of the error. Do not shorten it.
- Do not change flags, files or system settings to get around it.
- Tell Brandon which step stopped. He takes it to the Builder.
