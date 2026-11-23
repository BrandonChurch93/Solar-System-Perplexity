// S2, the two deepest shown plates (6 and 3.5 degrees): the ground next to the close view's foreground.
// The filament wording of place-fine.js drew pale threads like hair; next to the soft dark foreground of the close
// view that reads as another material. This wording asks for the close view's own soft cloud instead.
// Input: out/work/nep/s2/guideW.png from `python3 assets-src/neptune/place/shown.py guide W`. Run through the skill
// named media, 1:1, the tool's default model (it keeps the layout; its picture is 1254 square).
// One take per run; the take number goes into the file name.
const width = '3.5';
const take = 1;
// What is wrong with the part of the guide that is not the close view: 6 was built on the thread take, 3.5 is an
// enlargement of the finished 6 degree plate.
const rest = { '6': 'The rest was drawn too hard: it is covered with thin pale lines that look like hair or threads.', '3.5': 'The rest is an enlargement of a smaller picture and is out of focus.' }[width];
const prompt = `Image 1 looks straight down on dark blue cloud tops inside a giant storm on the planet Neptune. Part of the picture is real: the dark navy, soft, smoky cloud with faint grey wisps. ${rest} Redraw the whole picture as one soft but sharp photograph of cloud tops seen from straight above by a spacecraft camera: everywhere the same soft smoky cloud as the dark real part, with gentle low billows, faint wisps and soft streaks that follow the direction the streaks run now. No thin bright threads, no hair, no fibres, no hard lines. Keep the brightness and the colour of every region as it is: dark navy where it is dark, a little paler blue where it is paler, the same large shapes in the same places. Do not move, zoom or crop anything. Even flat light, no cast shadows, no white clouds, no vignette, no horizon, no stars, no lens effects, no grain, no noise. Square image, the cloud fills the whole frame edge to edge. No text, no border.`;
const r = await tools.generate_image({ prompt, filename: 'repo/out/work/nep/s2/takes/place' + width + '-t' + take, aspect_ratio: '1:1', images: ['repo/out/work/nep/s2/guide' + width + '.png'] });
text(JSON.stringify(r.paths ?? r));
