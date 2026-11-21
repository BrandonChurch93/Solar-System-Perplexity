const base = 'repo/out/work/nep/gen/';
const prompt = `Image 1 is a reference picture of the moon Triton. Paint a flat equirectangular texture map (unwrapped cylindrical projection of the whole surface, longitude horizontally, latitude vertically, north at the top) of this icy moon in the same colours and painterly style as the reference. The whole surface is densely textured like the reference: tightly packed cantaloupe-like dimples and pits, mottled grey-white and cream ice, many small craters, fine cracks, ridges and short dark wind streaks, with no smooth empty areas anywhere. A large mottled salmon-pink and dusty rose polar cap covers the top 45 percent of the map, speckled with paler frost patches, with a ragged, patchy lower edge that breaks up into pink blotches. The lower half is pale grey-white with slightly cooler bluish-grey plains toward the bottom. Flat, evenly lit albedo texture with no shading, no terminator, no sphere, no black background, no stars, no text, no border. The pattern fills the whole 16:9 frame edge to edge with uniform sharpness and fine detail everywhere.`;
const jobs = [['triton-map-t2', 'seedream_5'], ['triton-map-t3', 'gpt_image_2_6_flare']];
const res = await Promise.all(jobs.map(async ([name, model]) => {
  try {
    const r = await tools.generate_image({ prompt, filename: base + name, model, aspect_ratio: '16:9', images: ['repo/out/work/nep/triton-ref.jpg'] });
    return name + ': ' + JSON.stringify(r.paths) + ' ' + (r.assets || []).map(a => a.width + 'x' + a.height).join(',');
  } catch (e) { return name + ': ERROR ' + String(e).slice(0, 300); }
}));
for (const r of res) text(r);
