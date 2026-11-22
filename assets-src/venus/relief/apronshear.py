import sys
import cv2
import numpy as np

OUT = 'public/assets/venus/'
SRC = sys.argv[1] if len(sys.argv) > 1 else OUT + 'full/relief-Ar-color.jpg'
AXIS, TOP, PAD = 320, 286, 704
BLEND = (520, 804)
SLOPE = (0.16, 0.27, 0.37)
ROWS = (180, 330, 620)
LINE = (462, 0.158, 45)
REACH = (900, 1400)
CLEAR = 24


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def slope(y):
    return SLOPE[0] + (SLOPE[1] - SLOPE[0]) * smooth(ROWS[0], ROWS[1], y) + (SLOPE[2] - SLOPE[1]) * smooth(ROWS[1], ROWS[2], y)


old = cv2.imread(SRC).astype(np.float32)
deck = cv2.imread(OUT + 'full/relief-L0-color.jpg').astype(np.float32)
H, W = old.shape[:2]
band = BLEND[1]
lum = cv2.GaussianBlur(cv2.cvtColor(deck[:900, -REACH[1] - 8:].astype(np.uint8), cv2.COLOR_BGR2GRAY), (0, 0), 4).astype(np.float32)
grad = np.diff(lum, axis=0)
inward = lum.shape[1] - 1 - np.arange(lum.shape[1])
rows = np.arange(grad.shape[0])[:, None]
grad[np.abs(rows - (LINE[0] - LINE[1] * inward)[None, :]) > LINE[2]] = -1e9
edge = cv2.GaussianBlur(np.argmax(grad, axis=0).astype(np.float32)[None, :], (0, 0), 40)[0]
print('horizon row in the deck texture, from the edge inward', edge[::-200][:8].round(0))
top = float(edge[-1]) - TOP + CLEAR

yy, xx = np.mgrid[0:band, AXIS:AXIS + REACH[1]].astype(np.float32)
dx = xx - AXIS
grid = np.arange(-2400, band + 1, dtype=np.float32)
y0 = np.empty_like(yy)
for i in range(yy.shape[1]):
    y0[:, i] = np.interp(yy[:, i], grid + slope(grid) * dx[0, i], grid)
over = smooth(top + 40, top, y0)[..., None]
y0 = np.maximum(y0, top)
ys = y0 - slope(y0) * dx
mx = deck.shape[1] - 1 - dx
floor = edge[np.clip(lum.shape[1] - 1 - dx.astype(np.int32), 0, lum.shape[1] - 1)] + CLEAR
new = cv2.remap(deck, mx, np.maximum(ys + TOP, floor), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
new = new * (1 - over) + cv2.GaussianBlur(new, (0, 0), sigmaX=90, sigmaY=2) * over
was = cv2.remap(deck, mx, yy + TOP, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
part = old[:band, AXIS:AXIS + REACH[1]]
print('mirrored fill against the deck texture, mean abs', float(np.abs(part - was)[:BLEND[0]].mean().round(2)))
w = ((1 - smooth(BLEND[0], BLEND[1], yy)) * (1 - smooth(REACH[0], REACH[1], dx)))[..., None]
old[:band, AXIS:AXIS + REACH[1]] = part + w * (new - was)
big = np.clip(old + 0.5, 0, 255).astype(np.uint8)
cv2.imwrite(OUT + 'full/relief-Ar-color.jpg', big, [cv2.IMWRITE_JPEG_QUALITY, 92])
cv2.imwrite(OUT + 'web/relief-Ar-color.jpg', cv2.resize(big, (W // 2, H // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
