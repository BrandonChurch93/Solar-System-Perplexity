const prompt = "Edit image 1. Remove the large blue planet, its thin faint rings and the small pale moon completely, and remove every trace of the planet's blue glow and atmosphere halo. Fill the area they covered with deep space that continues the surrounding sky exactly: the same dense field of fine, pinpoint, slightly colored stars, the same soft blue-grey Milky Way band with dark dust lanes that crosses the top of the frame and continues diagonally behind where the planet was, the same near-black blue background, the same star sizes, density, brightness and grain. Keep everything else in the image unchanged: same framing, the same bright star with its fine spikes at the upper right, the same stars in the same places, same exposure and color. No planet, no moon, no rings, no glow, no nebula colors that are not already present, no text, no border.";
let r;
try {
  r = await tools.generate_image({ prompt, filename: 'neptune-sky-fill-t1', model: 'gpt_image_2_6_flare', aspect_ratio: '16:9', images: ['/home/user/workspace/neptune-hero-ref.png'] });
} catch (e) {
  text('first model failed: ' + String(e));
  r = await tools.generate_image({ prompt, filename: 'neptune-sky-fill-t1', model: 'seedream_5', aspect_ratio: '16:9', images: ['/home/user/workspace/neptune-hero-ref.png'] });
}
const { image_urls, ...rest } = r;
text(JSON.stringify(rest).slice(0, 800));