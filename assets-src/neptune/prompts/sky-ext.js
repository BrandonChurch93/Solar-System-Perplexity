const prompt = "Image 1 is a photograph of a night sky full of stars, placed in the upper part of a larger canvas. The photograph is a wide strip whose lower edge is cut along a slanted, slightly curved line. Around it lies a broad band of flat magenta (#FF00FF): above it, to its left, to its right and below its slanted lower edge. Outside the magenta the canvas is a darker, emptier night sky with only a few faint stars. Paint over all of the magenta so the whole canvas becomes one continuous view of the same night sky: continue the dense field of fine pinpoint stars and the soft blue-grey Milky Way cloud with its dark dust lanes outward from the photograph in every direction, above it, to the sides and especially downward below the slanted edge, with the same brightness, colours, grain and star sizes, so that the edges of the photograph cannot be found. Farther from the photograph let the Milky Way cloud thin out gradually into the darker, emptier sky that surrounds the magenta, with no visible boundary. The new parts must be new sky, not a mirror image or a repeat of the photograph. Keep the photograph exactly as it is, with every star in the same place, and keep the darker sky outside the magenta as it is. No magenta may remain anywhere. Near-black blue background. No planet, no horizon, no ground, no sun, no moon, no bright nebula, no glow, no text, no border, no frame.";
let r;
try {
  r = await tools.generate_image({ prompt, filename: 'gen/neptune-sky-ext-t1', model: 'seedream_5', aspect_ratio: '16:9', images: ['/home/user/workspace/gen/neptune-sky-ext-in.jpg'] });
} catch (e) {
  text('first model failed: ' + String(e));
  r = await tools.generate_image({ prompt, filename: 'gen/neptune-sky-ext-t1', aspect_ratio: '16:9', images: ['/home/user/workspace/gen/neptune-sky-ext-in.jpg'] });
}
const { image_urls, ...rest } = r;
text(JSON.stringify(rest).slice(0, 800));
