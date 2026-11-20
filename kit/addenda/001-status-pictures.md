# 001 · Status pictures

Added 2026-11-19. Brandon wants to see the film as it changes, in the task thread, without having to ask.

This adds to "Keeping Brandon in the loop" in `AGENTS.md`. The progress notes there stay as they are. Statuses come more often.

## When to post a status

- At the end of every round.
- Each time a numbered step of the current phase in `kit/08-BUILD-ORDER.md` is finished.
- Whenever Brandon asks for one.
- Never finish two rounds or two steps in a row without one.

## What a status is

One short message in the task thread:

- Two lines of text: the phase, the stop and the round, what just changed, and what is next.
- The review page link.
- Up to four images attached.
  - While a stop is being worked on: its current `hold` frame and its current `terrain` frame, each beside its approved image, and one contact sheet of its `dive`.
  - Between stops, and in Phases 5 and 6: the whole film contact sheets.

Unfinished is fine. A status shows work in progress, not a result.

## How

- Add a harness command: `npm run status -- --stop ID`. It renders those images from the build as it stands, at the `review` tier, writes them to `out/stills/status/` over the previous ones for that stop, and runs `npm run review` so they are on the review page.
- With no `--stop` it writes the whole film contact sheets.
- `out/stills/status/` may change through `npm run status`. Commit and push it with the round.
- Publish after a status when the review page changed.

## What a status is not

- It is not a round and does not count as one.
- It is not a question. Do not wait for a reply.
- It is not a reason to pause. Post it and carry on with the next step in the same turn.

If this workspace cannot post a message with pictures in the middle of a task, write the two lines into the "Session log" of `kit/PROGRESS.md`, and rely on the push and the review page to carry the pictures.
