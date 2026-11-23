"""The air picture of the close side (relief-air.png) in two parts for the globe side: the Sun's own light and the rest.

The air dome lays its picture from the limb upward. That is right for the glow that lies along the limb, and wrong for
the Sun, which stands at infinity: when the globe camera climbs, the limb sinks and the Sun must not sink with it.
So the dome of the globe side draws the rest laid from the limb (relief-air-limb.png) plus the Sun's light laid from the
limb as it stood at T (relief-air-sun.png, a picture of its own about the Sun, even steps of azimuth and elevation).
At T the two lie as in the air picture and their sum is the air picture, to the rounding of two 8 bit files.

What counts as the Sun's own light, in scene light (tone.py): what stands above the level the row has outside the
Sun's glow. That level is, on each side of the Sun, the lowest value met on the way from halfWidthDeg in toward the
Sun (rows smoothed by smoothPx, medians over rowMedian rows), and across the Sun a blend of both sides over coreDeg.
Near the limb (below rimDeg) the glow on the horizon lies along the limb and stays with it: there the level is the
row itself, and only across the Sun's column (rimHalfWidthDeg to each side) a straight line between the row's values
at its two ends, so the limb keeps its glow under the Sun and no notch or tooth stays where the Sun stood.
Below the Sun the Sun's light blends over turnDeg into the light above it turned half round about the Sun, so the
Sun's picture is whole and has no edge where the horizon stood at T.

python3 assets-src/venus/place/airsun.py   writes both files to public/assets/venus/{full,web}/ and a check sheet
"""
import json

import cv2
import numpy as np

import lay
import tone

ROOT = lay.ROOT
SPEC = json.loads((ROOT / 'src/stops/venus/plates.json').read_text())['air']['sun']
LOOK_AZ, LOOK_EL, LOOK_POWER = 80.0, 80.0, 0.5  # look.ts motion.air: azDeg, elevDeg, power
SIZE = (1024, 512)


def main():
    img = cv2.imread(str(ROOT / 'public/assets/venus/full/relief-air.png'), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    x_scene = tone.scene(img.astype(np.float64) / 255)
    luma = x_scene @ np.array([0.2, 0.5, 0.3])
    cy, cx = np.unravel_index(np.argmax(cv2.GaussianBlur(luma, (0, 0), 4)), luma.shape)
    az_of = lambda x: (x + 0.5) / w * 2 * LOOK_AZ - LOOK_AZ
    el_of = lambda y: (1 - (y + 0.5) / h) ** (1 / LOOK_POWER) * LOOK_EL
    sun_az, sun_el = float(az_of(cx)), float(el_of(cy))
    at = SPEC['atDeg']
    if abs(sun_az - at[0]) > 0.2 or abs(sun_el - at[1]) > 0.2:
        raise SystemExit(f'the Sun of the air picture stands at {sun_az:.2f}, {sun_el:.2f} deg, plates.json air.sun.atDeg says {at}')
    per_deg = w / (2 * LOOK_AZ)
    half = int(round(SPEC['halfWidthDeg'] * per_deg))
    core = SPEC['coreDeg'] * per_deg
    k = SPEC['rowMedian']
    smooth = cv2.GaussianBlur(x_scene, (0, 0), SPEC['smoothPx'], sigmaY=0.01)
    pad = np.pad(smooth, ((k, k), (0, 0), (0, 0)), mode='edge')
    rows = np.stack([np.median(pad[i:i + 2 * k + 1], axis=0) for i in range(h)])
    xs = np.arange(w)
    lo, hi = max(cx - half, 0), min(cx + half, w - 1)
    left = rows.copy()
    left[:, lo:cx + 1] = np.minimum.accumulate(rows[:, lo:cx + 1], axis=1)
    left[:, cx + 1:] = left[:, cx:cx + 1]
    right = rows.copy()
    right[:, cx:hi + 1] = np.minimum.accumulate(rows[:, cx:hi + 1][:, ::-1], axis=1)[:, ::-1]
    right[:, :cx] = right[:, cx:cx + 1]
    t = lay.smooth(cx - core, cx + core, xs.astype(np.float64))[None, :, None]
    sky_level = left * (1 - t) + right * t
    sky_side = 1 - lay.smooth(1 - SPEC['edge'], 1.0, np.abs(xs - cx) / half)
    # Near the limb the glow changes along the row by itself, so there the level is a straight line between the
    # row's values at rimHalfWidthDeg to each side of the Sun, and the Sun's light ends at that width.
    rim_half = int(round(SPEC['rimHalfWidthDeg'] * per_deg))
    ends = [np.median(rows[:, x0 - 3:x0 + 4], axis=1) for x0 in (cx - rim_half, cx + rim_half)]
    tr = np.clip((xs - (cx - rim_half)) / (2 * rim_half), 0, 1)[None, :, None]
    inside = (np.abs(xs - cx) <= rim_half)[None, :, None]
    rim_level = np.where(inside, ends[0][:, None, :] * (1 - tr) + ends[1][:, None, :] * tr, x_scene)
    rim_level = cv2.GaussianBlur(rim_level, (0, 0), SPEC['smoothPx'], sigmaY=0.01)
    rim_side = np.ones(w)
    high = lay.smooth(SPEC['rimDeg'][0], SPEC['rimDeg'][1], el_of(np.arange(h)))
    level = rim_level * (1 - high)[:, None, None] + sky_level * high[:, None, None]
    side2 = rim_side[None, :] * (1 - high)[:, None] + sky_side[None, :] * high[:, None]
    # The Sun's own picture: even steps of azimuth and elevation about the Sun, lowest elevation in the bottom row.
    bw, below, above = SPEC['boxDeg']
    gw, gh = SIZE
    daz = (np.arange(gw) + 0.5) / gw * 2 * bw - bw
    delv = above - (np.arange(gh) + 0.5) / gh * (below + above)
    d_az_air = az_of(xs) - sun_az
    d_el_air = el_of(np.arange(h)) - sun_el

    def window(d_az, d_el):
        fx = np.minimum(lay.smooth(0.0, 0.08, (d_az + bw) / (2 * bw)), lay.smooth(0.0, 0.08, (bw - d_az) / (2 * bw)))
        fy = lay.smooth(0.0, 0.1, (above - d_el) / (below + above))
        return fx[None, :, None] * fy[:, None, None]

    sun_up = (np.clip(x_scene - level, 0, None) * side2[..., None] * window(d_az_air, d_el_air)).astype(np.float32)

    def from_air(src, d_az, d_el):
        az = sun_az + d_az[None, :] + 0 * d_el[:, None]
        el = sun_el + d_el[:, None] + 0 * d_az[None, :]
        mx = ((az + LOOK_AZ) / (2 * LOOK_AZ) * w - 0.5).astype(np.float32)
        v = (np.clip(el, 0, LOOK_EL) / LOOK_EL) ** LOOK_POWER
        my = ((1 - v) * h - 0.5).astype(np.float32)
        out = cv2.remap(src, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        return out * ((el >= 0) & (el <= LOOK_EL))[..., None]

    def whole(d_az, d_el):
        ramp = lay.smooth(0.0, SPEC['turnDeg'], -d_el)[:, None, None]
        return from_air(sun_up, d_az, d_el) * (1 - ramp) + from_air(sun_up, -d_az, -d_el) * ramp

    foot = lay.smooth(0.0, 0.1, (delv + below) / (below + above))[:, None, None]
    sun_img = np.clip(np.round(tone.display(whole(daz, delv) * foot) * 255), 0, 255).astype(np.uint8)
    sun_img[0, :] = sun_img[-1, :] = 0
    sun_img[:, 0] = sun_img[:, -1] = 0

    # The rest, in the layout of the air picture: the air picture less the Sun's light above the level.
    rest = x_scene - sun_up
    rest_img = np.minimum(np.clip(np.round(tone.display(rest) * 255), 0, 255), img).astype(np.uint8)

    # The Sun's picture as the dome reads it back at T, for the check.
    back_x = ((d_az_air + bw) / (2 * bw) * gw - 0.5).astype(np.float32)
    back_y = ((above - d_el_air) / (below + above) * gh - 0.5).astype(np.float32)
    mx, my = np.meshgrid(back_x, back_y)
    sun_back = cv2.remap(tone.scene(sun_img.astype(np.float64) / 255).astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    for folder in ('full', 'web'):
        cv2.imwrite(str(ROOT / 'public/assets/venus' / folder / SPEC['file']), sun_img)
        cv2.imwrite(str(ROOT / 'public/assets/venus' / folder / SPEC['limbFile']), rest_img)
    again = tone.display(tone.scene(rest_img / 255.0) + sun_back) * 255
    diff = np.abs(again - img.astype(np.float64))
    sheet = np.vstack([img, rest_img, np.clip(again + 0.5, 0, 255).astype(np.uint8), sun_img])
    (lay.WORK / 't').mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(lay.WORK / 't' / 'airsun.jpg'), sheet, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print('Sun in the air picture: column', int(cx), 'row', int(cy), 'azimuth deg', round(sun_az, 2), 'elevation over the horizon deg', round(sun_el, 2))
    print('rest plus Sun against the air picture, of 255: mean', round(float(diff.mean()), 3), '99th percentile', round(float(np.percentile(diff, 99)), 2), 'largest', round(float(diff.max()), 1))
    print('share of the scene light of the air picture that goes with the Sun', round(float(sun_back.sum() / x_scene.sum()), 4))


if __name__ == '__main__':
    main()
