const prompt = `Edit image 1. Remove every white and grey cloud and every dark shadow that the clouds cast on the surface below them, and paint the blue cloud deck that lies beneath, continuing the surrounding fine streaks, swirls and soft bands of blue naturally through the cleared areas. Keep everything else exactly unchanged and in the same place: the dark oval storm with its spiral arms, the curved horizon with its thin blue glow, the pale blue haze near the horizon, the starry sky, the overall fall of light from bright at the upper right to dark navy at the lower left, the framing, the colours and the exposure. The result is the same view of the planet with a clear, cloud-free, deep blue deck. No white clouds, no cloud shadows, no text, no border.`;
const jobs = [['clean-centre-t1', 'repo/references/approved/neptune-close.jpg'], ['clean-canvas-t1', 'repo/out/work/nep/terrain/canvas-base.png']];
const res = await Promise.all(jobs.map(async ([name, src]) => {
  const r = await tools.generate_image({ prompt, filename: 'repo/out/work/nep/terrain/' + name, model: 'gpt_image_2_6_flare', aspect_ratio: '16:9', images: [src] });
  return name + ': ' + JSON.stringify(r.paths);
}));
for (const r of res) text(r);
