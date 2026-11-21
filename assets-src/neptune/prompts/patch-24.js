const prompt = `Image 1 is a soft, low resolution map looking straight down on the cloud tops of the planet Neptune: a dark navy oval storm in the middle, a wide band of white cirrus cloud arching over its top edge, a bright white cloud arc hugging its lower left rim, thinner white cirrus streaks below it, and a deep electric blue cloud deck all around. Redraw exactly this picture as a razor sharp, very high resolution photograph taken by a spacecraft camera pointing straight down. Keep every shape where it is: the same storm outline, the same position, size and curve of every white cloud band and streak, the same colours and the same brightness everywhere. Only add fine real detail inside what is already there: the white cirrus becomes thousands of thin, crisp, wind-combed ice filaments and feathery streaks with clean edges, all running along the direction the band already runs; the blue deck gains delicate streaks, soft ripples and faint swirls that curl round the storm; the dark storm interior gains faint spiral striations. Even, flat light with no shadows, no vignette, no horizon, no stars, no lens effects, no grain, no painterly brush marks, no noise. Square image, the cloud deck fills the whole frame edge to edge. No text, no border.`;
const jobs = [['patch24-t1', 'seedream_5'], ['patch24-t2', 'nano_banana_pro']];
const res = await Promise.all(jobs.map(async ([name, model]) => {
  try {
    const r = await tools.generate_image({ prompt, filename: 'repo/out/work/nep/patches/' + name, model, aspect_ratio: '1:1', images: ['repo/out/work/nep/patches/guide-24.png'] });
    return name + ': ' + JSON.stringify(r.paths ?? r);
  } catch (e) { return name + ' failed: ' + String(e); }
}));
for (const r of res) text(r);
