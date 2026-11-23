import sys

from PIL import Image, ImageDraw


def main(prefix, out, cols, width, frames, labels):
    cols = int(cols)
    width = int(width)
    tiles = []
    for f in frames:
        im = Image.open('%s-%s.png' % (prefix, f)).convert('RGB')
        tiles.append(im.resize((width, round(width * im.height / im.width)), Image.LANCZOS))
    h = tiles[0].height
    rows = (len(tiles) + cols - 1) // cols
    pad = 6
    sheet = Image.new('RGB', (cols * width + (cols + 1) * pad, rows * (h + 22) + pad), (24, 24, 24))
    draw = ImageDraw.Draw(sheet)
    for i, t in enumerate(tiles):
        x = pad + (i % cols) * (width + pad)
        y = pad + (i // cols) * (h + 22)
        sheet.paste(t, (x, y))
        draw.text((x + 2, y + h + 4), labels[i] if i < len(labels) else str(frames[i]), fill=(220, 220, 220))
    sheet.save(out, quality=90)


args = sys.argv[1:]
split = args.index('--') if '--' in args else len(args)
main(args[0], args[1], args[2], args[3], args[4:split], args[split + 1:])
