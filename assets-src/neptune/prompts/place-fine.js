// S2, the deeper shown plates (16 and 10 degrees; 6 and 3.5 use place-soft.js): finer cloud for the ground round the
// laid back place. Input: out/work/nep/s2/guideW.png from `python3 assets-src/neptune/place/shown.py guide W` (the plate
// above, enlarged, with the laid back deck of the close view feathered in). Run through the skill named media, 1:1,
// with the tool's default model (1254 square, keeps the layout). The 2K route that the recipe of patch-24 used was
// tried once for 16 degrees and redrew the storm as another spiral: rejected.
// One take per run; the take number goes into the file name.
const width = '16';
const take = 1;
const prompt = `Image 1 is a soft, enlarged picture looking straight down on the cloud tops inside a giant dark storm on the planet Neptune: deep blue and dark navy cloud deck combed into long curved streaks that wind round the small round dark eye of the storm, with paler blue threads between them. Redraw exactly this picture as a razor sharp, very high resolution photograph taken by a spacecraft camera pointing straight down. Keep every shape where it is: the same curves, the same position and size of every streak, patch and dark area, the same colours and the same brightness everywhere. Do not move, zoom or crop anything. Only add fine real detail inside what is already there: the streaks become thousands of thin crisp wind combed filaments that run along the direction the streaks already run, with fine striations, delicate ripples and small soft billows between them, darker threads in the dark areas and thin threads of paler blue in the lighter ones. Even flat light, no cast shadows, no white clouds added, no vignette, no horizon, no stars, no lens effects, no grain, no painterly brush marks, no noise. Square image, the cloud deck fills the whole frame edge to edge. No text, no border.`;
const r = await tools.generate_image({ prompt, filename: 'repo/out/work/nep/s2/takes/place' + width + '-t' + take, aspect_ratio: '1:1', images: ['repo/out/work/nep/s2/guide' + width + '.png'] });
text(JSON.stringify(r.paths ?? r));
