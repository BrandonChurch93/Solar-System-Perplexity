import io
import json
import os
import subprocess
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
FULL = 'public/assets/uranus/full/'
WEB = 'public/assets/uranus/web/'
PLATES = json.load(open('assets-src/uranus/place/plates.json'))


def shadow():
    for base in (FULL, WEB):
        Image.open(base + 'wrap-cloud.png').convert('RGB').getchannel('G').save(base + 'wrap-shadow.png', optimize=True)


def patch():
    name, width, size = PLATES['patchFine']
    raw = subprocess.check_output(['git', 'show', PLATES['patchCommit'] + ':' + FULL + name])
    img = Image.open(io.BytesIO(raw)).convert('RGB')
    img.resize((size, size), Image.LANCZOS).save(FULL + name, quality=93, subsampling=0)
    img.resize((size // 2, size // 2), Image.LANCZOS).save(WEB + name, quality=92, subsampling=0)


def plate(colour, tops):
    size = PLATES['wideSize']
    for base, n in ((FULL, size), (WEB, size // 2)):
        rgb = colour.convert('RGB').resize((n, n), Image.LANCZOS)
        a = tops.convert('L').resize((n, n), Image.LANCZOS)
        Image.merge('RGBA', (*rgb.split(), a)).save(base + 'place-1.png', optimize=True)


if __name__ == '__main__':
    todo = sys.argv[1:]
    if 'shadow' in todo:
        shadow()
    if 'patch' in todo:
        patch()
    if 'plate' in todo:
        plate(Image.open(FULL + 'place-1.jpg'), Image.open(FULL + 'place-tops.png'))
        for base in (FULL, WEB):
            os.remove(base + 'place-1.jpg')
            os.remove(base + 'place-tops.png')
