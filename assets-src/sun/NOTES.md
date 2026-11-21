# Sun stop notes

Lab notebook of the agent that builds the `sun` stop. Branch `agent/sun`, looks on `agent/sun-looks`.

## Standing facts

- Segments in order: `sun.terrain` (frames 0 to 179), `sun.rise`, `sun.hold`, `sun.travel`. No dive.
- Judged frames: 0 (frame 0), 60 (hook), 90 (terrain), 247 (rise), 360 (hold), 495 (travel).
- Approved images: `references/approved/sun-hero.png`, `references/approved/sun-close.jpg`, both 2816 x 1584.
- VM: 4 cores, 7 GB RAM, 17 GB free disk at the start.

## Log

- Start. Cloned, branch `agent/sun`, `npm ci`, build green. Stand-in compare frames rendered at draft for hold and terrain and pushed as the first looks.
