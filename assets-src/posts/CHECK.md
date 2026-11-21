# The one text check of the nine intros

Addendum 003, "The one check". Run once, on 2026-11-21 at 04:11 UTC. It is not a round.

## What was sent

- One fresh agent, `reviewer_77`, with nine attachments and the question below, nothing else.
- The nine sheets came from `npm run post -- --sheets`: twelve frames of the intro at `critics.phonePreviewWidthPx`, and under them the prompt box of the frame before the submit at native size.
- The sheets went out under neutral file names so the name of the stop was not given away: `image-1.png` sun, `image-2.png` mercury, `image-3.png` venus, `image-4.png` earth, `image-5.png` mars, `image-6.png` jupiter, `image-7.png` saturn, `image-8.png` uranus, `image-9.png` neptune.

The question, word for word:

> Type exactly the text you can read in the text box in each image. Then list anything that looks broken: cut off text, overlapping text, a missing character, a wrong character.

## The answer, as received

> All 9 enlarged prompt boxes clearly read `Give me a hyperrealistic Sun using three.js`, then exact same text with Sun replaced, in order, by Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. No clipped text, overlapping text, missing/wrong characters visible in any enlarged box. The contact sheet's shorter strings are successive typing states; insertion caret can abut last glyph, and mouse cursor overlaps the send button only (not prompt text). All completed prompts end `three.js` without a final period.

## Result

| Intro | Text typed back | Config string | Broken things listed | Result |
| --- | --- | --- | --- | --- |
| sun | Give me a hyperrealistic Sun using three.js | same | none | pass |
| mercury | Give me a hyperrealistic Mercury using three.js | same | none | pass |
| venus | Give me a hyperrealistic Venus using three.js | same | none | pass |
| earth | Give me a hyperrealistic Earth using three.js | same | none | pass |
| mars | Give me a hyperrealistic Mars using three.js | same | none | pass |
| jupiter | Give me a hyperrealistic Jupiter using three.js | same | none | pass |
| saturn | Give me a hyperrealistic Saturn using three.js | same | none | pass |
| uranus | Give me a hyperrealistic Uranus using three.js | same | none | pass |
| neptune | Give me a hyperrealistic Neptune using three.js | same | none | pass |

All nine pass. No fix pass was needed (`posts.checkMaxFixes` not touched).
