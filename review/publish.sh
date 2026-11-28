#!/bin/bash
# publish.sh FILM.mp4 OUTDIR : puts the public review page together in OUTDIR.
# The page's source is this folder. The film file is not in the repo (it is larger than the repo's file limit),
# so it is given here and placed in OUTDIR/media as pieces. OUTDIR is the folder that gets deployed.
set -e
FILM="$1"; OUT="$2"; HERE="$(cd "$(dirname "$0")" && pwd)"
[ -f "$FILM" ] && [ -n "$OUT" ] || { echo "usage: publish.sh FILM.mp4 OUTDIR"; exit 2; }
mkdir -p "$OUT/media"
cp "$HERE/index.html" "$OUT/index.html"
rm -rf "$OUT/assets"; cp -r "$HERE/assets" "$OUT/assets"
rm -rf "$OUT/media"; mkdir -p "$OUT/media"
# The film goes up in pieces of four seconds, cut at its own key frames with no new encoding (the picture and
# the sound are the same bytes as in the film file). The host does not answer requests for a part of a file,
# so one large file could not be searched through; pieces need no such requests.
ffmpeg -v error -y -i "$FILM" -map 0:v:0 -map 0:a:0 -c copy -f hls -hls_time 4 -hls_playlist_type vod \
  -hls_segment_type fmp4 -hls_flags independent_segments -hls_fmp4_init_filename film-init.mp4 \
  -hls_segment_filename "$OUT/media/film-%03d.m4s" "$OUT/media/film.m3u8"
python3 - "$OUT/media" <<'PY'
import os, re, sys
d = sys.argv[1]; pl = open(os.path.join(d, 'film.m3u8')).read()
parts = re.findall(r'^(film-\d+\.m4s)$', pl, re.M); secs = [float(x) for x in re.findall(r'#EXTINF:([0-9.]+)', pl)]
assert parts and len(parts) == len(secs) and all(os.path.getsize(os.path.join(d, x)) > 0 for x in parts)
assert os.path.getsize(os.path.join(d, 'film-init.mp4')) > 0 and '#EXT-X-ENDLIST' in pl
print('film pieces:', len(parts), '| length by the list: %.3f s' % sum(secs), '| largest piece: %.1f MB' % (max(os.path.getsize(os.path.join(d, x)) for x in parts) / 1e6))
PY
du -sm "$OUT" | cut -f1 | sed 's/$/ MB in all/'
