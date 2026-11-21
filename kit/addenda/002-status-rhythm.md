# 002 · Status rhythm

Added 2026-11-20. Brandon went most of a day at a time without pictures, and the ones that were shared arrived as files he had to download. He wants a steady stream he can see in the thread, so he can correct the build the moment it drifts.

This replaces "When to post a status" in addendum 001 and adds to "What a status is" and "How" there. Everything else in 001 stands.

This addendum does not ask for changes to Mars or to the look. Do not run rounds on Mars because of it.

## Config

Add these keys to `config/showcase.json` and read them from there:

| Key | Value |
| --- | --- |
| `status.maxGapMinutes` | 30 |
| `status.minGapMinutes` | 10 |
| `status.maxPictures` | 4 |
| `status.inlineMaxTries` | 3 |

## When to post a status

- As the first thing in every task.
- At least every `status.maxGapMinutes` of working time, in every phase. This holds while a render job runs, while supporting agents work and while a critic is awaited. Waiting is polling: each time you poll, check whether a status is due.
- At the end of every round, at every finished stop and at every phase gate.
- Whenever Brandon asks for one.
- Outside those moments, never more often than every `status.minGapMinutes`. He wants a steady stream, not a flood.

## Pictures are shown inline

- Display the pictures inline in the thread, so Brandon sees them without opening or downloading a file. A file attachment alone does not count.
- A method that has worked in this kind of workspace: pack the pictures as JPEG data into one file and show it with the inline visualization tool as a grid with a caption under each picture.
- Prove the method with the first status of the next task. If no inline method works after `status.inlineMaxTries` tries, attach the files, say so once in the thread, log it under "Tool record" in `kit/PROGRESS.md`, and carry on. This is not a blocker.

## What the pictures are

- One to `status.maxPictures` pictures, each with a caption.
- Show what you and your agents are looking at right now. Unfinished and bad pictures are shown, not held back.
- While a stop is being worked on: its newest key frame beside its approved image first, then the newest looks at whatever is being changed.
- Between stops, and in Phases 5 and 6: the whole film contact sheets, or the newest frames of the job that is running.

## How

- `npm run status` never waits for the render slot and never comes back empty. With a job running it uses that job's newest frames. With nothing new rendered it uses the newest kept stills.
- Every still, sheet, crop and comparison the harness renders is logged as a look, so `npm run status` can pick the newest.
- A long render job writes a look at least once per `status.maxGapMinutes`.
- A supporting agent that builds a stop pushes its newest looks at least every `status.maxGapMinutes` to a branch named `agent/<folder>-looks`. That branch is fetched, never merged.
- Commit and push with every status. Nothing stays unpushed for longer than the gap between two statuses.

## What a status is not

As addendum 001 says: not a round, not a question, not a reason to pause. Post it and carry on in the same turn.
