const base = 'repo/out/work/nep/gen/';
const refDeck = 'repo/out/work/nep/wrap/ref-deck.jpg';
const refCir = 'repo/out/work/nep/wrap/ref-cirrus.jpg';
const deckMid = (extra) => `Image 1 is a reference crop of a flat texture map: the cloud-free upper atmosphere of the planet Neptune, unwrapped as a flat rectangular map with the latitude bands running exactly horizontally. Paint a new, different section of the same map, a continuation of it further around the planet: the same deep electric blue colours, the same painterly grain and fine detail, long horizontal streaks, soft darker indigo belts and lighter cyan-blue zones running left to right across the whole frame, thin dark streaks and a few small elongated dark blue spots, subtle wavy turbulence and small eddies along the band edges. ${extra} Flat, evenly lit texture with no shading, no vignette, no sphere, no horizon, no limb, no stars, no white clouds, no text, no border. The pattern fills the whole 16:9 frame edge to edge with uniform sharpness.`;
const cirMid = (extra) => `Image 1 is a reference: a flat matte of the white cirrus clouds of the planet Neptune on a pure black background, unwrapped as a flat map with latitude running horizontally. Paint a new, different section of the same matte: brilliant white wispy cirrus streaks, long thin feathery filaments and a few broader streaming bands of cloud, all stretched and combed horizontally by fast winds, with fine fibrous detail and soft feathered edges. Sparse: about one sixth of the frame is covered, the rest is pure black. ${extra} Pure black background, white and grey only, no blue, no stars, no planet, no sphere, no text, no border. 16:9 frame.`;
const deckCap = (extra) => `Image 1 is a colour and texture reference. Top-down flat texture map of the polar region of the planet Neptune's cloud-free upper atmosphere, centred exactly on the pole in the middle of the square frame: concentric circular bands around the centre, deep electric blue with soft darker indigo rings and lighter cyan-blue rings, fine circular streaks following the rings, subtle wavy turbulence and small eddies at the ring edges. ${extra} Flat, evenly lit texture that fills the whole square frame edge to edge, the rings continue past the corners. No sphere, no shading, no limb, no black corners, no vignette, no stars, no white clouds, no text.`;
const cirCap = (extra) => `Flat matte: white wispy cirrus clouds on a pure black background, seen top-down over the pole of a planet, the pole exactly at the centre of the square frame: thin feathery white arcs and streaks that curve concentrically around the centre like broken rings, combed by circular winds, fine fibrous detail and soft feathered edges. Sparse: about one eighth of the frame covered, the rest pure black. ${extra} Pure black background, white and grey only, no blue, no stars, no sphere, no disc outline, no text.`;
const jobs = [
  ['deck-m0', deckMid('A broad darker belt runs a little below the middle of the frame and a pale cyan zone near the top.'), '16:9', [refDeck]],
  ['deck-m1', deckMid('A pale cyan zone runs a little above the middle, with a narrow dark belt near the bottom third.'), '16:9', [refDeck]],
  ['deck-m2', deckMid('Several narrow alternating belts and zones of slightly different blues, with one chain of small dark eddies.'), '16:9', [refDeck]],
  ['deck-n', deckCap('A slightly paler, hazier blue cap toward the centre.'), '1:1', [refDeck]],
  ['deck-s', deckCap('A small darker indigo polar spot at the exact centre, with a brighter cyan ring around it.'), '1:1', [refDeck]],
  ['cir-m0', cirMid('The clouds gather in two horizontal belts, one in the upper third and one in the lower third, with empty black between.'), '16:9', [refCir]],
  ['cir-m1', cirMid('One long streaming belt of cloud crosses the whole frame slightly above the middle, with scattered small wisps elsewhere.'), '16:9', [refCir]],
  ['cir-m2', cirMid('Three thin broken belts of streaks at different heights, with small bright knots along them.'), '16:9', [refCir]],
  ['cir-n', cirCap('Most arcs lie in a ring halfway between the centre and the edge.'), '1:1', [refCir]],
  ['cir-s', cirCap('A few arcs close to the centre and a broken outer ring near the edges.'), '1:1', [refCir]],
];
const res = await Promise.all(jobs.map(async ([name, prompt, ar, images]) => {
  try {
    const r = await tools.generate_image({ prompt, filename: base + name + '-t1', model: 'seedream_5', aspect_ratio: ar, images });
    return name + ': ' + JSON.stringify(r.paths) + ' ' + (r.assets || []).map(a => a.width + 'x' + a.height).join(',');
  } catch (e) { return name + ': ERROR ' + String(e).slice(0, 300); }
}));
for (const r of res) text(r);