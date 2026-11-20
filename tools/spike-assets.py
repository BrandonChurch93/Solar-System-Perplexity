import json, sys
import numpy as np
from PIL import Image
cfg = json.load(open('config/showcase.json'))
seed = cfg['seed']
hero = Image.open('references/approved/mars-hero.png').convert('RGB')
w, h = hero.size
crop = hero.crop((w // 2 - h // 3, h // 6, w // 2 + h // 3, h * 5 // 6))
for name in ('full', 'web'):
    ww = cfg['assetSets'][name]['wrapMapWidth']
    half = crop.resize((ww // 2, ww // 2), Image.LANCZOS)
    wrap = Image.new('RGB', (ww, ww // 2))
    wrap.paste(half, (0, 0))
    wrap.paste(half.transpose(Image.FLIP_LEFT_RIGHT), (ww // 2, 0))
    wrap.save(f'public/assets/spike/{name}/wrap.jpg', quality=90)
    sw = cfg['assetSets'][name]['skyWidth']
    rng = np.random.default_rng(seed)
    small = rng.random((sw // 64, sw // 32)).astype(np.float32)
    tiled = np.concatenate([small[:, -8:], small, small[:, :8]], axis=1)
    wide = np.asarray(Image.fromarray((tiled * 255).astype(np.uint8)).resize((sw + 16 * 32, sw // 2), Image.BICUBIC), dtype=np.float32) / 255
    big = wide[:, 8 * 32: 8 * 32 + sw]
    lat = np.linspace(-1, 1, sw // 2)[:, None]
    band = np.exp(-(lat / 0.22) ** 2)
    v = (0.002 + 0.012 * band * (0.4 + 0.6 * big))
    rgb = np.stack([v * 0.95, v * 0.9, v * 1.05], -1)
    Image.fromarray((np.clip(rgb, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)).save(f'public/assets/shared/{name}/sky.jpg', quality=90)
print('ok')
