import json
import sys

from PIL import Image, ImageDraw, ImageFont

FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BACKGROUND = (14, 14, 16)
PANEL = (26, 26, 30)
TEXT = (224, 224, 228)
DIM = (150, 150, 158)


def font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except OSError:
        return ImageFont.load_default()


def fitted(path, w, h):
    panel = Image.new('RGB', (w, h), PANEL)
    if path is None:
        return panel
    im = Image.open(path).convert('RGB')
    scale = min(w / im.width, h / im.height)
    size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    im = im.resize(size, Image.LANCZOS)
    panel.paste(im, ((w - size[0]) // 2, (h - size[1]) // 2))
    return panel


def run(job):
    tiles = job['tiles']
    columns = job.get('columns', 2)
    w = job.get('imageWidth', 464)
    h = round(w * 9 / 16)
    gap = 12
    inner = 4
    bar = 30
    tile_w = w * 2 + inner
    tile_h = bar + h
    rows = (len(tiles) + columns - 1) // columns
    head = 44 if job.get('title') else 0
    board = Image.new('RGB', (gap + columns * (tile_w + gap), head + gap + rows * (tile_h + gap)), BACKGROUND)
    draw = ImageDraw.Draw(board)
    if head:
        draw.text((gap, 12), job['title'], fill=TEXT, font=font(22))
    for i, t in enumerate(tiles):
        col = i // rows if job.get('columnMajor', True) else i % columns
        row = i % rows if job.get('columnMajor', True) else i // columns
        x = gap + col * (tile_w + gap)
        y = head + gap + row * (tile_h + gap)
        draw.text((x, y + 4), t['label'], fill=TEXT, font=font(18))
        sub = t.get('sub') or ''
        if sub:
            draw.text((x + 12 + draw.textlength(t['label'], font=font(18)), y + 7), sub, fill=DIM, font=font(14))
        board.paste(fitted(t.get('left'), w, h), (x, y + bar))
        right = fitted(t.get('right'), w, h)
        if t.get('right') is None:
            d = ImageDraw.Draw(right)
            note = t.get('empty') or 'no frame yet'
            d.text(((w - d.textlength(note, font=font(16))) / 2, h / 2 - 10), note, fill=DIM, font=font(16))
        board.paste(right, (x + w + inner, y + bar))
    board.save(job['output'], quality=job.get('quality', 88), optimize=True)


if __name__ == '__main__':
    with open(sys.argv[1]) as f:
        run(json.load(f))
