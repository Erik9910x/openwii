/** Original stadium reconstruction, traced by eye from the research map.
 * Pure geometry shared by simulation, drawing, minimap and tests. Metres. */
export const ROAD_HALF = 10;
export const WALL_HALF = 14.5;
export const CONTROL_POINTS = [
  [365, 445, 0],
  [445, 432, 0],
  [499, 422, 0],
  [538, 444, 0],
  [558, 502, 0],
  [578, 548, 0],
  [555, 569, 0],
  [526, 546, 0],
  [510, 483, 0],
  [491, 404, 3],
  [472, 328, 9],
  [451, 301, 13],
  [338, 263, 16],
  [220, 222, 21],
  [194, 194, 28],
  [195, 138, 38],
  [194, 92, 47],
  [178, 67, 49],
  [145, 70, 47],
  [124, 91, 42],
  [127, 142, 34],
  [133, 215, 27],
  [151, 286, 0],
  [175, 376, 0],
  [190, 440, 0],
  [215, 465, 0],
  [282, 460, 0],
].map(([x, z, y]) => ({ x: (x - 360) * 0.85, z: (z - 330) * 0.85, y }));
const N = CONTROL_POINTS.length,
  SUB = 32;
export const wrap = (s, L) => ((s % L) + L) % L;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const angle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function cat(a, b, c, d, t) {
  return (
    0.5 *
    (2 * b +
      (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t * t +
      (-a + 3 * b - 3 * c + d) * t * t * t)
  );
}
const raw = [];
export const controlDistances = [];
let length = 0;
for (let i = 0; i < N; i++) {
  controlDistances.push(length);
  for (let j = 0; j < SUB; j++) {
    const p = {};
    for (const k of ["x", "y", "z"])
      p[k] = cat(
        CONTROL_POINTS[(i + N - 1) % N][k],
        CONTROL_POINTS[i][k],
        CONTROL_POINTS[(i + 1) % N][k],
        CONTROL_POINTS[(i + 2) % N][k],
        j / SUB,
      );
    if (raw.length)
      length += Math.hypot(p.x - raw.at(-1).x, p.z - raw.at(-1).z);
    p.s = length;
    p.control = i + j / SUB;
    raw.push(p);
  }
}
length += Math.hypot(raw[0].x - raw.at(-1).x, raw[0].z - raw.at(-1).z);
export const TRACK_LENGTH = length;
// Exact sampled control indices (the first pass records before the preceding edge).
for (let i = 0; i < N; i++) controlDistances[i] = raw[i * SUB].s;
export const SECTIONS = {
  antiStart: controlDistances[9],
  antiEnd: controlDistances[21],
  glideStart: controlDistances[21],
  glideEnd: controlDistances[22],
};
export const TRACK_SAMPLES = raw;
function indexAt(s) {
  let lo = 0,
    hi = raw.length - 1;
  while (lo < hi) {
    const m = Math.ceil((lo + hi) / 2);
    if (raw[m].s <= s) lo = m;
    else hi = m - 1;
  }
  return lo;
}
export function trackAt(distance) {
  const s = wrap(distance, length),
    i = indexAt(s),
    a = raw[i],
    b = raw[(i + 1) % raw.length];
  const span = (i === raw.length - 1 ? length : b.s) - a.s,
    t = (s - a.s) / span;
  const tx = (b.x - a.x) / span,
    tz = (b.z - a.z) / span;
  const control = i === raw.length - 1 ? N : b.control;
  const c = a.control + t * (control - a.control);
  const anti = s >= SECTIONS.antiStart && s < SECTIONS.antiEnd;
  const bank = anti
    ? Math.sin(
        Math.PI *
          clamp(
            (s - SECTIONS.antiStart) / (SECTIONS.antiEnd - SECTIONS.antiStart),
            0,
            1,
          ),
      ) * 0.98
    : 0;
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    y: a.y + (b.y - a.y) * t,
    tx,
    tz,
    rx: -tz,
    rz: tx,
    heading: Math.atan2(tx, -tz),
    bank,
    anti,
    glide: s >= SECTIONS.glideStart && s < SECTIONS.glideEnd,
    s,
    control: c,
  };
}
export function surfaceAt(s, lateral = 0) {
  const p = trackAt(s);
  return {
    ...p,
    x: p.x + p.rx * lateral,
    z: p.z + p.rz * lateral,
    y: p.y + Math.tan(p.bank) * lateral,
  };
}
/** Local projection avoids jumping between crossing roads. Global only at spawn. */
export function project(x, z, previousS = null) {
  let best = null;
  const center = previousS === null ? 0 : indexAt(wrap(previousS, length));
  const count = previousS === null ? raw.length : 85;
  for (let j = 0; j < count; j++) {
    const i = previousS === null ? j : wrap(center + j - 42, raw.length),
      a = raw[i],
      b = raw[(i + 1) % raw.length];
    const dx = b.x - a.x,
      dz = b.z - a.z,
      l2 = dx * dx + dz * dz;
    const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / l2, 0, 1),
      px = a.x + t * dx,
      pz = a.z + t * dz,
      d2 = (x - px) ** 2 + (z - pz) ** 2;
    if (!best || d2 < best.d2) {
      const len = Math.sqrt(l2);
      best = {
        s: wrap(a.s + t * len, length),
        lateral: ((x - px) * -dz + (z - pz) * dx) / len,
        d2,
      };
    }
  }
  return best;
}
export const BOOST_PADS = [5.05, 5.8, 6.55, 24.2, 25, 25.8].map((c) => ({
  s: raw[Math.floor(c * SUB)].s,
  lateral: c < 10 ? -7 : 7,
  width: 4,
  length: 7,
}));
export const ITEM_ROWS = [3.5, 11.7, 20.4].flatMap((c) =>
  [-6, 0, 6].map((lateral) => ({ s: raw[Math.floor(c * SUB)].s, lateral })),
);
export const COIN_SPOTS = [
  1.3, 4.8, 6, 8.3, 10.9, 13.4, 15.8, 18.4, 20.6, 23.4, 25.5,
].flatMap((c, i) =>
  [-3, 0, 3].map((d) => ({
    s: raw[Math.floor(c * SUB)].s + d,
    lateral: i % 2 ? 6 : -3,
  })),
);
