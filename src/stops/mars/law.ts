// The law by which the approved picture lies on the one ground of the place (the globe's cap): how much of the picture a ground point
// shows, by place and eye. It reads no time and no height of the lens: only the ground point P, the present eye E and the eye at which
// the surface view takes over (uLawEye), all three in the relief's own frame (the picture's eye at 0, units of its distance files).
//
// The counts, the share is their product:
// 1. The texel. Two readings of the longer axis of one texel's footprint on the present screen, the larger counts. (a) Level ground:
//    one texel of the picture at P shows a strip |P| / f wide and |P| / (f sin g) long, g the angle of the picture's ray to the
//    level. (b) The relief's own surface at the fragment: the screen derivatives of the place in the picture, in the picture's
//    pixels, are the 2 by 2 matrix of picture pixels over buffer pixels; one over its smaller singular value is the longer axis
//    (MAIL 879 of /root: a texel drawn out along one axis, a wall seen along itself, has no share; the area or the mean would
//    pass it). Before the cap commit the count read (a) alone, a model; it now reads both. In pixels of the 1080 master
//    (uLawFrame): full at or under uLawTexel.x, none at uLawTexel.y. The surface view shows the picture whole at the eye where
//    it takes over, also where a texel is longer than the limit there (far ground drawn out toward the limb); so the length is
//    counted against the limit or against the length at that eye, whichever is longer, and the count is whole at that eye for
//    every point, as the air count is.
// 2. The air. The picture's colour carries the low air along its own ray; a ray that meets the level k times as steeply crosses 1 / k of
//    it. k is counted against the ray of the eye at which the surface view takes over, so it is 1 there for every point: full at or
//    under uLawAir.x, none at uLawAir.y.
// 3. The field (uLawOver; close.json law.edge, pixels of the picture at its left, right and lower side, 0 for a side that
//    does not end): the picture ends at its own sides, so the margins beyond them, which no eye of the picture saw, are not laid on
//    the globe's ground. A share by the place in the picture, none at the picture's own side and beyond it, whole so many pixels
//    inside it. By the sight, as count 4: whole at the eye at which the surface view takes over, where the margins fill
//    its frame, and as written from twice that angle off the picture's ray on (MAIL 771, MAIL 913 item 3: the picture has no
//    border of its own on the ground; it goes over into the ground beside it over the breadth of law.edge).
// 4. What the picture's eye saw (uLawSeen, uLawSight; close.json law.seen, the file of assets-src/mars/place/seenby.py): where two
//    layers stand at one place of the picture, the ground behind the front one is drawn out ground for an eye beside the picture's
//    eye and was never seen. A point farther from the picture's eye than the front there (by the spare) has no share; uLawSight.z
//    is the breadth over which that goes, a share of the distance. uLawSight.x under 0.5: the count is off. The surface view
//    itself shows a band of that ground, as wide as its eye stands beside the picture's eye; so the count is whole for a sight
//    that stands no farther off the picture's ray than the sight of that eye, and as above from twice that angle on (the
//    limits of the air count): the two sides agree at T, measured by `npm run handover -- --stop mars --only sides`.
// 5. The gap (uLawGap; close.json law.gap, the lower half of the same file). The cap under the picture is the one ground; the picture
//    may lie on it only where its own relief and the cap are one surface for the present eye. e is how far the cap stands from the
//    picture's ground along the picture's own ray, as a share of the distance; the two points stand |e| |P| sin(t) F / |P - E|
//    pixels of the master apart on the present screen, t the angle between the picture's ray and the present sight, F the lens.
//    Full at or under uLawGap.z (half a pixel), none from uLawGap.w (one pixel) on: no pixel shows two grounds, and the picture's
//    border runs where the two surfaces part, on the ground's own lines. For the picture's own eye t is 0 and the count is 0.
//    Off as the stop stands (close.json law.gap.on false, the file then holds no lower half): measured at 2456 to 2476 the count
//    cuts ribbons into the picture along every outline of its layers, where a ground of one height a place cannot follow a wall
//    seen from the side, and shows the cap through them (PLACE-NOTES.md, 24 November 03:40). The measure stays: gap.py.
// The tone (lawTone): the layers' colour times uLawTone, which the set gives as the factor the globe's own ground round the picture
// is drawn with at the present eye (set.ts, ownGain), so the picture and the ground it lies on are one tone on the way down.
// In the surface view the set turns the law off (uLawAir.z under 0.5): the share is exactly 1 and the tone exactly 1.
// The sine of a ray to the level is held at or above uLawTexel.w, the flattest ground the relief holds (1 / its largest distance).
// The numbers stand in close.json (law); the text holds to the contract of Relief.presenceLaw (src/terrain/relief.ts).
export const closeLaw = `
uniform vec4 uLawTexel;
uniform vec4 uLawAir;
uniform vec3 uLawEye;
uniform vec4 uLawSide;
uniform vec4 uLawOver;
uniform vec3 uLawTone;
uniform vec4 uLawSight;
uniform vec4 uLawGap;
uniform vec2 uLawPicture;
uniform sampler2D uLawSeen;
float lawHalves() {
  return uLawGap.x > 0.5 ? 2.0 : 1.0;
}
float lawHalfRow() {
  return 0.5 * lawHalves() / float(textureSize(uLawSeen, 0).y);
}
float lawSine(vec3 ray) {
  return max(abs(dot(normalize(ray), uUpL)), uLawTexel.w);
}
vec3 lawLevel(vec3 ray) {
  vec3 flat_ = ray - dot(ray, uUpL) * uUpL;
  return flat_ / max(length(flat_), 1e-6);
}
float lawShare(vec3 P, vec3 E, vec2 image) {
  if (uLawAir.z < 0.5) return 1.0;
  float sinPicture = lawSine(P);
  float sinNow = lawSine(P - E);
  float sinTaken = lawSine(P - uLawEye);
  vec3 a = lawLevel(normalize(P));
  vec3 b = lawLevel(normalize(P - E));
  float across = length(P) / uLawTexel.z * uLawFocal / length(P - E);
  float along = across / sinPicture * length(vec2(sinNow * dot(a, b), length(cross(a, b))));
  vec2 tx = dFdx(image * uLawPicture);
  vec2 ty = dFdy(image * uLawPicture);
  float sum = dot(tx, tx) + dot(ty, ty);
  float det = tx.x * ty.y - tx.y * ty.x;
  float least = sqrt(max(0.5 * (sum - sqrt(max(sum * sum - 4.0 * det * det, 0.0))), 1e-12));
  float longest = 1.0 / (least * uLawFrame);
  // beyond the picture's own sides the ground is drawn out ground with no texels of its own: only the level reading counts there
  if (image.x < 0.0 || image.x > 1.0 || image.y < 0.0 || image.y > 1.0) longest = 0.0;
  // the same lengths for the eye at which the surface view takes over (uLawEye). The level reading is the same formula at that
  // eye; the surface's own reading goes over to it by the tilt of the surface (its normal from the screen derivatives of P): a
  // texel on a surface seen at the cosine c from an eye at the distance d is as long as c / d, never shorter than across.
  vec3 F = P - uLawEye;
  vec3 bT = lawLevel(normalize(F));
  float acrossT = length(P) / uLawTexel.z * uLawFocal / length(F);
  float alongT = acrossT / sinPicture * length(vec2(sinTaken * dot(a, bT), length(cross(a, bT))));
  vec3 n = normalize(cross(dFdx(P), dFdy(P)));
  float tiltPicture = max(abs(dot(n, normalize(P))), 1e-3);
  float footNow = max(1.0, abs(dot(n, normalize(P - E))) / tiltPicture) / length(P - E);
  float footTaken = max(1.0, abs(dot(n, normalize(F))) / tiltPicture) / length(F);
  float now = max(max(across, along), longest);
  float taken = max(max(acrossT, alongT), longest * footTaken / footNow);
  // the count: the present length, against the limit or against the length the surface view itself shows, whichever is longer
  float texel = 1.0 - smoothstep(uLawTexel.x, uLawTexel.y, now * min(1.0, uLawTexel.x / taken));
  float air = 1.0 - smoothstep(uLawAir.x, uLawAir.y, sinNow / sinTaken);
  float field = 1.0;
  if (uLawOver.x > 0.0) field *= smoothstep(0.0, 1.0, image.x * uLawOver.x);
  if (uLawOver.y > 0.0) field *= smoothstep(0.0, 1.0, (1.0 - image.x) * uLawOver.y);
  if (uLawOver.z > 0.0) field *= smoothstep(0.0, 1.0, (1.0 - image.y) * uLawOver.z);
  // the sides end by the sight: whole for a sight that stands no farther off the picture's own ray than the sight of the eye at
  // which the surface view takes over (so the two sides agree there and the margins fill its frame), ending from twice that on
  float past = length(cross(normalize(P), normalize(P - E))) / max(length(cross(normalize(P), normalize(P - uLawEye))), 1e-6);
  float off = smoothstep(uLawAir.x, uLawAir.y, past);
  field = 1.0 - (1.0 - field) * off;
  // the file holds the field once (what the picture's eye saw) or, while the gap counts, twice, one half over the other
  vec2 at = vec2((image.x - uLawSide.x) / (uLawSide.y - uLawSide.x), (image.y - uLawSide.w) / (uLawSide.z - uLawSide.w));
  bool inside = at.x > 0.0 && at.x < 1.0 && at.y > 0.0 && at.y < 1.0;
  float row = clamp(at.y, lawHalfRow(), 1.0 - lawHalfRow());
  float seen = 1.0;
  if (uLawSight.x > 0.5) {
    float front = inside ? textureLod(uLawSeen, vec2(at.x, 1.0 - row / lawHalves()), 0.0).r : 0.0;
    seen = 1.0 - smoothstep(1.0, 1.0 + uLawSight.z, length(P) * front * uLawSight.y);
    // the surface view shows that ground as far as its own eye looks past the front: by the angle between the picture's ray and
    // the sight, whole up to the angle of the eye at which the surface view takes over, as the count was before from twice it on
    seen = 1.0 - (1.0 - seen) * off;
  }
  float gap = 1.0;
  if (uLawGap.x > 0.5) {
    float v = inside ? (textureLod(uLawSeen, vec2(at.x, 0.5 - 0.5 * row), 0.0).r * 255.0 - 128.0) / 127.0 : 0.0;
    float apart = v * v * uLawGap.y * length(P) * length(cross(normalize(P), normalize(P - E))) * uLawFocal / length(P - E);
    gap = 1.0 - smoothstep(uLawGap.z, uLawGap.w, apart);
  }
  return texel * air * field * seen * gap;
}
vec3 lawTone(vec3 P, vec3 E, vec2 image) {
  if (uLawAir.z < 0.5) return vec3(1.0);
  return uLawTone;
}
`
