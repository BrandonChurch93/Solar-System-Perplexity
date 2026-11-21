import numpy as np, cv2

W, H = 2816, 1584
M, MB = 704, 396
WORK = 'out/work/earth/relief'
im = cv2.imread('references/approved/earth-close.jpg').astype(np.float32)
CW, CH = W + 2 * M, H + MB


def low(a, s):
    return cv2.GaussianBlur(a, (0, 0), s)


def corrected(name, inside, axis, edge):
    t = cv2.imread(f'{WORK}/edge-{name}-aligned.png').astype(np.float32)
    x0, y0, x1, y1, ox, oy = inside
    ref = im[oy:oy + (y1 - y0), ox:ox + (x1 - x0)]
    d = low(ref, 14) - low(t[y0:y1, x0:x1], 14)
    out = t.copy()
    if axis == 'x':
        col = d[:, edge - x0:edge - x0 + 1] if edge > x0 else d[:, 0:1]
        col = d[:, -1:] if edge == x1 else d[:, 0:1]
        col = cv2.GaussianBlur(np.repeat(col, 3, 1), (0, 0), 6)[:, 1:2]
        xs = np.arange(W)
        dist = np.where(edge == x1, xs - x1, x0 - xs).clip(0, None)
        w = np.exp(-dist / 500.0)[None, :, None]
        out = t + col * w
        out[y0:y1, x0:x1] = t[y0:y1, x0:x1]
    else:
        row = d[-1:, :]
        row = cv2.GaussianBlur(np.repeat(row, 3, 0), (0, 0), 6)[1:2]
        ys = np.arange(H)
        dist = (ys - y1).clip(0, None)
        w = np.exp(-dist / 400.0)[:, None, None]
        out = t + row * w
    print(name, 'seam correction mean', np.round(d.reshape(-1, 3).mean(0), 2), 'edge rms', float(np.sqrt(((col if axis == 'x' else row) ** 2).mean())))
    return np.clip(out, 0, 255)


left = corrected('left', (M, 0, W, H, 0, 0), 'x', M)
right = corrected('right', (0, 0, W - M, H, M, 0), 'x', W - M)
bottom = corrected('bottom', (0, 0, W, H - MB, 0, MB), 'y', H - MB)

canvas = np.zeros((CH, CW, 3), np.float32)
canvas[:] = (255, 0, 255)
canvas[0:H, 0:M] = left[:, 0:M]
canvas[0:H, M + W:CW] = right[:, W - M:W]
canvas[H:CH, M:M + W] = bottom[H - MB:H]
canvas[0:H, M:M + W] = im
cv2.imwrite(f'{WORK}/canvas-1x.png', canvas.astype(np.uint8))
np.save(f'{WORK}/strip-left.npy', left[:, 0:M + 96].astype(np.uint8))
np.save(f'{WORK}/strip-right.npy', right[:, W - M - 96:W].astype(np.uint8))
np.save(f'{WORK}/strip-bottom.npy', bottom[H - MB - 96:H].astype(np.uint8))
cv2.imwrite(f'{WORK}/strip-left.png', left[:, 0:M + 96].astype(np.uint8))
cv2.imwrite(f'{WORK}/strip-right.png', right[:, W - M - 96:W].astype(np.uint8))
cv2.imwrite(f'{WORK}/strip-bottom.png', bottom[H - MB - 96:H].astype(np.uint8))
top = canvas[0:MB][::-1]
top = cv2.GaussianBlur(top, (0, 0), 20)
pad = np.concatenate([top, canvas], 0)
small = cv2.resize(pad, (2816, 1584), interpolation=cv2.INTER_AREA)
mag = cv2.resize((np.abs(pad - (255, 0, 255)).sum(2) < 30).astype(np.float32), (2816, 1584), interpolation=cv2.INTER_AREA) > 0.01
small[mag] = (255, 0, 255)
cv2.imwrite(f'{WORK}/corner-input.jpg', small.astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 96])
cv2.imwrite('out/work/earth/view/canvas-1x.jpg', cv2.resize(canvas, (1408, 660), interpolation=cv2.INTER_AREA).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
