"""The three part mask of film frame 90 for the Builder's bands.py (MAIL 1311, MAIL 1318), one png of three
levels: 255 the ground (the approved close image and the film both show ground there), 128 the strip between the
film's own limb and the approved's (ground in the film, sky in the approved; it carries no line), 0 the sky above
the film's limb. The approved's limb is read by eye at nine columns of the picture at 1920 by 1080 and joined by a
cubic; the ground is every pixel more than 10 px below that line. The film's limb is read from two frames of the
film that differ only in the ground (the lab's with haze.air off and the standing ground's): in every column the
topmost row where they differ, a cubic through those rows. bands.py takes a mask as more than 127, so the same png
gives it the ground against the rest.
usage: python3 assets-src/sun/lab/mask.py OUT.png [OVERLAY.jpg] [--film LAB.png STANDING.png]"""
import sys
import numpy as np
from PIL import Image, ImageDraw

LIMB = [(0, 600), (267, 567), (533, 537), (800, 517), (960, 511), (1200, 520), (1467, 547), (1733, 600), (1920, 653)]
FILM = [1.33, 122.168, 20.174, 483.376]
args = sys.argv[1:]
xs = (np.arange(1920) - 960) / 960
if '--film' in args:
    i = args.index('--film')
    a = np.asarray(Image.open(args[i + 1]).convert('RGB')).astype(int)
    b = np.asarray(Image.open(args[i + 2]).convert('RGB')).astype(int)
    del args[i:i + 3]
    d = np.abs(a - b).max(axis=2) > 6
    top = np.array([np.argmax(d[:, x]) if d[:, x].any() else -1 for x in range(1920)])
    ok = top > 0
    f = np.polyfit(xs[ok], top[ok], 3)
    for _ in range(3):
        r = top - np.polyval(f, xs)
        ok = (top > 0) & (np.abs(r) < 4)
        f = np.polyfit(xs[ok], top[ok], 3)
    print('film limb cubic (put into FILM):', [round(float(v), 3) for v in f], 'columns kept', int(ok.sum()), 'rms', round(float(np.sqrt(np.mean((top - np.polyval(f, xs))[ok] ** 2))), 2))
    FILM = f
c = np.polyfit([(p[0] - 960) / 960 for p in LIMB], [p[1] for p in LIMB], 3)
line = np.polyval(c, xs)
rows = np.arange(1080)[:, None]
ground = rows > line[None, :] + 10
out = np.zeros((1080, 1920), np.uint8)
if FILM is not None:
    film = np.polyval(FILM, xs)
    out[rows >= film[None, :]] = 128
    print('film limb at x 0 480 960 1440 1919:', [round(float(film[x]), 1) for x in (0, 480, 960, 1440, 1919)])
out[ground] = 255
Image.fromarray(out).save(args[0])
print('approved limb at x 0 480 960 1440 1919:', [round(float(line[x]), 1) for x in (0, 480, 960, 1440, 1919)], 'shares ground strip sky', [round(float((out == v).mean()), 4) for v in (255, 128, 0)])
if len(args) > 1:
    a = Image.open('references/approved/sun-close.jpg').convert('RGB').resize((1920, 1080), Image.LANCZOS)
    dr = ImageDraw.Draw(a)
    dr.line([(x, float(line[x]) + 10) for x in range(0, 1920, 4)], fill=(0, 255, 255), width=2)
    if FILM is not None:
        dr.line([(x, float(film[x])) for x in range(0, 1920, 4)], fill=(255, 0, 255), width=2)
    a.crop((0, 380, 1920, 700)).resize((1440, 240)).save(args[1], quality=88)
