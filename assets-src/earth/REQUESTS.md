# Requests to the Builder from the earth stop

## 1. Cover cut above the sea limb in the terrain view (`coverSea`)

- Status: served. The key is on main since engine batch 8 (main 48a2bfc), the same change as `engine.patch`. Earth's plan carries it since 64659d1 (08:36 UTC). Nothing is open.

- Asked for in the Builder's mail of 07:12 UTC: the grey cloud above the horizon at 1886 to 1888 and 2125 to 2128.
- Why the stop's own controls cannot do it. On the terrain side the engine cover is drawn over the whole frame. Above the horizon its colour is `mix(low, color, band)` times a ramp to `coverTop`, with the band and the ramp both 0.22 tan units wide (`soft: 0.22` in `horizon()`, `smoothstep(0.0, 0.22, s)` in `src/terrain/cover.ts`). So for about 290 px above the horizon line at 1080 the cover stays a lit grey whatever `coverTerrain` and `coverTop` are (tried: `coverTop` terrain side 0.3, 0.12, 0.04, 0.012; `coverTerrain` [0.5, 0.68, 1] and [0.22, 0.34, 0.6]). In the rise the camera climbs 0.56 heights before the cover centre, the true dip grows from 14.0 to 17.6 degrees and the fixed horizon line of the cover then sits 60 to 150 px above the true limb, so the white `coverLowTerrain` is drawn over black space. In the orbit view the same problem is solved by `coverShell`, which cuts the cover's alpha outside the globe. The terrain view has no such cut.
- The change, two files, patch in `assets-src/earth/engine.patch` (made with `git diff origin/main -- src/director/moves.ts src/director/film.ts`):
  - `src/director/moves.ts`, `MoveParams`: new optional key `coverSea?: { centre: [number, number, number]; radius: number; edge: [number, number] }`. `centre` is the centre of the sea sphere in the terrain view's local frame (the frame of `terrain()`, camera heights), `radius` its radius in the same unit, `edge` the inner and outer radius of the cut in sphere radii, as in `coverShell`.
  - `src/director/film.ts`, in the cover block right after the `coverShell` lines (the `if (shell && view === 'orbit')` block):

```ts
          const sea = p.p.coverSea
          if (sea && view === 'terrain') {
            const c = new THREE.Vector3().fromArray(sea.centre).sub(local.position).divideScalar(sea.radius).applyQuaternion(local.quaternion.clone().invert())
            cover.shell = { centre: [c.x, c.y, c.z], inner: sea.edge[0], outer: sea.edge[1] }
          }
```

- Default. The key is undefined in every plan on main, so `cover.shell` stays unset in every terrain view and the shader's `uShell` keeps its open value: no stop's bytes change. No shader is touched.
- What it does. On the terrain side the cover's alpha is cut above the true limb of the sea sphere, as `coverShell` does on the orbit side, also while the camera climbs or descends. The sky above the limb is then the terrain sky under the engine's own cover exposure, (1 - amount) squared: black at the centre frame, fading in as the cover thins. The blue limb line of the relief stays in view above the cloud.
- Earth's plan will set `coverSea: { centre: [1.031837, -29.481955, -15.916028], radius: 32.5197, edge: [1, 1.003] }` (the fitted nadir of `src/stops/earth/relief.json` times radius + 1). Until the key is on main the plan does not carry it and frames 1885 to 1889 and 2125 to 2129 keep the grey cloud above the horizon.
- Checked in the working tree only, then reverted (nothing shared is committed): draft stills 1885, 1886, 1888, 1890 and 2124, 2125, 2127, 2129 with the key set show a white cloud deck under the limb and black space above it; the same frames on the branch show grey cloud across the sky. Both sets are among the looks of 07:55 UTC on `agent/earth-looks` ("with the requested coverSea cut" and "as on the branch"). Mars has no `coverSea`, so its frames cannot change; I did not render Mars 2325 and 2580 for that reason.
