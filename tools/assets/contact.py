import argparse

from PIL import Image, ImageDraw

from common import ROOT, stop_ids, work_dir


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--long-edge", type=int, default=1400)
    ap.add_argument("--cols", type=int, default=2)
    a = ap.parse_args()
    ims = [(s, Image.open(work_dir(s) / "verify.jpg")) for s in stop_ids()]
    cw = a.long_edge // a.cols
    ch = round(cw * ims[0][1].height / ims[0][1].width)
    rows = -(-len(ims) // a.cols)
    sheet = Image.new("RGB", (cw * a.cols, ch * rows), (0, 0, 0))
    d = ImageDraw.Draw(sheet)
    for i, (s, im) in enumerate(ims):
        x, y = (i % a.cols) * cw, (i // a.cols) * ch
        sheet.paste(im.resize((cw, ch), Image.LANCZOS), (x, y))
        d.text((x + 6, y + 4), s, fill=(255, 255, 0))
    out = ROOT / "out" / "work" / "assets" / "verify-contact.jpg"
    sheet.save(out, quality=90)
    print(out)


if __name__ == "__main__":
    main()
