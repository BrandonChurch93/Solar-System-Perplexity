"""The sky picture of the hold without the grain of its glow input.

The picture is the approved hero minus the film's own glow (patch.py hold), cleaned up (clean.py hold). The first
glow input was a still of the judged hold with the patch gain at 0, taken with the film's grain and dither on,
so the picture carried the negative of the grain of that one frame, and at that frame the film's grain and the
picture's sky cancelled in part.

The fill and the round 2 file of the first build are gone, so the picture cannot be built again from nothing.
This tool builds again what the glow input enters, and only that: where the picture is the hero's own sky it runs
the same steps (hero minus glow, stored at 8 bit, split into a calm floor and stars, as patch.py and clean.py do)
once with the glow as it was first made and once with the glow taken without grain, and adds the difference of
the two to the kept picture. Where the first run gives the kept picture back (the share is printed) the result
is the second run itself; in the far sky, where it gives it back but for single pixels (stars at the limit of the
split), the second run is taken as it is for those too, so no grain stays at them. The body, the fill behind it
and the margin keep their bytes.

The glow input: the still of the judged hold with the patch gain at 0 in the view without grain (--diag
nograin), plus the even level the grain had added in the dark (grain is cut off at black, so on black it adds a
little light on average): that level is kept as a Gaussian of the difference of the two stills, its pattern is
not. What is left of a change of level after the steps (near the body, where the difference is cut off at black)
is taken out of the change the same way, so the sky keeps its level everywhere and loses the pattern.

  python3 assets-src/saturn/sky/glow.py SOURCE.webp FIRST.png CLEAN.png [NOISE] [SIGMA] [REACH] [CALM]

SOURCE: the full size picture as kept (3520 x 1980). FIRST: the glow still with grain. CLEAN: the glow still
without grain. NOISE: the noise level the kept take split its stars with, in scene values (0.00046, found by
running the first glow through the same steps for a row of levels and taking the one that gives the kept file
back best). SIGMA: the width of the Gaussian that keeps the level of the grain, in pixels of the picture (16).
REACH and CALM: the sky is calm where the first run misses the kept picture by less than CALM levels (0.5) on
the mean of a box of REACH pixels (41).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "wrap"))
from lib import ROOT, WORK, plane_hit, spheroid_hit  # noqa: E402
from patch import FULL, LW, MARGIN, film, scene, step, to_linear, to_srgb, unfilm  # noqa: E402


def display(lin):
    return to_srgb(film(lin)) * 255


def stored(lin):
    # the round 2 file held the composed sky at 8 bit
    return unfilm(to_linear(np.floor(display(lin) + 0.5) / 255)).astype(np.float32)


def split(lin, noise):
    # the calm floor and the stars over it, as patch.layers and clean.split do, with a given noise level
    low = np.stack([ndi.gaussian_filter(ndi.grey_opening(lin[..., i], size=(9, 9)), 5) for i in range(3)], -1)
    res = lin - low
    stars = np.maximum(res, 0) * step(res @ LW, 2.5 * noise, 5 * noise)[..., None]
    stars = stars * step(stars @ LW, 2.5 * noise, 5 * noise)[..., None]
    return low + stars


def own_sky(hero, glow):
    # where the picture is the hero's own sky: as patch.hold and patch.compose
    from geo import FIT, hero_camera, ring_frame
    cam = hero_camera(FIT)
    xs, ys = np.meshgrid(np.arange(cam.w) + 0.5, np.arange(cam.h) + 0.5)
    d = cam.rays_world(xs, ys)
    n = ring_frame()[:, 1]
    hit, _ = spheroid_hit(cam.pos, d, n)
    tr, pr = plane_hit(cam.pos, d, n)
    body = hit | ((tr > 0) & (np.linalg.norm(pr, axis=-1) < 2.45))
    moon = np.array(FIT["moons"][0]["position"])
    mx, my, _ = cam.project(moon)
    mr = FIT["moons"][0]["radius"] / np.linalg.norm(moon - cam.pos) / np.tan(np.radians(cam.vfov) / 2) * cam.h / 2
    body |= np.hypot(xs - mx, ys - my) < mr * 1.5 + 14
    la = ndi.gaussian_filter(hero @ LW, 10)
    lg = ndi.gaussian_filter(glow @ LW, 10)
    far = ndi.distance_transform_edt(~body)
    own = step(far, 5, 14) * (1 - step(lg / np.maximum(la, 1e-5), 0.6, 0.85))
    return ndi.gaussian_filter(own, 3), far


def main(source, first, clean, noise=0.00046, sigma=16.0, reach=41, calm_under=0.5):
    src = np.asarray(Image.open(source).convert("RGB"))
    px, py = round(FULL[0] * MARGIN), round(FULL[1] * MARGIN)
    if src.shape[:2] != (FULL[1] + 2 * py, FULL[0] + 2 * px):
        sys.exit("the source is not the full size picture")
    inner = src[py:py + FULL[1], px:px + FULL[0]].astype(np.float32)
    kept = unfilm(to_linear(inner / 255)).astype(np.float32)
    hero = scene(ROOT / "references/approved/saturn-hero.png", Image.LANCZOS, True)
    g_first = scene(first, Image.BICUBIC)
    g_clean = scene(clean, Image.BICUBIC)
    level = np.stack([ndi.gaussian_filter((g_first - g_clean)[..., i], sigma) for i in range(3)], -1)
    g_new = np.maximum(g_clean + level, 0)
    own, far = own_sky(hero, g_first)
    was = split(stored(np.maximum(hero - g_first, 0)), noise)
    now = split(stored(np.maximum(hero - g_new, 0)), noise)
    dark = (own > 0.98) & (far > 100)
    back = np.abs(np.floor(display(was) + 0.5) - inner).max(-1)[dark]
    print("the first glow through the same steps against the kept picture, dark sky (share %.3f of the frame): equal %.4f, within 1 level %.4f, within 2 %.4f, largest %d" % (dark.mean(), (back == 0).mean(), (back <= 1).mean(), (back <= 2).mean(), back.max()))
    print("glow in the dark sky, levels of 255: first %s, without grain %s, as used %s" % (display(g_first)[dark].mean(0).round(3), display(g_clean)[dark].mean(0).round(3), display(g_new)[dark].mean(0).round(3)))
    change = display(kept + own[..., None] * (now - was)) - display(kept)
    # where the first run gives the kept picture back on the whole (a calm neighbourhood: the far sky), the
    # few pixels it misses are stars at the limit of the split that fell on the other side of it; there the
    # difference of the runs would leave the grain in, so the second run is taken as it is
    miss = np.abs(np.floor(display(was) + 0.5) - inner).max(-1)
    calm = (ndi.uniform_filter(np.minimum(miss, 20), reach) < calm_under) & (own > 0.98)
    change[calm] = (display(now) - inner)[calm]
    print("the second run taken as it is on %.4f of the hero's own sky, of which %.4f are pixels the first run misses" % (calm.sum() / (own > 0.98).sum(), (miss[calm] > 0).mean()))
    # the level stays the kept one: near the body the film's glow is brighter than the hero's sky in places and
    # the difference is cut off at black, which the grain had lifted a little; the mean of the change over a
    # Gaussian is taken out again, weighted by the sky's own share, so only the pattern goes
    share = np.maximum(ndi.gaussian_filter(own, sigma), 0.05)
    mean = np.stack([ndi.gaussian_filter(change[..., i], sigma) for i in range(3)], -1) / share[..., None]
    print("level of the change before it is taken out, levels of 255: dark sky %s, own sky within 100 px of the body %s" % (mean[dark].mean(0).round(3), mean[(own > 0.98) & (far <= 100)].mean(0).round(3)))
    change -= own[..., None] * mean
    out8 = np.clip(np.floor(inner + change + 0.5), 0, 255).astype(np.uint8)
    diff = out8.astype(np.int16) - inner.astype(np.int16)
    for name, m in (("dark sky", dark), ("all of the hero's own sky", own > 0.98), ("behind the body (own share 0)", own <= 0)):
        dd = diff[m]
        print("%s: changed pixels %.4f, mean %s, mean abs %.3f, largest %d" % (name, (np.abs(dd).max(-1) > 0).mean(), dd.mean(0).round(4), np.abs(dd).mean(), np.abs(dd).max()))
    wide = src.copy()
    wide[py:py + FULL[1], px:px + FULL[0]] = out8
    img = Image.fromarray(wide)
    for key, k in (("full", 1), ("web", 2)):
        im = img if k == 1 else img.resize((img.size[0] // k, img.size[1] // k), Image.LANCZOS)
        im.save(ROOT / "public/assets/saturn" / key / "sky-hold.webp", lossless=True, quality=90, method=6)
    img.resize((1760, 990), Image.LANCZOS).save(WORK / "sky-hold-preview.jpg", quality=90)
    print("DONE")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit("usage: glow.py SOURCE.webp FIRST.png CLEAN.png [NOISE] [SIGMA] [REACH] [CALM]")
    main(sys.argv[1], sys.argv[2], sys.argv[3], *[float(v) for v in sys.argv[4:6]], *[int(v) for v in sys.argv[6:7]], *[float(v) for v in sys.argv[7:8]])
