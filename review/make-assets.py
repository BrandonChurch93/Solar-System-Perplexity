#!/usr/bin/env python3
"""make-assets.py: the pictures and the type of the public review page.
Run from the repo root: python3 review/make-assets.py MASTER.mp4
MASTER.mp4 is the film's picture without subtitles (out/work/film-16x9-final.mp4, 1920x1080, 30 frames a second).
It writes review/assets/stills (two film frames and the two approved pictures of each stop, and the poster)
and review/assets/font (the film's subtitle type, Lato Medium, as a web font). Nothing else is touched."""
import subprocess, sys, os
from fontTools import subset
from fontTools.ttLib import TTFont
MASTER = sys.argv[1]
OUT = 'review/assets/stills/'
STOPS = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
HOLD = {'sun': 270, 'mercury': 540, 'venus': 1110, 'earth': 1680, 'mars': 2250, 'jupiter': 2820, 'saturn': 3390, 'uranus': 3960, 'neptune': 4530}
TERR = {'sun': 0, 'mercury': 780, 'venus': 1350, 'earth': 1920, 'mars': 2490, 'jupiter': 3060, 'saturn': 3630, 'uranus': 4200, 'neptune': 4770}
def frame(f, out, w=1280, q=80):
    png = '/tmp/review-frame.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '%.4f' % (f / 30 + 0.004), '-i', MASTER, '-frames:v', '1', png], check=True)
    subprocess.run(['convert', png, '-resize', '%dx' % w, '-quality', str(q), out], check=True)
def picture(src, out, w=1280, q=80):
    subprocess.run(['convert', src, '-resize', '%dx' % w, '-quality', str(q), out], check=True)
for s in STOPS:
    frame(HOLD[s] + 75, OUT + s + '-whole-film.webp')
    frame(TERR[s] + 90, OUT + s + '-surface-film.webp')
    picture('references/approved/%s-hero.png' % s, OUT + s + '-whole-picture.webp')
    picture('references/approved/%s-close.jpg' % s, OUT + s + '-surface-picture.webp')
frame(3465, OUT + 'poster.jpg', 1920, 86)
opt = subset.Options(); opt.flavor = 'woff'; opt.layout_features = ['kern', 'liga']; opt.name_IDs = ['*']
f = TTFont('/usr/share/fonts/truetype/lato/Lato-Medium.ttf')
sub = subset.Subsetter(opt)
sub.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x2192, 0x2022])
sub.subset(f); f.flavor = 'woff'; f.save('review/assets/font/lato-medium.woff')
print('made', len(os.listdir(OUT)), 'pictures and the font')
