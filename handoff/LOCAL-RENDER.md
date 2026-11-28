# Local render: the 4K 60 fps release of the Solar System Fly-Through

This file is for Claude Code on Brandon's own machine. It holds everything in order. Read it to the end before you run anything.

The release of this film is the 4K film at 60 frames a second, drawn on Brandon's own graphics card. The cloud machines of this project draw in software and need days for it; a graphics card needs hours. The 1080p film at 60 frames a second is the second run, or the fallback when 4K does not work.

## Tonight's run: the MacBook Pro first, the whole film, nobody waiting

This section is the order for the run that starts on the evening of 2026-11-27 (Mountain Time). Where it differs from a line further down, this section holds.

Brandon's own words for this run: he is on his MacBook Pro, not the Windows desktop, and he is away for many hours. "Do not stop after the short test and do not wait for me: this message is my go for the full 4K 60 fps render. If a check fails, fix it yourself and keep going, and only give up if the frames come out wrong. Keep the Mac awake until it is done. When it finishes, publish the result the way the file says and write a short log of what you did and how long it took."

What that means in this file:

- The machine is the MacBook Pro with the M4 Pro. Do Part B. Part B names only the differences, so read Part A with it.
- The go for the full render is given. No step waits for a person: no "go", no look by Brandon at the test pictures, no question to him. Every line further down that says "stop and wait", "ask Brandon", "tell Brandon" or "only after go" is replaced by the rules of this section. You look at the test pictures yourself.
- The short test still runs first. It takes minutes, and it is the one check that keeps a wrong film from being drawn for hours.
- Fix what fails yourself and go on; the rules for that are below. Give up only when the frames come out wrong or cannot be drawn on the Mac's graphics chip.
- The Mac stays awake from the first command to the end of the upload.
- At the end: the release `local-render-4k60-mac` and a short log.

### The commands of this run, in order

Tools and clone first, as Part B and A2 say (the repo is public, the clone needs no sign in), then `npm ci`. All commands run in the clone. Each long command is a background task with its own log, as the Rules say. Wait for each to end before you start the next.

Before the first long command, keep the Mac awake between the commands too. Start this as a background task of its own and end it with `killall caffeinate` after the log is written:

```
caffeinate -dis -t 259200
```

The Mac must be on power with its lid open. `pmset -g batt` shows whether it is on power; write the answer into the log. If it is on battery, go on all the same and say so in the log.

1. The test (minutes):

```
caffeinate -dis node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "Apple" --ignore-limits >> capture-check.log 2>&1
```

2. Read the verdict by the rules below and go straight on. The render (hours), then the finish:

```
caffeinate -dis node node_modules/tsx/dist/cli.mjs tools/capture.ts --format uhd --rate 2 --tier final --expect-gpu "Apple" --ignore-limits >> render-uhd.log 2>&1
caffeinate -dis node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts >> finish.log 2>&1
```

The last line of `finish.log` must be `FINISH: PASS`.

3. The upload:

```
caffeinate -dis gh release create local-render-4k60-mac --title "Local render 4K 60 fps (MacBook Pro)" --notes "Drawn on Brandon's MacBook Pro. See finish-report.json." "out/release/Solar System Fly-Through - Without Prompt 4K 60 fps - 3840x2160.mp4" "out/release/Solar System Fly-Through - Without Prompt 60 fps from the 4K picture - 1920x1080.mp4" out/release/finish-report.json out/work/capture/uhd-r2-final/manifest.json out/work/capture-check/REPORT.md out/work/capture-check/report.json >> upload.log 2>&1
```

4. The log (below).

### Why `--ignore-limits` is in these commands, and its one condition

The capture tool compares the graphics limits of the machine with a list of needs and stops when one is too small. One need is a point size of 1,000 pixels (`config/showcase.json`, `smooth.machine.pointSize`), and Apple graphics is stated at 511. That need is a stated safety number, not a measured one. The points this film draws are the stars, at most 16 reference pixels, and the far bodies, 30 reference pixels, each times the size factor of the frame: about 60 pixels at 4K (read in `src/space/sky.ts`, `src/bodies/farpoint.ts` and `src/bodies/standin.ts`). So the Builder allows `--ignore-limits` on the Mac, for this one line only:

```
its largest point is N pixels and the film needs 1000
```

The condition: after the test, `out/work/capture-check/REPORT.md` holds a line with the words "the machine is under the film's needs and --ignore-limits let it pass", followed by the needs that are not met.

- The point line is the only need named there: go on. This line makes the verdict LOOK, so LOOK is the expected verdict on the Mac.
- Another need stands there as well (texture, render buffer, viewport, samples, texture units, vertex attributes, a lacking extension): give up. Such a machine draws another film.
- The line is not there at all: the Mac meets every need. Go on; the flag does nothing then.

### The verdict, without a person

`VERDICT: PASS`: go on.

`VERDICT: LOOK`: read every line under "Verdict" in the report. Go on when each of them is one of these:

- The `--ignore-limits` line with the point size only (above).
- A frame "differs from the approved picture more than an encode explains". Open the side by side picture of that frame in `out/work/capture-check/side` and judge it yourself. Go on when it is the same picture: the same body at the same place and size, the same sky, the same rings, the same colours, with differences only in fine grain, in the brightness of single stars or in the smoothness of edges. Give up when a body, the sky or the rings are missing, shifted, black or garbled, or the colours are plainly other.
- The hours of the full run are above the mark. Go on: Brandon has said the hours cost him nothing.
- The disk has less free than the report wants. Go on when `df -h ~` shows 60 GB free or more (the peak of the 4K run is stated at 25 to 50 GB). With less, free space first, but only by removing what this run or its tools made (`brew cleanup`, `npm cache clean --force`, older `out/work` folders of an older clone of this repo). Never delete a file of Brandon's. With under 60 GB free after that, give up.
- Any other LOOK line: read it, and go on unless it says that frames are wrong.

`VERDICT: STOP`: read the lines, fix what is the machine's, and run the test again, as often as it takes:

- Node older than 20, ffmpeg missing or without libx264 or libvpx-vp9, Chrome missing: install them (`brew install node ffmpeg`, `brew install --cask google-chrome`), open a new shell, test again.
- Tracked files differ, the engine hash differs, a handoff file is missing or has another sha256: make a fresh clone in a new folder with the clone command of A2, `npm ci`, and test again there.
- The capture tool stopped in a draw test: its own last lines say why. A browser that did not start, a timeout or a network error: start the test again. After three tries with the same error see "Fixing a tool" below.

Give up, without a render, when one of these still stands after your fixes:

- The graphics name does not hold "Apple", or it names a software renderer. The film would then be drawn without the graphics chip, for weeks, and would differ.
- A frame "is another picture than the approved one" and your own look at the side by side picture agrees.
- A frame cannot be compared or is not written, three tries in a row.

"Give up" means: start no render, write the log with the full report and your reasons, leave everything on the disk, and end. Do not wait for an answer.

### Without brew, without a password

Nothing in this run may wait for Brandon's password. If `brew` is missing or an install asks for a password:

- Node: the official tar file from https://nodejs.org unpacked in the home folder, with its `bin` folder put first in the PATH of your shell.
- ffmpeg and ffprobe: a full static build for the Mac unpacked in a folder of your own and put in the PATH. The test proves that it has libx264 and libvpx-vp9.
- Chrome: `npx @puppeteer/browsers install chrome@stable`, then pass `--browser "<full path of the Chrome program>"` to the test and to the render. This flag is allowed for that.
- `gh`: not needed before the upload. Without it, see "The upload and the log".

### Fixing a tool

If a tool of this repo fails on the Mac for a reason of the machine (a path, a program name, a permission, a browser flag) and nothing outside the repo cures it, you may change files in `tools/` only, as little as possible. Then commit the change in the clone (`git -c user.name=local -c user.email=local@local commit -am "local tool fix"`, no push) so that the clean clone check of the test passes, run the test again, and copy the diff into the log.

Never change `src/`, `public/`, `config/`, `index.html`, `vite.config.ts` or `handoff/`. These are the film and its proof; the tools check them by hash, and a changed film is a wrong film. Never change the frame size, the rate, the tier, the samples or the frame numbers of the run.

### During the render

- A stopped render continues where it stopped when the same command is started again. If the task ends before the film is whole (the browser crashed, the shell was lost, the disk was full), start the same command again. Do not start from zero and do not change a flag.
- Every hour: `df -h ~` and the last lines of `render-uhd.log`. Under 15 GB free: end the task, free space as written above, start the same command again.
- If `finish.log` does not end with `FINISH: PASS`: read what it names, cure it (a missing part: start the render command again, it draws only what is missing; a missing tool: install it), and run the finish again. Give up on it only when it names wrong frames.

### The upload and the log

- If `gh` is missing or not signed in, do not wait. Leave the files where they are and write their full paths into the log; Brandon uploads when he is back.
- If `gh` answers that the release or the tag exists already: put `-2` behind `local-render-4k60-mac` and start the upload again.
- The log is the file `out/release/local-render-log.md` in the clone. It holds: the machine (`sw_vers`, the chip, the memory, the graphics name from the report, power or battery); the start and end time of the test, the render, the finish and the upload, and the hours in all; the verdict of the test with every LOOK and STOP line and what you did about each; every fix, with the diff for a tool fix; the seconds per frame; the last line of `finish.log`; and the address of the release or, without an upload, the full paths of the files.
- When the upload worked, add the log to the release: `gh release upload local-render-4k60-mac out/release/local-render-log.md`. Then end the keep awake task with `killall caffeinate`.
- Your last message to Brandon is the log, in short.

## Who you are working with

Another agent, the Builder, leads this project from a cloud chat and cannot see this machine. Brandon sits at this machine, except on the run of the first section, where he is away and nothing waits for him. Work on your own and ask Brandon only for a password, a sign in, a system permission prompt, the word "go" where this file says so, or another thing that this file names as his to do.

## Rules

- Do not edit any file in this repo. Do not fix code or shader errors yourself. Copy the full error text into your report; the Builder fixes it at the source.
- Do not commit and do not push. The only thing you upload is the release in step 3.
- Run only the commands in this file, with the flags written here. Do not try other flags. On the run of the first section the fixes named there are allowed as well.
- Some commands here run longer than a shell tool waits: the test (minutes), the render (hours), the finish and the upload (up to an hour each). Start each of them as a background task of your shell tool (in Claude Code: the Bash tool with `run_in_background`). On Windows start them in Git Bash (the Bash tool), not in PowerShell: Windows PowerShell writes such a log in another encoding, and the reads of its last line then go wrong. Each of these commands writes its output to a log file in the repo folder. Read the last lines of that log every few minutes: `tail -n 5 render-uhd.log` (in PowerShell `Get-Content render-uhd.log -Tail 5`). Between two reads wait with `sleep 300` as a foreground command; set the time limit of that one command to ten minutes, and if your tool cannot do that, use `sleep 100`. Never wait on a long command itself in the foreground, and never end one because it is quiet. Do not end your turn while a background task runs: go on reading until it has ended. If you are started again later, read the logs first and ask your shell tool which tasks still run.
- The clone must hold the whole tree of the newest commit of `main`. No sparse checkout and no filter; the tools read files from many folders (for example `references/`) and stop when one is missing. A plain `git clone --depth 1` of the repo is right: the repo's `.gitattributes` switches line ending changes off.
- The whole film is drawn on one machine. Frames from this machine are never mixed with frames from another machine or from the cloud.
- Step 2 (the render) starts only after step 1 (the test) has ended with the verdict PASS and Brandon has looked at the test pictures and said "go". With the verdict LOOK or STOP you stop, and Brandon takes the report to the Builder. This holds for every render in this file; the one exception is written in A9. A stop in the 4K test is not by itself a go for the 1080p run. On the run of the first section the go is given in advance, and the verdict is handled by the rules written there.
- Nothing here changes the picture, the cut, the sound or the subtitles. They are approved. The tools only draw the approved film at more frames and more pixels.
- On the Windows desktop do Part A. On the MacBook do Part B. Brandon starts with the MacBook Pro (the first section). The Windows desktop is a later run, only when he asks for it; do not wait for the other machine and do not ask about it.

## What the run makes

Step 2 leaves these files in `out/release/`:

| File | What it is |
|---|---|
| `Solar System Fly-Through - Without Prompt 4K 60 fps - 3840x2160.mp4` | The release: 3840 by 2160, 60 frames a second, 3:00, with the approved sound and subtitles |
| `Solar System Fly-Through - Without Prompt 60 fps from the 4K picture - 1920x1080.mp4` | The same film made smaller, for the review page |
| `finish-report.json` | The measured values of both films |

## Part A: the Windows desktop with the RTX 5080 (every step in full; the Windows run itself is a later one)

Use a native Windows shell: PowerShell, or the Git Bash that Claude Code uses on Windows. Do not use WSL. Inside WSL the browser is a Linux browser that does not draw on the card the way the film needs, and the test stops there.

### A1. Tools

Run these and note the answers:

```
node -v
git --version
ffmpeg -version
nvidia-smi
gh --version
```

Node must be 20 or newer. `ffmpeg -version` must show `--enable-libx264` and `--enable-libvpx`. `gh` is needed only for step 3. Google Chrome must be installed; there is no command for it here, because the test starts Chrome itself and says in plain words when it did not start. The free disk needs no command either: the test prints it, together with the disk the whole run needs.

What is missing, install with winget, then open a new shell so the new program is found. The two `--accept` flags answer the questions winget would ask, which your shell cannot answer:

```
winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements
winget install --id Google.Chrome -e --accept-source-agreements --accept-package-agreements
winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
```

If Git Bash does not find `winget`, run the same line through PowerShell: `powershell -NoProfile -Command "winget install ..."`. An installer may show a Windows permission prompt; Brandon answers it. If a new program is still not found after a new shell, tell Brandon to close and open Claude Code once.

### A2. The project

The clone must lie on a drive with at least 80 GB free. If Brandon's first instruction has already made the clone, use it and do not make a second one. Go into its folder and run:

```
git pull --ff-only
npm ci
```

If the repo is not on this machine yet:

```
git clone --depth 1 -c core.autocrlf=false https://github.com/BrandonChurch93/Solar-System-Perplexity.git
cd Solar-System-Perplexity
npm ci
```

In PowerShell `npm ci` can answer that running scripts is disabled on this system. Then run `npm.cmd ci`. It is the same program, and no system setting has to change.

The repo is public, so the clone needs no sign in. Only the upload of A6 needs `gh` to be signed in. Do not run `gh auth login` yourself: it asks questions on the keyboard, which your shell cannot answer. When it is needed, ask Brandon to run `gh auth login` and then `gh auth setup-git` in a terminal window of his own.

### A3. Step 1: the test (draws test frames only, no film)

Before it, ask Brandon to close games and other programs that use the graphics card, and tell him that a Chrome window will open and close several times and must be left alone and not minimized. Then start the test as a background task (see Rules):

```
node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080" >> capture-check.log 2>&1
```

Read `capture-check.log` until its last line starts with `VERDICT:` or the background task has ended. A task that ended without a `VERDICT:` line is a stop: report the whole log. Before you start the test a second time, rename the old log (`mv capture-check.log capture-check-1.log`), so that an old verdict is not read as the new one. The first run builds the film's page (a minute or two) and fetches the handoff files (about 180 MB) before it draws. On the card the whole test should take minutes (STATED, not measured). In software it takes hours, and the test stops before that.

A Chrome window opens and closes several times. Leave it alone and do not minimize it; it may sit behind other windows.

What the test does:

1. It reads the machine and stops inside WSL.
2. It proves that the code is the approved build (engine hash `a455bc02904b0d42`) and fetches the large handoff files (the subtitle strips, the sound, the reference frames) from the branch `handoff-local-render-assets`, each proved by size and sha256.
3. It proves that ffmpeg can encode with libx264 and can read the see through subtitle strip.
4. It draws 6 small frames, 24 frames at 1920 by 1080 and 13 frames at 3840 by 2160 with the film's own capture tool.
5. It compares every frame with the same frame of the approved film, writes side by side pictures, and works out the hours and the disk the whole film needs.

How the test proves that the film is drawn on the graphics card and not in software:

- The capture tool asks the browser page that draws the film for the name of its graphics (the WebGL value UNMASKED_RENDERER). With `--expect-gpu "RTX 5080"` the tool stops before the first frame when that name does not hold the words "RTX 5080". It also stops when the name is a software renderer (SwiftShader, llvmpipe, Microsoft Basic Render Driver). The name is written to the report and to `manifest.json` of every run. After each draw test the test tool reads the name again from that test's own `manifest.json` and stops when the words are not in it, so a test that drew nothing cannot pass as proof of the card.
- While frames are drawn, the test reads `nvidia-smi` every two seconds and writes the busiest value and the most memory in use to the report. A card that stays idle while frames are drawn gives the verdict LOOK.
- The time per frame is in the report. In software one 4K frame of this film took about three minutes in the cloud, after a first start of more than an hour and a half (MEASURED there). On the card a frame should take seconds.

The test ends with one line: `VERDICT: PASS`, `VERDICT: LOOK` or `VERDICT: STOP`. Its files:

- `out/work/capture-check/REPORT.md` (the whole report in plain words)
- `out/work/capture-check/report.json` (the same as numbers)
- `out/work/capture-check/side/` (side by side pictures: the approved film left, this machine right)

### A4. Report for step 1

Give Brandon one block he can copy, with:

- the answers from A1 and the commit (`git rev-parse HEAD`)
- the full text of `out/work/capture-check/REPORT.md`
- if the test stopped early: the full error text, uncut

Then open the folder `out/work/capture-check/side/` for him (on Windows `explorer "out\work\capture-check\side"`, with the quotes; the exit code of `explorer` means nothing) and ask him to look at the 4K pictures at full size. If no window opens, give him the full path of the folder. Then stop and wait.

- Verdict PASS and Brandon says "go": do step 2.
- Verdict LOOK or STOP, or Brandon does not like a picture: stop. Brandon takes the report to the Builder. Change nothing yourself.

### A5. Step 2: the render (only after "go")

Keep the machine awake and its display on for the run. Note the two old values first, then switch sleep and the display timer off. They are set back at the end of A6:

```
powershell -NoProfile -Command "powercfg /query SCHEME_CURRENT SUB_SLEEP STANDBYIDLE"
powershell -NoProfile -Command "powercfg /query SCHEME_CURRENT SUB_VIDEO VIDEOIDLE"
powershell -NoProfile -Command "powercfg /change standby-timeout-ac 0"
powershell -NoProfile -Command "powercfg /change monitor-timeout-ac 0"
```

Each old value is the line "Current AC Power Setting Index" of its query. It is a number of seconds written in hexadecimal: `0x00000708` is 1,800 seconds, which is 30 minutes, and `0x00000000` means that the timer was off already.

The render. It draws 10,800 frames at 3840 by 2160 and encodes them in parts of 600 frames; the frame pictures of a part are removed when its part is proved. Start it as a background task (see Rules):

```
node node_modules/tsx/dist/cli.mjs tools/capture.ts --format uhd --rate 2 --tier final --expect-gpu "RTX 5080" >> render-uhd.log 2>&1
```

- Every ten frames it writes a line with the pace and the time left. Read the last lines of `render-uhd.log` about every five minutes (the wait of the Rules), and tell Brandon the time left after the first read.
- It has ended well when the last line of the log starts with `capture: the film is`.
- If the background task has ended and the last line of the log does not start with `capture: the film is`, start the same command again. It goes on after the last finished frame. A quiet log is not a stop: ask your shell tool whether the task still runs, and never start a second render beside a running one. If it stops three times at the same frame or with the same error, stop and report.
- Tell Brandon before the start: while it runs he must not minimize the Chrome window, lock the screen, start a game or close the window you work in, and the monitor stays on (item 9 of the unknowns).
- When it ends, the captured film is `out/work/capture/uhd-r2-final/grand-tour-uhd-60fps.mp4` and its record is `out/work/capture/uhd-r2-final/manifest.json`.

Then the finish, which lays the approved subtitles over the picture, adds the approved sound and writes the two release files. It encodes the whole film twice and can take up to an hour (STATED), so it is a background task as well:

```
node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts >> finish.log 2>&1
```

When the task has ended, the last line of `finish.log` must be `FINISH: PASS`. With any other last line then, stop and report.

Sleep and the display timer stay off until the upload of A6 has ended. They are set back there.

### A6. Step 3: bring it back

The Builder picks the release up from a GitHub release of this repo (public, like the repo, until the build is complete). The 4K film is close to 2 GB, so the upload can take from minutes to an hour. Start it as a background task (see Rules), in the repo folder:

```
gh release create local-render-4k60 --title "Local render 4K 60 fps" --notes "Drawn on Brandon's machine. See finish-report.json." "out/release/Solar System Fly-Through - Without Prompt 4K 60 fps - 3840x2160.mp4" "out/release/Solar System Fly-Through - Without Prompt 60 fps from the 4K picture - 1920x1080.mp4" out/release/finish-report.json out/work/capture/uhd-r2-final/manifest.json out/work/capture-check/REPORT.md out/work/capture-check/report.json >> upload.log 2>&1
```

It has ended well when `upload.log` ends with the address of the release.

- If `gh` is not signed in: ask Brandon to run `gh auth login` in a terminal window of his own (see A2), then start the upload again. On the run of the first section do not wait for him: leave the files where they are and write their full paths into the log.
- If `gh` answers that the release or the tag exists already: put `-2` behind `local-render-4k60` and start it again.
- If the upload fails for another reason, do not try another way. Leave the files where they are and give Brandon the full paths of the six files in the command. He can then bring the 1920 by 1080 film and the four small files to the Builder chat. The 4K film stays on the machine until the Builder says how to send it.

When the upload has ended, or as soon as you stop and report, set sleep and the display timer back to the old values, in minutes (`0x00000708` is 30 minutes):

```
powershell -NoProfile -Command "powercfg /change standby-timeout-ac <old minutes>"
powershell -NoProfile -Command "powercfg /change monitor-timeout-ac <old minutes>"
```

### A7. Report for step 2

One block with: the last 40 lines of `render-uhd.log`, the whole of `finish.log`, the full text of `out/release/finish-report.json`, the address of the release (or the full path of `out/release/`), and the free disk space (`powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem"`).

### A8. Cleanup

Delete nothing until the Builder has confirmed that the release arrived and is good. Then the render files can go: the folder `out/work/capture/`, the folder `out/work/capture-check/` and the log files in the repo folder. Keep `out/release/`.

### A9. Second run, or fallback: 1080p at 60 frames a second

Only when Brandon asks for it; his asking is the go for this run. If the test of step 1 did not end with PASS, start it only when Brandon says that the Builder has read the report of that test and allows the 1080p run. The test of step 1 covers this run as well (its 24 frames at 1920 by 1080), so it is not run again. Same rules and the same machine for the whole film. Switch sleep and the display timer off before this run and set them back after its upload, as in A5 and A6. Both commands are background tasks, one after the other: start the second only when the last line of `render-1080p.log` starts with `capture: the film is`. When the second has ended, the last line of `finish-1080p.log` must be `FINISH: PASS`.

```
node node_modules/tsx/dist/cli.mjs tools/capture.ts --format master --rate 2 --tier final --expect-gpu "RTX 5080" >> render-1080p.log 2>&1
node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts --format master >> finish-1080p.log 2>&1
```

It writes `out/release/Solar System Fly-Through - Without Prompt 60 fps - 1920x1080.mp4`, and a new `out/release/finish-report.json` over the old one, so upload the 4K release first if there is one. The captured film is `out/work/capture/16x9-r2-final/grand-tour-16x9-60fps.mp4`. Bring it back the same way under its own name, then report as in A7:

```
gh release create local-render-1080p60 --title "Local render 1080p 60 fps" --notes "Drawn on Brandon's machine. See finish-report.json." "out/release/Solar System Fly-Through - Without Prompt 60 fps - 1920x1080.mp4" out/release/finish-report.json out/work/capture/16x9-r2-final/manifest.json out/work/capture-check/REPORT.md out/work/capture-check/report.json >> upload-1080p.log 2>&1
```

## Part B: the MacBook Pro with the M4 Pro (the first run, see the first section)

Same steps and the same rules as Part A, with these differences.

- Tools: `brew install node ffmpeg gh` for what is missing; Google Chrome must be installed. If `brew` itself is missing, stop and tell Brandon: its installer asks for his password, so he installs it himself (https://brew.sh). On the run of the first section do not wait for him: see "Without brew, without a password" there. Record `sw_vers`, `sysctl -n machdep.cpu.brand_string`, `node -v`, `ffmpeg -version`, `df -h ~`.
- The clone: as in A2. If Brandon's first instruction has already made it, use it where it lies. If not, clone into the home folder with the clone command of A2, then `npm ci`.
- Keep the Mac on power with its lid open. The long commands are background tasks with a log, as in Part A. `caffeinate -dis` in front keeps the Mac and its display awake while a command runs; no `screen` and no `tmux` is needed. The `powercfg` lines of A5 and A6 are for Windows only; leave them out on the Mac.
- The name of the graphics is Apple's, so the words are "Apple":

```
caffeinate -dis node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "Apple" >> capture-check.log 2>&1
```

- Step 2 on the Mac, only after PASS and "go" (on the run of the first section the go is given and `--ignore-limits` is added, as written there):

```
caffeinate -dis node node_modules/tsx/dist/cli.mjs tools/capture.ts --format uhd --rate 2 --tier final --expect-gpu "Apple" >> render-uhd.log 2>&1
caffeinate -dis node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts >> finish.log 2>&1
```

- Open the pictures with `open out/work/capture-check/side`.
- Step 3 on the Mac: the upload command of A6 with the name `local-render-4k60-mac` in place of `local-render-4k60`, and `caffeinate -dis` in front of it.
- Disk: see "Disk" below. Run `df -h ~` before the run and after every hour. Under 15 GB free, end the run and report.
- Without `--ignore-limits` the capture tool is expected to stop at its machine check on the Mac, for the point size. The first section says why the flag is allowed on the Mac and on what condition; see also item 11 of the unknowns below.

## Disk

The sizes marked STATED are worked out, not measured. Step 1 measures the size of a 4K frame on the machine and prints the disk the run needs ("Keep N GB free"). Use that number over this table.

| What lies on the disk | Size |
| --- | --- |
| The clone made with `--depth 1` | about 5 GB (MEASURED: the files are 2.9 GB; STATED by a cloud machine that made this clone: 4.9 GB in all, of that 2.2 GB git's own store) |
| `node_modules` after `npm ci` | 0.3 GB (MEASURED) |
| The built page in `dist/`, made by the first run | 1.3 to 2.3 GB (STATED by the cloud machine: 1.3 GB; MEASURED on the Builder's machine: 2.2 GB) |
| Frames waiting to be packed, at most 600 PNG files at a time | 4 to 15 GB at 4K (STATED; MEASURED on the one 4K frame drawn in the cloud: 16.7 MB, so 600 like it are 10 GB) |
| The packed parts of the capture | 3 to 11 GB at 4K (STATED; the one 4K frame drawn in the cloud packs to 1 MB by itself, and frames packed in a row take less) |
| The joined capture | 3 to 11 GB at 4K (STATED) |
| The release films | under 2 GB for the 4K film and under 1 GB for the 1920 by 1080 film (the finish tool caps the bit rate and ends with STOP on a film of 2 GB or more, because GitHub takes release files under 2 GB only) |
| In all at the peak | 25 to 50 GB at 4K (STATED) |

- Windows desktop: Brandon says it has terabytes free. Clone onto that disk. Nothing else is needed.
- MacBook Pro: Brandon says about 100 GB are free and that he can make it 150 GB. By the table the 4K run fits in 100 GB (STATED). Step 1 settles it: if its report asks for more than the disk has, the verdict is LOOK and you stop. On the run of the first section the disk rule written there holds instead.
- The capture tool stops by itself when less than 1 GB is free, and a stopped run continues where it stopped when you start the same command again.
- A 1920 by 1080 run needs about a quarter of the frame, part and film sizes above.

## What is measured, what is stated, what is unknown

MEASURED means the Builder ran it and read the result. STATED means worked out or taken from someone's word. UNKNOWN means nobody has run it yet; each UNKNOWN names the check that settles it.

MEASURED, in the cloud, on Linux, drawn in software:

- The picture code of this commit is the approved build: engine hash `a455bc02904b0d42`. The test stops if your clone has another one.
- The capture tool at twice the frame rate draws the approved film's frames plus one new frame between each pair: capture frame 2k is film frame k. Proved on proof frames and on the parts of the cloud 60 fps film that are back.
- One 4K frame of the film was drawn in the cloud, in software, by the capture tool (capture frame 3480: Earth, whole view, film frame 1740): against the approved film it gives 38.06 dB PSNR and SSIM 0.967 after scaling down, and at full size it holds more detail than the approved film scaled up twice (clouds, coasts, city lights, stars as finer points). That is one frame of one stop.
- The subtitle strip equals the approved subtitles: 54.6 to 62.1 dB PSNR against the approved subtitle picture on 15 frames of five cues of the finished 4K strip, and outside the strip the picture is left bit for bit (16 of 16 frames). The strip for the 1920 by 1080 run gives 53.8 to 61.6 dB on the same frames and leaves the picture outside it bit for bit as well.
- The sound file is the approved sound, cut out of the approved film without a new encode: 180.000 seconds, 8,439 packets.
- The file names of the repo are safe on Windows: 4,188 files, no forbidden characters, no two names that differ only in upper and lower case, no reserved names, longest path 124 characters, no links.
- What ran of the handoff tools before this commit: here, in a test tree without a browser and on frames made from the approved picture, the capture tool packed and joined 60 frames in three parts (exit 0), the finish tool ended with `FINISH: PASS` on captures of 480 and of 60 frames with the sound equal bit for bit, and the test tool compared 43 frames, wrote its tables and side by side pictures, and stopped on a graphics name without the words asked for. MEASURED on 2026-11-28, after the handoff commit, on a cloud machine without a graphics card (the browser drew in software, SwiftShader, and the words asked for were SwiftShader): the test tool's first draw test in a browser, six small frames (960 by 540), ran to its end with exit code 0, and the engine hash of the page was the approved one. The tool found all six frames equal to their reference frames, and the Builder checked them again by other means: each is the same as its reference frame pixel for pixel. The tool then printed `VERDICT: LOOK`, as it must when a run draws no frame at the film's size. In software it took 1 hour 45 minutes (66 minutes for the first frame with the build of the page and the warm up, then 77 to 657 seconds a frame), which says nothing about a machine with a graphics card. That run used the test tool of commit 6987a16; the tool here differs from it by one added check of the graphics name, which was tested without a browser. Not run at all: the test tool's draw tests at 1920 by 1080 and at 4K in a browser, and the finish tool on a drawn capture. Step 1 on your machine is the first run of those.

STATED:

- Hours for the whole 4K film: 3 to 5 on the RTX 5080 and 8 to 18 on the M4 Pro. These are guesses. Step 1 measures the time per frame and prints the hours; use its number.
- The disk sizes in the table above.
- Sharpness at 4K, worked out from the sizes of the maps (every globe map is 8,192 by 4,096; the stars are drawn as points from a list and no map limits them): whole views gain the full 4K sharpness; in the close parts of the flights in and out, where a globe's disc is larger than about 1.2 times the height of the frame, the map has less than one point per pixel, so those frames gain less. No frame is softer than the 1920 by 1080 film.
- Apple graphics is said to allow points up to 511 pixels (not measured by the Builder).

UNKNOWN, with the check that settles each:

1. Nothing in this file has run on Windows or on a Mac. Check: step 1. It is made to stop early and say why.
2. Whether `gh` on the machine is signed in for the upload. The clone itself needs no sign in: the repo is public since 02:37 UTC on 2026-11-28 and stays so until the build is complete (MEASURED from a machine without an account: the page, this file and a git read all answered). Check: `gh auth status`. If it is not signed in, Brandon runs `gh auth login` in a terminal window of his own when he is at the machine.
3. Whether Chrome draws on the RTX 5080 and not on the processor's own graphics or in software. Check: step 1 prints the graphics name that the film's page reports and stops before the first frame if the words "RTX 5080" are not in it; it also reads the card's load with `nvidia-smi` while frames are drawn. After each draw test the test tool reads the name again from the test's own record and stops when the words are not in it (that second check is MEASURED on a made record: an empty name stopped it, a name with the words went through).
4. Whether the card draws the same picture as the approved film, which was drawn in software. Drivers round differently. Check: step 1 compares 24 frames at 1920 by 1080 and 13 frames at 4K with the approved film and ends with PASS, LOOK or STOP.
5. Whether anything is soft at 4K (maps, stars, rings). Check: the 13 side by side pictures of the 4K test carry a second row at full size. Show them to Brandon before step 2.
6. The time per frame, and with it the hours. Check: step 1.
7. How long the first start takes on Windows, where Direct3D builds the film's drawing programs. Minutes are possible. Check: the first lines of step 1; the tool waits by itself.
8. Whether Windows resets the graphics driver on the heaviest frames (its two second limit for one drawing call). Sign: the capture tool reports a lost graphics context and stops. Check: start the same command again; it continues where it stopped. If it stops at the same frame three times, stop and report. Do not change the registry (TdrDelay) without Brandon's word.
9. Whether a locked screen or a display that is off slows Chrome on Windows. Check: the capture prints its pace; compare before and after. Safest: leave the screen on and unlocked.
10. Whether the 4K buffers fit in the graphics memory (16 GB on the RTX 5080; shared memory on the Mac). Check: the 4K frames of step 1.
11. Mac only: the film's list of needs asks for points up to 1,000 pixels and Apple graphics is stated at 511. The need is a stated safety number: the largest points the film draws are about 60 pixels at 4K (read in the source, see the first section). The Builder therefore allows `--ignore-limits` on the Mac for that one line and for no other. Not known until the test has run on the Mac: the real limit there, and whether Apple graphics draws the star points like the approved film. Check: the report of the test names the limit, and its side by side pictures show the stars.
12. Mac only: whether the 4K run fits the free disk. Check: the disk line of step 1.
13. Whether your shell tool keeps a background task alive for hours. Check: ask your shell tool for the state of the task. If the task is gone and its log does not show a good end, start the same command again; it goes on where it stopped. Never start a second one beside a task that still runs.
14. Whether `gh` uploads a film of nearly 2 GB in one go on Brandon's line. Check: `upload.log` ends with the address of the release. If it does not, the films stay in `out/release/` and Brandon tells the Builder.
15. Whether the Windows commands that do not touch the film (winget, explorer, powercfg, the log reads) behave in your shell as written. They were written from the documentation and not run. Check: each prints an error if it does not; report the error and go on only if the step was not needed.

## If something goes wrong

- Copy the full text of the error. Do not shorten it.
- Do not change flags, files or system settings to get around it.
- If you switched sleep or the display timer off, set them back first (end of A6).
- Tell Brandon which step stopped. He takes it to the Builder.
