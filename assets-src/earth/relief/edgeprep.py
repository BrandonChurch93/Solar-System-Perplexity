import numpy as np, cv2

W, H = 2816, 1584
M, MB = 704, 396
WORK = 'out/work/earth/relief'
im = cv2.imread('references/approved/earth-close.jpg')
q = [cv2.IMWRITE_JPEG_QUALITY, 96]
for name, dst, src in (
    ('left', (slice(0, H), slice(M, W)), (slice(0, H), slice(0, W - M))),
    ('right', (slice(0, H), slice(0, W - M)), (slice(0, H), slice(M, W))),
    ('bottom', (slice(0, H - MB), slice(0, W)), (slice(MB, H), slice(0, W))),
):
    out = np.zeros((H, W, 3), np.uint8)
    out[:] = (255, 0, 255)
    out[dst] = im[src]
    cv2.imwrite(f'{WORK}/edge-input-{name}.jpg', out, q)
