import * as THREE from "three";
import { mergeGeometries } from "/vendor/three-examples/utils/BufferGeometryUtils.js";
import {
  TRACK_LENGTH as L,
  trackAt,
  surfaceAt,
  TRACK_SAMPLES,
  ROAD_HALF,
  WALL_HALF,
  BOOST_PADS,
  SECTIONS,
  controlDistances,
} from "./track.js";
import { seeded } from "./logic.js";
import { proceduralKart } from "./models.js";
const rng = seeded(611),
  V = THREE.Vector3;
const standard = (c, extra = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...extra });
const basic = (c) => new THREE.MeshBasicMaterial({ color: c });
export function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function asphalt() {
  return canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = "#777d87";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 50000; i++) {
      const a = rng();
      c.fillStyle = a > 0.5 ? "#8a919c" : "#606873";
      c.globalAlpha = 0.15 + rng() * 0.3;
      c.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1);
    }
    c.globalAlpha = 1;
  });
}
function grass() {
  return canvasTexture(256, 256, (c, w, h) => {
    c.fillStyle = "#3c8b59";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 12000; i++) {
      c.fillStyle = ["#76ae57", "#388044", "#559342"][i % 3];
      c.fillRect(rng() * w, rng() * h, 1, 3);
    }
  });
}
export function signTexture(
  text,
  bg = "#1252a0",
  fg = "#fff",
  sub = "MUSHROOM CUP",
) {
  return canvasTexture(1024, 256, (c, w, h) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffffff16";
    for (let i = -h; i < w; i += 50) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i + 110, 0);
      c.lineTo(i + 110 - h, h);
      c.lineTo(i - h, h);
      c.fill();
    }
    c.fillStyle = fg;
    c.textAlign = "center";
    c.font = "italic 900 105px Arial";
    c.fillText(text, w / 2, 142, w - 50);
    c.font = "700 30px Arial";
    c.fillText(sub, w / 2, 205);
    c.fillRect(0, 0, w, 5);
    c.fillRect(0, h - 5, w, 5);
  });
}
function mesh(geo, mat, parent, pos = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  parent.add(m);
  return m;
}
function box(parent, size, pos, mat) {
  return mesh(new THREE.BoxGeometry(...size), mat, parent, pos);
}
function ribbon(start, end, left, right, mat, height = 0.03, step = 2) {
  const pos = [],
    uv = [],
    indices = [];
  let n = 0;
  for (let s = start; s < end + step; s += step) {
    const at = Math.min(s, end);
    for (const l of [left, right]) {
      const p = surfaceAt(at, l);
      pos.push(p.x, p.y + height, p.z);
      uv.push((l - left) / (right - left), at / 8);
    }
    if (n) {
      const i = n * 2;
      indices.push(i - 2, i - 1, i, i, i - 1, i + 1);
    }
    n++;
    if (at === end) break;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  return m;
}
export function buildWorld(scene) {
  const world = new THREE.Group();
  scene.add(world);
  const roadTex = asphalt();
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  const grassTex = grass();
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(80, 80);
  const lawn = mesh(
    new THREE.PlaneGeometry(760, 760),
    standard("#b2ca6e", { map: grassTex }),
    world,
    [0, -0.3, 0],
  );
  lawn.rotation.x = -Math.PI / 2;
  lawn.receiveShadow = true;
  const road = standard("#576379", {
    map: roadTex,
    roughness: 0.64,
    side: THREE.DoubleSide,
  });
  const blue = standard("#1687c0", { map: roadTex }),
    yellow = standard("#dfad20", { map: roadTex }),
    red = standard("#c55560", { map: roadTex });
  // Road is genuinely interrupted at the glider jump; the launch and landing
  // deck edges stay visible. Banked surfaces share the simulation's heights.
  world.add(ribbon(0, SECTIONS.glideStart, -ROAD_HALF, ROAD_HALF, road));
  world.add(ribbon(SECTIONS.glideEnd, L, -ROAD_HALF, ROAD_HALF, road));
  for (const [start, end] of [
    [controlDistances[4], controlDistances[8]],
    [controlDistances[24], controlDistances[26]],
  ]) {
    world.add(ribbon(start, end, -10, -3.4, red, 0.055));
    world.add(ribbon(start, end, -3.4, 3.4, yellow, 0.055));
    world.add(ribbon(start, end, 3.4, 10, blue, 0.055));
  }
  const railMat = standard("#2869b9", { metalness: 0.42, roughness: 0.35 }),
    white = standard("#e9e9e1"),
    curbRed = standard("#d92c46");
  const curbGeo = [[], []],
    railGeo = [],
    supportGeo = [];
  for (let s = 0; s < L; s += 3) {
    if (s > SECTIONS.glideStart && s < SECTIONS.glideEnd) continue;
    for (const side of [-1, 1]) {
      const p = surfaceAt(s, side * 10.6),
        geo = new THREE.BoxGeometry(1.15, 0.16, 3.15);
      geo.rotateZ(p.bank);
      geo.rotateY(-p.heading);
      geo.translate(p.x, p.y + 0.03, p.z);
      curbGeo[Math.floor(s / 3) % 2].push(geo);
      const q = surfaceAt(s, side * WALL_HALF),
        g = new THREE.BoxGeometry(0.45, 1.1, 3.2);
      g.rotateZ(p.bank);
      g.rotateY(-p.heading);
      g.translate(q.x, q.y + 0.6, q.z);
      railGeo.push(g);
      if (Math.floor(s / 3) % 8 === 0) {
        const post = new THREE.BoxGeometry(0.5, 2, 0.5);
        post.translate(q.x, q.y + 0.8, q.z);
        supportGeo.push(post);
      }
    }
  }
  for (const [i, geo] of curbGeo.entries())
    mesh(mergeGeometries(geo), i ? white : curbRed, world);
  mesh(mergeGeometries(railGeo), railMat, world);
  mesh(mergeGeometries(supportGeo), white, world);
  const neon = basic("#2ccfff");
  for (const side of [-1, 1])
    world.add(
      ribbon(
        SECTIONS.antiStart,
        SECTIONS.antiEnd,
        side * 14.2 - 0.12,
        side * 14.2 + 0.12,
        neon,
        1.18,
      ),
    );
  // Road paint: twin white edge lines, yellow dashed center on the straights.
  for (const [start, end] of [
    [0, SECTIONS.glideStart],
    [SECTIONS.glideEnd, L],
  ])
    for (const side of [-1, 1])
      world.add(
        ribbon(
          start,
          end,
          side * 9.5 - 0.08,
          side * 9.5 + 0.08,
          basic("#ecf2ed"),
          0.07,
        ),
      );
  for (let s = 25; s < controlDistances[3]; s += 12)
    world.add(ribbon(s, s + 4, -0.1, 0.1, basic("#d0d9e0"), 0.08));
  for (const pad of BOOST_PADS) {
    world.add(
      ribbon(
        pad.s - 3.5,
        pad.s + 3.5,
        pad.lateral - 2,
        pad.lateral + 2,
        basic("#ffb520"),
        0.12,
      ),
    );
    for (let j = 0; j < 3; j++)
      world.add(
        ribbon(
          pad.s - 2 + j * 1.7,
          pad.s - 1.6 + j * 1.7,
          pad.lateral - 1.8,
          pad.lateral + 1.8,
          basic("#fff1ac"),
          0.14,
        ),
      );
  }
  for (const [s, color] of [
    [SECTIONS.antiStart, "#40e3ff"],
    [SECTIONS.glideStart - 1, "#4399ff"],
  ]) {
    world.add(ribbon(s - 1.3, s + 0.05, -10, 10, basic(color), 0.14));
    for (let i = -9; i < 10; i += 1)
      world.add(ribbon(s - 1, s, -0.15 + i, 0.15 + i, basic("#f4ffff"), 0.16));
  }
  // Starting stripe and eight individual grid boxes.
  for (let i = 0; i < 20; i++)
    for (let j = 0; j < 3; j++)
      world.add(
        ribbon(
          j * 0.65,
          j * 0.65 + 0.65,
          i - 10,
          i - 9,
          basic((i + j) % 2 ? "#111e35" : "#f5f9ed"),
          0.1,
        ),
      );
  for (let r = 0; r < 4; r++)
    for (const lane of [-3, 3]) {
      const s = -8 - r * 6;
      for (const offset of [-1.4, 1.4])
        world.add(
          ribbon(
            L + s - 2,
            L + s + 2,
            lane + offset - 0.06,
            lane + offset + 0.06,
            basic("#e5dfca"),
            0.1,
          ),
        );
      world.add(
        ribbon(
          L + s - 2,
          L + s - 1.85,
          lane - 1.4,
          lane + 1.4,
          basic("#e5dfca"),
          0.1,
        ),
      );
    }
  // Elevated-road support piers; shadow depth beneath the hairpin matters.
  for (let s = SECTIONS.antiStart + 30; s < SECTIONS.antiEnd; s += 30) {
    const p = trackAt(s);
    if (p.y > 3) {
      box(world, [2.6, p.y, 2.6], [p.x, p.y / 2 - 1, p.z], standard("#c6d2cf"));
    }
  }
  const gate = new THREE.Group(),
    gp = trackAt(3);
  gate.position.set(gp.x, gp.y, gp.z);
  gate.rotation.y = -gp.heading;
  world.add(gate);
  for (const x of [-13, 13]) {
    box(gate, [1.4, 11, 1.4], [x, 5.5, 0], standard("#d6dfea"));
    box(gate, [2.2, 0.45, 2.2], [x, 1, 0], railMat);
  }
  box(gate, [28, 3.2, 1.1], [0, 10, 0], standard("#174576"));
  const banner = mesh(
    new THREE.PlaneGeometry(27, 3.1),
    new THREE.MeshBasicMaterial({
      map: signTexture("MARIOKART", "#0d4679", "#ffffff", "MARIO KART STADIUM"),
      side: THREE.DoubleSide,
    }),
    gate,
    [0, 10, 0.57],
  );
  // Countdown light pods beneath the bridge, separate from HUD lamps.
  const lights = [];
  for (let i = 0; i < 3; i++) {
    const housing = mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.4, 24),
      standard("#202735"),
      gate,
      [(i - 1) * 1.65, 7.4, 0],
    );
    housing.rotation.x = Math.PI / 2;
    const light = mesh(
      new THREE.CircleGeometry(0.48, 24),
      basic("#451f32"),
      gate,
      [(i - 1) * 1.65, 7.4, 0.24],
    );
    lights.push(light);
  }
  // Stadium bowl: layered tiers, thousands of colored seats/fans, canopy,
  // trusses and glowing fascia. Batched geometry/instances keep draw calls flat.
  const tiers = [],
    roof = [],
    pillars = [],
    crowdCount = 72 * 12 * 14,
    crowd = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.3, 5, 4),
      standard("#fff"),
      crowdCount,
    ),
    o = new THREE.Object3D();
  let ci = 0;
  const fanColors = [
    "#fbedda",
    "#65a7f4",
    "#ed506f",
    "#f2ca54",
    "#3dd3a1",
    "#eeedff",
  ];
  for (let j = 0; j < 72; j++) {
    const a = (j * Math.PI * 2) / 72,
      ca = Math.cos(a),
      sa = Math.sin(a);
    for (let row = 0; row < 12; row++) {
      const radius = 273 + row * 2.2,
        x = ca * radius,
        z = sa * (radius * 0.95),
        y = 3 + row * 1.25;
      const g = new THREE.BoxGeometry(25, 1.3, 2.6);
      g.rotateY(-a + Math.PI / 2);
      g.translate(x, y, z);
      tiers.push(g);
      for (let seat = 0; seat < 14; seat++) {
        const aa = a + (seat - 6.5) * 0.0059;
        o.position.set(
          Math.cos(aa) * radius,
          y + 0.95,
          Math.sin(aa) * (radius * 0.95),
        );
        o.scale.set(1, 0.9 + rng() * 0.7, 1);
        o.updateMatrix();
        crowd.setMatrixAt(ci, o.matrix);
        crowd.setColorAt(
          ci,
          new THREE.Color(fanColors[(rng() * fanColors.length) | 0]),
        );
        ci++;
      }
    }
    const fascia = box(
      world,
      [24, 1.6, 1],
      [ca * 300, 20, sa * 285],
      j % 3 === 0 ? standard("#3069b5") : standard("#e3d4a1"),
    );
    fascia.rotation.y = -a + Math.PI / 2;
    const r = new THREE.BoxGeometry(26, 0.65, 28);
    r.rotateY(-a + Math.PI / 2);
    r.translate(ca * 293, 29, sa * 278);
    roof.push(r);
    if (j % 3 === 0) {
      const pole = new THREE.BoxGeometry(1.3, 28, 1.3);
      pole.translate(ca * 303, 14, sa * 288);
      pillars.push(pole);
    }
    if (j % 2 === 0) {
      const strip = box(
        world,
        [18, 0.32, 0.5],
        [ca * 280, 28, sa * 266],
        basic("#d9f5ff"),
      );
      strip.rotation.y = -a + Math.PI / 2;
    }
  }
  mesh(mergeGeometries(tiers), standard("#354d83"), world);
  mesh(mergeGeometries(roof), standard("#7286a1"), world);
  mesh(mergeGeometries(pillars), standard("#7f95ad"), world);
  world.add(crowd);
  // Floodlight pylons and their visible luminaires. Illumination is consolidated
  // into the scene's key/fill lights rather than hundreds of GPU point lights.
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12,
      x = Math.cos(a) * 255,
      z = Math.sin(a) * 242;
    box(world, [0.7, 46, 0.7], [x, 23, z], standard("#7e93af"));
    const lamp = new THREE.Group();
    lamp.position.set(x, 45, z);
    lamp.lookAt(0, 0, 0);
    world.add(lamp);
    box(lamp, [12, 3, 0.7], [0, 0, 0], standard("#263049"));
    for (let k = 0; k < 12; k++)
      box(
        lamp,
        [1.5, 0.75, 0.1],
        [((k % 6) - 2.5) * 1.85, Math.floor(k / 6) * 1.05 - 0.5, 0.4],
        basic("#f1fdff"),
      );
  }
  // Animated-looking city facades beyond the stadium, baked deterministic windows.
  const windowTex = canvasTexture(128, 256, (c, w, h) => {
    c.fillStyle = "#14243e";
    c.fillRect(0, 0, w, h);
    for (let y = 5; y < h; y += 9)
      for (let x = 4; x < w; x += 8) {
        c.fillStyle = rng() > 0.38 ? "#e2cc91" : "#273953";
        c.fillRect(x, y, 3, 3);
      }
  });
  const buildingMat = standard("#aab3cb", {
    map: windowTex,
    emissive: "#667288",
    emissiveMap: windowTex,
    emissiveIntensity: 0.65,
  });
  for (let i = 0; i < 70; i++) {
    const a = (i * Math.PI * 2) / 70,
      radius = 350 + rng() * 80,
      h = 35 + rng() * 105,
      w = 12 + rng() * 19;
    const b = box(
      world,
      [w, h, w],
      [Math.cos(a) * radius, h / 2 - 4, Math.sin(a) * radius],
      buildingMat,
    );
    b.rotation.y = a;
  }
  // Pit garages down the starting straight, with repeated branded bays.
  const brands = [
    ["MARIO MOTORS", "#c92e3e"],
    ["LUIGI GUSTERS", "#2c9e4c"],
    ["TOAD POWER", "#1a80c9"],
    ["YOSHI RUNNERS", "#4baf57"],
    ["BOWSER OIL", "#332935"],
    ["GOLDEN WHEEL", "#ba8725"],
  ];
  for (let i = 0; i < 10; i++) {
    const p = surfaceAt(12 + i * 10, -24),
      pit = new THREE.Group();
    pit.position.set(p.x, 0, p.z);
    pit.rotation.y = -p.heading;
    world.add(pit);
    box(pit, [13, 4.4, 8], [0, 2.2, 0], standard("#ced5dc"));
    box(pit, [13, 1, 9], [0, 4.8, 0], standard("#283a58"));
    const brand = brands[i % brands.length];
    const screen = mesh(
      new THREE.PlaneGeometry(7, 2),
      new THREE.MeshBasicMaterial({
        map: signTexture(brand[0], brand[1], "#fff", "RACING TEAM"),
        side: THREE.DoubleSide,
      }),
      pit,
      [6.6, 3, 0],
    );
    screen.rotation.y = Math.PI / 2;
  }
  // Sponsor boards on both sides, with local canvas lettering rather than URLs.
  const signMats = brands.map(
    ([name, c]) =>
      new THREE.MeshBasicMaterial({
        map: signTexture(name, c),
        side: THREE.DoubleSide,
      }),
  );
  for (let s = 45; s < L; s += 30) {
    if (s > SECTIONS.glideStart && s < SECTIONS.glideEnd) continue;
    const side = Math.floor(s / 30) % 2 ? 1 : -1,
      p = surfaceAt(s, side * 16);
    const board = mesh(
      new THREE.PlaneGeometry(13, 2.3),
      signMats[Math.floor(s / 30) % signMats.length],
      world,
      [p.x, p.y + 2.3, p.z],
    );
    board.rotation.y = -p.heading - (side * Math.PI) / 2;
  }
  // Huge television boards frame the elevated climb.
  for (const [x, z, rotation] of [
    [-55, 10, 0],
    [30, -138, 0.4],
  ]) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotation;
    world.add(g);
    box(g, [2, 24, 2], [0, 12, 0], standard("#7d8da6"));
    box(g, [44, 24, 2], [0, 29, 0], standard("#d33043"));
    mesh(
      new THREE.PlaneGeometry(41, 21),
      new THREE.MeshBasicMaterial({
        map: signTexture("MKTV", "#126dbe", "#fff", "MARIO KART TELEVISION"),
        side: THREE.DoubleSide,
      }),
      g,
      [0, 29, 1.1],
    );
  }
  // Hero monument in the infield and small mushroom-cup tents/pipes.
  const monument = new THREE.Group();
  monument.position.set(-48, 0, -87);
  world.add(monument);
  mesh(
    new THREE.CylinderGeometry(12, 14, 10, 48),
    standard("#c7d5e7"),
    monument,
    [0, 5, 0],
  );
  mesh(
    new THREE.CylinderGeometry(12.3, 12.3, 1.8, 48),
    basic("#5744bd"),
    monument,
    [0, 8.5, 0],
  );
  const statue = proceduralKart("mario");
  statue.scale.setScalar(6.5);
  statue.position.y = 10;
  statue.rotation.y = -1.1;
  monument.add(statue);
  for (let i = 0; i < 18; i++) {
    const p = surfaceAt(controlDistances[12] + i * 15, 24 + (i % 3) * 7);
    if (i % 3 === 0) {
      mesh(
        new THREE.CylinderGeometry(2, 2, 4, 20),
        standard("#268a59"),
        world,
        [p.x, 2, p.z],
      );
      mesh(
        new THREE.CylinderGeometry(2.35, 2.35, 0.8, 20),
        standard("#38b76a"),
        world,
        [p.x, 4, p.z],
      );
    } else {
      mesh(
        new THREE.ConeGeometry(4, 3, 4),
        standard(i % 2 ? "#e9545b" : "#4a8dda"),
        world,
        [p.x, 5, p.z],
      );
      box(world, [5, 3, 5], [p.x, 2, p.z], white);
    }
  }
  // Starry sky and fireworks use one points draw each.
  const stars = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const a = rng() * Math.PI * 2,
      r = 450;
    stars.set([Math.cos(a) * r, 70 + rng() * 230, Math.sin(a) * r], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(stars, 3));
  world.add(
    new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        color: "#b4d8ff",
        size: 0.6,
        sizeAttenuation: true,
      }),
    ),
  );
  const fireworks = [];
  for (let k = 0; k < 4; k++) {
    const positions = new Float32Array(100 * 3),
      colors = new Float32Array(100 * 3),
      origin = new V(
        Math.cos(k * 1.5) * 310,
        95 + (k % 2) * 40,
        Math.sin(k * 1.5) * 310,
      );
    const color = new THREE.Color(
      ["#ffd27a", "#7bdcff", "#e28cff", "#ff899c"][k],
    );
    for (let i = 0; i < 100; i++) {
      const a = i * 2.399,
        el = Math.acos(1 - (2 * (i + 0.5)) / 100);
      positions.set(
        [Math.sin(el) * Math.cos(a), Math.cos(el), Math.sin(el) * Math.sin(a)],
        i * 3,
      );
      color.toArray(colors, i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 1.1,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    points.position.copy(origin);
    world.add(points);
    fireworks.push(points);
  }
  return {
    world,
    lights,
    fireworks,
    update(time, count) {
      lights.forEach((l, i) =>
        l.material.color.set(
          count === 0 ? "#58ff87" : i < 4 - count ? "#ff403f" : "#421c29",
        ),
      );
      fireworks.forEach((f, i) => {
        const t = ((time + i * 1.3) % 5) / 5;
        f.scale.setScalar(5 + t * 24);
        f.material.opacity = Math.max(0, 1 - t) * 0.8;
      });
    },
  };
}
