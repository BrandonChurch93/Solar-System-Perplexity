import sys

import numpy as np
from PIL import Image

TINT = np.array([0.62, 0.93, 0.98], np.float32)
SIZE = 2048


def main():
    a = np.asarray(Image.open(sys.argv[1]).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS), np.float32)
    Image.fromarray(np.clip(a * TINT + 0.5, 0, 255).astype(np.uint8)).save(sys.argv[2])


main()
