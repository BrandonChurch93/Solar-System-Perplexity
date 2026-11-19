# 10 · Kickoff

For Brandon. The Builder does not act on this file.

## Before the run

1. In Computer, check that the GitHub plugin is still connected.
2. Start a new Computer task on your highest effort setting with Multiagent on.
3. Paste the kickoff prompt.

## Kickoff prompt

```
BUILD MODE.

Repo: https://github.com/BrandonChurch93/Solar-System-Perplexity

Clone the repo. Read AGENTS.md, then kit/00-README.md, then the kit in its reading order. Build the whole film from the kit: work every phase in kit/08-BUILD-ORDER.md in order, pass every gate, run the critic rounds in kit/07-QUALITY-BAR.md inside their round limits, and log everything in kit/PROGRESS.md.

Run this as one continuous task. Do not ask me questions. Decide, log the decision in kit/PROGRESS.md, and continue. Stop only at the Mars review, at BUILD COMPLETE, or at a blocker as AGENTS.md defines one.

Show your work as you go, as AGENTS.md says: publish the app, push after every round, and post a progress note with pictures at the rough cut, every phase gate and every finished stop.

Use supporting agents wherever the kit calls for them. Do not lower the bar to finish sooner.
```

## What you will see, in order

1. A link to the live app, early, and a review page at the same address under `review.html`. Everything the build shows you plays there.
2. The rough cut: the whole film made from the approved stills, so you can judge the pacing. The build does not wait for you here.
3. `MARS READY FOR REVIEW`. The build stops here and waits.
4. A progress note with pictures after each of the other eight stops.
5. `BUILD COMPLETE`.

## After the rough cut

- Bring any pacing notes to the planning chat. They go into the repo as an addendum. The build picks it up at its next phase.

## After MARS READY FOR REVIEW

1. Open the review page. It has the Mars clip and the two side by side images.
2. Bring what you like and dislike to the planning chat.
3. If changes are needed they are pushed to the repo as an addendum first.
4. Then send the resume prompt.

## Resume prompt after the Mars review

```
BUILD MODE.

Mars is approved.

Clone https://github.com/BrandonChurch93/Solar-System-Perplexity and continue from kit/PROGRESS.md. Read AGENTS.md and kit/addenda/ first. Same rules: no questions, show your work as you go, stop only at BUILD COMPLETE or a blocker as AGENTS.md defines one.
```

## Resume prompt if a task ends early

Use this if a task ends before the Mars review, or between the Mars review and BUILD COMPLETE. The Mars approval is remembered in `kit/PROGRESS.md`, so this one prompt works at any point. Do not use it to answer the Mars review itself: without the approval line the build stops again and shows the same review.

```
BUILD MODE.

Clone https://github.com/BrandonChurch93/Solar-System-Perplexity and continue from kit/PROGRESS.md. Read AGENTS.md and kit/addenda/ first. Same rules: no questions, show your work as you go, stop only at the Mars review, BUILD COMPLETE or a blocker as AGENTS.md defines one.
```

## After BUILD COMPLETE

1. The sandbox master attached to the final message is a finished 1080p film.
2. For the highest quality, open the Export link in Chrome on a computer with a real GPU, pick the whole film, and start. Keep the tab open and visible until the file downloads.
3. Export any single stop the same way for a short clip.
4. Add sound in your editor, using `cut/CUES.md` for timing.
5. The film is longer than X allows on a standard account. Post it from an account with long video.

## Review

- Bring stills, clips or your export back to the planning chat with what you dislike.
- Changes come back as a short fix prompt, or as a numbered file in `kit/addenda/` for anything larger.
