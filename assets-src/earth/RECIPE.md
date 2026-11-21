# Earth: recipes

Every generated asset of the stop, in the order the scripts run. Working files stay under `out/work/earth/`; inputs from third parties stay under `references/cache/earth/` with rows in `ASSETS-ROWS.md`.

## Working source: the hero without clouds

- Output: `out/work/earth/decloud/decloud-seedream-t1.png` (2816 x 1584). Not shipped; it is the estimate of the surface under the clouds that the layer split uses.
- Tool: image edit, Seedream. Input: `out/work/earth/hero.jpg` (the approved hero as JPEG, quality 96).
- Prompt: "Edit image 1, a view of planet Earth from space. Remove every cloud, cloud band, cloud swirl, the hurricane and every patch of haze from the planet, so the whole surface is seen under a perfectly clear sky. Where clouds covered ocean, paint clean deep blue open ocean that matches the neighboring water, with only gentle tonal variation. Where clouds covered land, continue the neighboring terrain naturally: forest, plains, desert, mountains, tundra, ice. Keep everything else exactly as it is, pixel for pixel: the same coastlines, the same continents in the same positions and sizes, the same land colors and turquoise shallows, the same polar ice cap, the same lighting and the same day and night boundary, the same golden city lights on the night side, the same green aurora, the same blue atmosphere glow on the edge of the planet, the same Moon, the same stars and Milky Way. Do not move, resize or rotate the planet. Do not add anything. No text, no border."
- Takes: 2. Take 1 (Seedream) kept: median shift against the hero on clear land 0.2 to 0.7 px, coasts in place. Take 2 (Nano Banana Pro) rejected: the planet is shifted by about 1.3 px and warped (flow median about 3 px).
