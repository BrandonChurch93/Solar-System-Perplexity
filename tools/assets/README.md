# Hero fit and unproject

Python 3 with numpy, opencv-python-headless, Pillow and scipy. Run from the repo root.

    python3 tools/assets/fit.py --stop all            # writes assets-src/<stop>/fit.json and out/work/assets/<stop>/fit-overlay.jpg
    python3 tools/assets/limbcheck.py --stop uranus   # 12 limb crops with the fitted silhouette
    python3 tools/assets/unproject.py --stop all      # width defaults to assetSets.web.wrapMapWidth
    python3 tools/assets/unproject.py --stop mars --width 8192
    python3 tools/assets/verify.py --stop all         # hero, re-render, abs difference
    python3 tools/assets/contact.py                   # out/work/assets/verify-contact.jpg

Outputs under out/work/assets/<stop>/: map-W.png (RGBA, alpha is the view cosine feathered before the limb),
map-filled-W.png (unseen part filled by the mirrored view and push-pull, or zonal means for banded planets),
mask-W.png (moon, ring, ring shadow and moon shadow cover in front of the globe).

Hand hints live in hints.json. Map u = lon/360 + 0.5, v = lat/180 + 0.5, north at the top.
On a three.js SphereGeometry use globe.meshQuaternionForThreeSphereGeometry from fit.json; the texture is not mirrored.
