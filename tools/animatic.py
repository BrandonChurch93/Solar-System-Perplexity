import json
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

cv2.setNumThreads(1)

HOLD_START_SCALE = 1.00
HOLD_END_SCALE = 1.08
DIVE_MAX_SCALE = 5.20
TERRAIN_START_SUN = 1.00
TERRAIN_START_PLANET = 1.04
TERRAIN_END_SUN = 1.12
TERRAIN_END_PLANET = 1.14
RISE_END_SCALE = 1.00
TRAVEL_SHRINK_MIN = 0.010
TRAVEL_GROW_MIN = 0.008
RADIAL_BLUR_SAMPLES = 15
RADIAL_BLUR_SPAN = 0.28


def clamp01(x: float) -> float:
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    return x


def smoothstep(x: float) -> float:
    t = clamp01(x)
    return t * t * (3.0 - 2.0 * t)


def smoothstep_array(arr: np.ndarray) -> np.ndarray:
    t = np.clip(arr, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def exp_interp(a: float, b: float, t: float) -> float:
    return a * ((b / a) ** t)


def radial_zoom_state(s0: float, s1: float, sx: float, sy: float, q: float):
    sc = exp_interp(s0, s1, q)
    denom = (1.0 / s0) - (1.0 / s1)
    if abs(denom) < 1e-9:
        w = q
    else:
        w = ((1.0 / s0) - (1.0 / sc)) / denom
    cx = 0.5 + w * (sx - 0.5)
    cy = 0.5 + w * (sy - 0.5)
    factor = (s0 * s1) / (s1 - s0)
    ux = clamp01(0.5 + factor * (sx - 0.5))
    uy = clamp01(0.5 + factor * (sy - 0.5))
    return cx, cy, sc, ux, uy


def validate_config(cfg: dict, root: Path):
    fps = cfg["film"]["fps"]
    duration = cfg["film"]["durationSeconds"]
    segments = cfg["segments"]
    stops = cfg["stops"]

    if len(segments) == 0:
        raise ValueError("segments list is empty")
    if abs(segments[0]["start"] - 0.0) > 1e-9:
        raise ValueError("first segment must start at 0")
    prev_end = 0.0
    for seg in segments:
        start = float(seg["start"])
        end = float(seg["end"])
        if abs(start - prev_end) > 1e-9:
            raise ValueError(f"segment gap or overlap at {seg['id']}")
        if end <= start:
            raise ValueError(f"non-positive segment length at {seg['id']}")
        sf = start * fps
        ef = end * fps
        if abs(sf - round(sf)) > 1e-6 or abs(ef - round(ef)) > 1e-6:
            raise ValueError(f"segment {seg['id']} not on whole frame")
        prev_end = end
    if abs(prev_end - float(duration)) > 1e-9:
        raise ValueError("last segment does not end at film.durationSeconds")

    for stop in stops:
        for key in ("hero", "close"):
            p = root / stop[key]
            if not p.is_file():
                raise FileNotFoundError(f"missing approved image: {stop[key]}")


class MipImage:
    def __init__(self, path: Path):
        im = Image.open(path).convert("RGB")
        self.levels = []
        w, h = im.size
        cur = im
        while True:
            arr = np.asarray(cur, dtype=np.float32)
            self.levels.append(arr)
            if w <= 32 or h <= 18:
                break
            w = max(16, w // 2)
            h = max(9, h // 2)
            cur = cur.resize((w, h), Image.Resampling.LANCZOS)
        center_patch = self.levels[-1]
        mean_col = center_patch.mean(axis=(0, 1))
        peak = float(max(mean_col.max(), 1.0))
        self.tint = np.clip((mean_col / peak) * 235.0 + 20.0, 60.0, 255.0).astype(np.float32)

    def sample(self, cx: float, cy: float, scale: float, px: float, py: float, out_w: int, out_h: int) -> np.ndarray:
        w0 = self.levels[0].shape[1]
        texels_per_px = (float(w0) / float(out_w)) / max(scale, 1e-5)
        max_lvl = len(self.levels) - 1
        lod = 0.0
        if texels_per_px > 1.0:
            lod = min(float(max_lvl), math.log2(texels_per_px))
        l0 = int(math.floor(lod))
        l1 = min(max_lvl, l0 + 1)
        frac = lod - float(l0)
        img0 = self._warp_level(l0, cx, cy, scale, px, py, out_w, out_h)
        if l1 == l0 or frac <= 1e-4:
            return img0
        img1 = self._warp_level(l1, cx, cy, scale, px, py, out_w, out_h)
        return img0 * (1.0 - frac) + img1 * frac

    def _warp_level(self, lvl: int, cx: float, cy: float, scale: float, px: float, py: float, out_w: int, out_h: int) -> np.ndarray:
        src = self.levels[lvl]
        lh, lw = src.shape[:2]
        ax = float(lw) / (float(out_w) * scale)
        bx = (cx + (0.5 / float(out_w) - px) / scale) * float(lw) - 0.5
        ay = float(lh) / (float(out_h) * scale)
        by = (cy + (0.5 / float(out_h) - py) / scale) * float(lh) - 0.5
        mat = np.array([[ax, 0.0, bx], [0.0, ay, by]], dtype=np.float32)
        return cv2.warpAffine(
            src,
            mat,
            (out_w, out_h),
            flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(0.0, 0.0, 0.0),
        )


def apply_radial_blur(img: np.ndarray, ux: float, uy: float, strength: float) -> np.ndarray:
    if strength <= 1e-4:
        return img
    h, w = img.shape[:2]
    fx = ux * float(w)
    fy = uy * float(h)
    span = RADIAL_BLUR_SPAN * strength
    acc = np.zeros_like(img, dtype=np.float32)
    w_sum = 0.0
    for i in range(RADIAL_BLUR_SAMPLES):
        frac = float(i) / float(RADIAL_BLUR_SAMPLES - 1)
        z = math.exp(span * frac)
        inv_z = 1.0 / z
        weight = 1.0 - 0.35 * abs(2.0 * frac - 1.0)
        bx = fx * (1.0 - inv_z) + 0.5 * (inv_z - 1.0)
        by = fy * (1.0 - inv_z) + 0.5 * (inv_z - 1.0)
        mat = np.array([[inv_z, 0.0, bx], [0.0, inv_z, by]], dtype=np.float32)
        warped = cv2.warpAffine(
            img,
            mat,
            (w, h),
            flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
            borderMode=cv2.BORDER_REPLICATE,
        )
        acc += warped * weight
        w_sum += weight
    return acc / w_sum


def build_starfield(seed: int, out_w: int, out_h: int):
    rng = np.random.Generator(np.random.PCG64(seed))
    pad_w = int(round(out_w * 1.2))
    pad_h = int(round(out_h * 1.2))
    sky = np.zeros((pad_h, pad_w, 3), dtype=np.float32)
    sky[:, :, 0] = 2.0
    sky[:, :, 1] = 2.5
    sky[:, :, 2] = 4.0

    star_count = int(round((pad_w * pad_h) / 650.0))
    xs = rng.uniform(2.0, float(pad_w - 3), size=star_count)
    ys = rng.uniform(2.0, float(pad_h - 3), size=star_count)
    mags = rng.power(4.2, size=star_count)
    temps = rng.uniform(0.0, 1.0, size=star_count)

    for i in range(star_count):
        lum = 22.0 + 185.0 * float(mags[i])
        tp = float(temps[i])
        if tp < 0.30:
            col = np.array([0.82, 0.90, 1.00], dtype=np.float32) * lum
        elif tp < 0.78:
            col = np.array([1.00, 0.99, 0.96], dtype=np.float32) * lum
        else:
            col = np.array([1.00, 0.88, 0.72], dtype=np.float32) * lum

        x0 = int(math.floor(xs[i]))
        y0 = int(math.floor(ys[i]))
        fx = float(xs[i]) - float(x0)
        fy = float(ys[i]) - float(y0)
        w00 = (1.0 - fx) * (1.0 - fy)
        w10 = fx * (1.0 - fy)
        w01 = (1.0 - fx) * fy
        w11 = fx * fy
        sky[y0, x0] += col * w00
        sky[y0, x0 + 1] += col * w10
        sky[y0 + 1, x0] += col * w01
        sky[y0 + 1, x0 + 1] += col * w11
        if mags[i] > 0.82:
            halo = col * 0.14
            sky[y0 - 1, x0] += halo
            sky[y0 + 1, x0] += halo
            sky[y0, x0 - 1] += halo
            sky[y0, x0 + 1] += halo

    return np.clip(sky, 0.0, 255.0)


def crop_starfield(sky: np.ndarray, shift_x: float, shift_y: float, out_w: int, out_h: int) -> np.ndarray:
    sh, sw = sky.shape[:2]
    ox = 0.5 * float(sw - out_w) + shift_x
    oy = 0.5 * float(sh - out_h) + shift_y
    mat = np.array([[1.0, 0.0, ox], [0.0, 1.0, oy]], dtype=np.float32)
    return cv2.warpAffine(
        sky,
        mat,
        (out_w, out_h),
        flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
        borderMode=cv2.BORDER_REPLICATE,
    )


def add_point_star(canvas: np.ndarray, px: float, py: float, radius_px: float, strength: float, color: np.ndarray, grid_x: np.ndarray, grid_y: np.ndarray):
    if strength <= 1e-4:
        return
    h, w = canvas.shape[:2]
    cx = px * float(w)
    cy = py * float(h)
    dx = grid_x[None, :] - cx
    dy = grid_y[:, None] - cy
    r2 = dx * dx + dy * dy
    core = np.exp(-r2 / max(0.8, 0.22 * radius_px * radius_px))
    halo = 0.38 * np.exp(-r2 / max(4.0, 2.6 * radius_px * radius_px))
    rays = 0.14 * np.exp(-np.abs(dy) / 1.15) * np.exp(-(dx * dx) / max(12.0, 16.0 * radius_px * radius_px))
    rays += 0.10 * np.exp(-np.abs(dx) / 1.15) * np.exp(-(dy * dy) / max(12.0, 16.0 * radius_px * radius_px))
    profile = (core + halo + rays) * strength
    canvas += profile[:, :, None] * color[None, None, :]


def composite_space_body(
    canvas: np.ndarray,
    mip: MipImage,
    scale: float,
    px: float,
    py: float,
    alpha: float,
    norm_x: np.ndarray,
    norm_y: np.ndarray,
    pix_x: np.ndarray,
    pix_y: np.ndarray,
):
    if alpha <= 1e-4:
        return
    out_h, out_w = canvas.shape[:2]
    layer = mip.sample(0.5, 0.5, scale, px, py, out_w, out_h)

    if scale >= 1.0 - 1e-6 and abs(px - 0.5) < 1e-6 and abs(py - 0.5) < 1e-6 and alpha >= 1.0 - 1e-6:
        canvas[:, :, :] = layer
        return

    if scale >= 1.0 - 1e-6:
        canvas[:, :, :] = canvas * (1.0 - alpha) + layer * alpha
        return

    nx = 2.0 * (0.5 + (norm_x - px) / max(scale, 1e-5)) - 1.0
    ny = 2.0 * (0.5 + (norm_y - py) / max(scale, 1e-5)) - 1.0
    abs_nx = np.abs(nx)[None, :]
    abs_ny = np.abs(ny)[:, None]
    box_dist = np.maximum(abs_nx, abs_ny)

    edge_w = min(0.28, max(1e-4, 3.0 * (1.0 - scale)))
    box_mask = 1.0 - smoothstep_array((box_dist - (1.0 - edge_w)) / edge_w)

    oval_mix = smoothstep((1.0 - scale) / 0.25)
    r = np.sqrt((nx[None, :] * 1.02) ** 2 + (ny[:, None] * 1.06) ** 2)
    oval_mask = 1.0 - smoothstep_array((r - 0.56) / (0.96 - 0.56))

    mask = box_mask * ((1.0 - oval_mix) + oval_mix * oval_mask)
    w_arr = (alpha * mask)[:, :, None]
    canvas[:, :, :] = canvas * (1.0 - w_arr) + layer * w_arr

    if scale < 0.09:
        glow_amt = alpha * smoothstep((0.09 - scale) / 0.075)
        add_point_star(canvas, px, py, 5.5, glow_amt * 0.95, mip.tint, pix_x, pix_y)


def load_label_font(size_px: int):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.isfile(path):
            return ImageFont.truetype(path, size_px)
    return ImageFont.load_default()


def build_label_badges(segment_ids, out_w: int, out_h: int):
    font_px = max(11, int(round(out_h * 0.026)))
    font = load_label_font(font_px)
    pad_x = max(6, int(round(out_w * 0.008)))
    pad_y = max(4, int(round(out_h * 0.007)))
    badges = {}
    dummy = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(dummy)
    for seg_id in segment_ids:
        bbox = d_draw.textbbox((0, 0), seg_id, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        bw = tw + 2 * pad_x
        bh = th + 2 * pad_y
        im = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        dr = ImageDraw.Draw(im)
        dr.rounded_rectangle([(0, 0), (bw - 1, bh - 1)], radius=4, fill=(18, 20, 26, 172))
        dr.text((pad_x - bbox[0], pad_y - bbox[1]), seg_id, font=font, fill=(232, 235, 242, 240))
        rgba = np.asarray(im, dtype=np.float32)
        rgb = rgba[:, :, :3]
        alpha = rgba[:, :, 3:4] / 255.0
        badges[seg_id] = (rgb, alpha)
    return badges


def apply_badge(frame: np.ndarray, badge_tuple, opacity: float, margin_x: int, margin_y: int):
    if opacity <= 1e-4:
        return
    rgb, alpha = badge_tuple
    bh, bw = rgb.shape[:2]
    a = alpha * opacity
    roi = frame[margin_y : margin_y + bh, margin_x : margin_x + bw]
    frame[margin_y : margin_y + bh, margin_x : margin_x + bw] = roi * (1.0 - a) + rgb * a


def bell_curve(u: float, center: float) -> float:
    if u <= center:
        return smoothstep(u / max(center, 1e-6))
    return 1.0 - smoothstep((u - center) / max(1.0 - center, 1e-6))


def main():
    root = Path(__file__).resolve().parent.parent
    cfg_path = root / "config" / "showcase.json"
    spots_path = root / "tools" / "animatic-spots.json"

    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    min_free_gb = float(cfg["sandbox"]["minFreeDiskGb"])
    free_bytes = shutil.disk_usage(root).free
    free_gb = float(free_bytes) / float(1024 ** 3)
    if free_gb < min_free_gb:
        sys.stderr.write(f"Refusing to run: {free_gb:.2f} GB free is under {min_free_gb:.2f} GB\n")
        sys.exit(1)

    validate_config(cfg, root)

    with open(spots_path, "r", encoding="utf-8") as f:
        spots = json.load(f)

    for stop in cfg["stops"]:
        sid = stop["id"]
        if sid not in spots:
            raise KeyError(f"missing dive spot for {sid}")

    fps = int(cfg["film"]["fps"])
    duration_sec = float(cfg["film"]["durationSeconds"])
    frame_count = int(round(fps * duration_sec))
    out_w = int(cfg["formats"]["preview"]["width"])
    out_h = int(cfg["formats"]["preview"]["height"])
    bitrate_mbps = float(cfg["previewFilm"]["bitrateMbps"])
    cover_sec = float(cfg["cover"]["seconds"])
    dive_center = float(cfg["cover"]["diveCenterFraction"])
    rise_center = float(cfg["cover"]["riseCenterFraction"])
    seed = int(cfg["seed"])

    images = {}
    for stop in cfg["stops"]:
        sid = stop["id"]
        images[sid] = {
            "hero": MipImage(root / stop["hero"]),
            "close": MipImage(root / stop["close"]),
        }

    stop_order = [s["id"] for s in cfg["stops"]]
    next_stop_map = {}
    for idx in range(len(stop_order) - 1):
        next_stop_map[stop_order[idx]] = stop_order[idx + 1]

    sky = build_starfield(seed, out_w, out_h)
    segments = cfg["segments"]
    badges = build_label_badges([s["id"] for s in segments], out_w, out_h)
    margin_x = max(10, int(round(out_w * 0.014)))
    margin_y = max(10, int(round(out_h * 0.018)))

    pix_x = np.arange(out_w, dtype=np.float32) + 0.5
    pix_y = np.arange(out_h, dtype=np.float32) + 0.5
    norm_x = pix_x / float(out_w)
    norm_y = pix_y / float(out_h)
    sun_star_color = np.array([255.0, 246.0, 224.0], dtype=np.float32)

    seg_table = []
    for idx, seg in enumerate(segments):
        sf = int(round(float(seg["start"]) * fps))
        ef = int(round(float(seg["end"]) * fps))
        prev_kind = segments[idx - 1]["kind"] if idx > 0 else None
        seg_table.append((sf, ef, seg, prev_kind))

    out_dir = root / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "roughcut.mp4"
    tmp_path = out_dir / "roughcut.tmp.mp4"

    bitrate_k = int(round(bitrate_mbps * 1000.0))
    maxrate_k = int(round(bitrate_mbps * 1250.0))
    bufsize_k = int(round(bitrate_mbps * 2000.0))

    cmd = [
        "ffmpeg",
        "-y",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{out_w}x{out_h}",
        "-r",
        str(fps),
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-b:v",
        f"{bitrate_k}k",
        "-maxrate",
        f"{maxrate_k}k",
        "-bufsize",
        f"{bufsize_k}k",
        "-preset",
        "medium",
        "-threads",
        "1",
        "-fflags",
        "+bitexact",
        "-flags:v",
        "+bitexact",
        "-movflags",
        "+faststart",
        "-frames:v",
        str(frame_count),
        str(tmp_path),
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    seg_cursor = 0

    try:
        for frame_idx in range(frame_count):
            while seg_cursor + 1 < len(seg_table) and frame_idx >= seg_table[seg_cursor][1]:
                seg_cursor += 1
            sf, ef, seg, prev_kind = seg_table[seg_cursor]
            seg_len = ef - sf
            seg_dur = float(seg["end"]) - float(seg["start"])
            kind = seg["kind"]
            stop_id = seg["stop"]
            seg_id = seg["id"]

            if kind == "fade":
                u = float(frame_idx - sf) / float(max(1, seg_len - 1))
            else:
                u = float(frame_idx - sf) / float(seg_len)

            label_opacity = 1.0

            if kind == "hold":
                e = smoothstep(u)
                sc = exp_interp(HOLD_START_SCALE, HOLD_END_SCALE, e)
                frame = images[stop_id]["hero"].sample(0.5, 0.5, sc, 0.5, 0.5, out_w, out_h)

            elif kind == "terrain":
                e = smoothstep(u)
                s0 = TERRAIN_START_SUN if stop_id == "sun" else TERRAIN_START_PLANET
                s1 = TERRAIN_END_SUN if stop_id == "sun" else TERRAIN_END_PLANET
                sc = exp_interp(s0, s1, e)
                frame = images[stop_id]["close"].sample(0.5, 0.5, sc, 0.5, 0.5, out_w, out_h)

            elif kind == "dive":
                sp = spots[stop_id]
                sx, sy = float(sp["x"]), float(sp["y"])
                e = smoothstep(u)
                cx, cy, sc_hero, ux, uy = radial_zoom_state(HOLD_END_SCALE, DIVE_MAX_SCALE, sx, sy, e)
                hero_img = images[stop_id]["hero"].sample(cx, cy, sc_hero, 0.5, 0.5, out_w, out_h)

                sc_close = exp_interp(1.00, TERRAIN_START_PLANET, e)
                close_img = images[stop_id]["close"].sample(0.5, 0.5, sc_close, 0.5, 0.5, out_w, out_h)

                half_w = min(0.5 * (cover_sec / seg_dur), dive_center - 0.02, 0.98 - dive_center)
                half_w = max(half_w, 0.02)
                alpha_close = smoothstep((u - (dive_center - half_w)) / (2.0 * half_w))

                blended = hero_img * (1.0 - alpha_close) + close_img * alpha_close
                b_ux = ux * (1.0 - alpha_close) + 0.5 * alpha_close
                b_uy = uy * (1.0 - alpha_close) + 0.5 * alpha_close
                blur_amt = bell_curve(u, dive_center)
                frame = apply_radial_blur(blended, b_ux, b_uy, blur_amt)

            elif kind == "rise":
                sp = spots[stop_id]
                sx, sy = float(sp["x"]), float(sp["y"])
                e = smoothstep(u)
                s_close_start = TERRAIN_END_SUN if stop_id == "sun" else TERRAIN_END_PLANET
                sc_close = exp_interp(s_close_start, 1.00, e)
                close_img = images[stop_id]["close"].sample(0.5, 0.5, sc_close, 0.5, 0.5, out_w, out_h)

                cx, cy, sc_hero, ux, uy = radial_zoom_state(RISE_END_SCALE, DIVE_MAX_SCALE, sx, sy, 1.0 - e)
                hero_img = images[stop_id]["hero"].sample(cx, cy, sc_hero, 0.5, 0.5, out_w, out_h)

                half_w = min(0.5 * (cover_sec / seg_dur), rise_center - 0.02, 0.98 - rise_center)
                half_w = max(half_w, 0.02)
                alpha_hero = smoothstep((u - (rise_center - half_w)) / (2.0 * half_w))

                blended = close_img * (1.0 - alpha_hero) + hero_img * alpha_hero
                b_ux = 0.5 * (1.0 - alpha_hero) + ux * alpha_hero
                b_uy = 0.5 * (1.0 - alpha_hero) + uy * alpha_hero
                blur_amt = bell_curve(u, rise_center)
                frame = apply_radial_blur(blended, b_ux, b_uy, blur_amt)

            elif kind == "travel":
                dep_start_scale = HOLD_END_SCALE if prev_kind == "hold" else RISE_END_SCALE
                next_id = next_stop_map[stop_id]
                pan = smoothstep(u) * 14.0 - 7.0
                frame = crop_starfield(sky, pan, 0.0, out_w, out_h)

                if u < 0.60:
                    dep_t = smoothstep(u / 0.60)
                    dep_scale = exp_interp(dep_start_scale, TRAVEL_SHRINK_MIN, dep_t)
                    dep_drift = smoothstep((0.95 - dep_scale) / 0.55)
                    dep_px = 0.5 - 0.14 * dep_drift
                    dep_py = 0.5 + 0.03 * dep_drift
                    dep_alpha = 1.0 - smoothstep((u - 0.40) / 0.20)
                    composite_space_body(
                        frame,
                        images[stop_id]["hero"],
                        dep_scale,
                        dep_px,
                        dep_py,
                        dep_alpha,
                        norm_x,
                        norm_y,
                        pix_x,
                        pix_y,
                    )

                if u > 0.34:
                    arr_t = smoothstep((u - 0.34) / 0.66)
                    arr_scale = exp_interp(TRAVEL_GROW_MIN, HOLD_START_SCALE, arr_t)
                    arr_drift = smoothstep((0.95 - arr_scale) / 0.55)
                    arr_px = 0.5 + 0.14 * arr_drift
                    arr_py = 0.5 - 0.03 * arr_drift
                    arr_alpha = smoothstep((u - 0.34) / 0.14)
                    composite_space_body(
                        frame,
                        images[next_id]["hero"],
                        arr_scale,
                        arr_px,
                        arr_py,
                        arr_alpha,
                        norm_x,
                        norm_y,
                        pix_x,
                        pix_y,
                    )

            elif kind == "retreat":
                e = smoothstep(u)
                pan_x = -12.0 * (1.0 - e)
                frame = crop_starfield(sky, pan_x, 0.0, out_w, out_h)

                star_in = smoothstep((u - 0.42) / 0.58)
                star_px = 0.56 + (0.52 - 0.56) * star_in
                add_point_star(frame, star_px, 0.48, 4.8, star_in, sun_star_color, pix_x, pix_y)

                nep_scale = exp_interp(RISE_END_SCALE, 0.008, e)
                nep_drift = smoothstep((0.95 - nep_scale) / 0.55)
                nep_px = 0.5 - 0.24 * nep_drift
                nep_py = 0.5 + 0.06 * nep_drift
                nep_alpha = 1.0 - smoothstep((u - 0.68) / 0.26)
                composite_space_body(
                    frame,
                    images["neptune"]["hero"],
                    nep_scale,
                    nep_px,
                    nep_py,
                    nep_alpha,
                    norm_x,
                    norm_y,
                    pix_x,
                    pix_y,
                )

            elif kind == "lookback":
                e = smoothstep(u)
                pan_x = 6.0 * e
                frame = crop_starfield(sky, pan_x, 0.0, out_w, out_h)
                star_px = 0.52 - (6.0 * e) / float(out_w)
                add_point_star(frame, star_px, 0.48, 4.8, 1.0, sun_star_color, pix_x, pix_y)

            elif kind == "fade":
                e = smoothstep(u)
                frame = crop_starfield(sky, 6.0, 0.0, out_w, out_h)
                star_px = 0.52 - 6.0 / float(out_w)
                add_point_star(frame, star_px, 0.48, 4.8, 1.0, sun_star_color, pix_x, pix_y)
                brightness = 1.0 - e
                frame *= brightness
                label_opacity = 1.0 - smoothstep((u - 0.80) / 0.20)

            else:
                raise ValueError(f"unknown segment kind: {kind}")

            apply_badge(frame, badges[seg_id], label_opacity, margin_x, margin_y)
            rgb_bytes = np.clip(np.rint(frame), 0.0, 255.0).astype(np.uint8).tobytes()
            proc.stdin.write(rgb_bytes)

        proc.stdin.close()
    except Exception:
        if proc.stdin and not proc.stdin.closed:
            proc.stdin.close()
        proc.kill()
        proc.wait()
        if tmp_path.exists():
            tmp_path.unlink()
        raise

    rc = proc.wait()
    if not (rc == 0):
        if tmp_path.exists():
            tmp_path.unlink()
        raise RuntimeError(f"ffmpeg exited with code {rc}")

    max_bytes = float(cfg["repo"]["maxFileMb"]) * 1024.0 * 1024.0
    if float(tmp_path.stat().st_size) > max_bytes:
        tmp_path.unlink()
        raise RuntimeError("output exceeds repo.maxFileMb")

    tmp_path.replace(out_path)


if __name__ == "__main__":
    main()
