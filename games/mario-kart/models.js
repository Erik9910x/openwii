import * as THREE from "three";
import { GLTFLoader } from "/vendor/three-examples/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "/vendor/three-examples/geometries/RoundedBoxGeometry.js";
import { modelSpec } from "./model-spec.js";
const materials = new Map();
function mat(color) {
  if (!materials.has(color))
    materials.set(
      color,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.43,
        metalness: 0.08,
      }),
    );
  return materials.get(color);
}
export function proceduralKart(id) {
  const group = new THREE.Group();
  for (const p of modelSpec(id).parts) {
    let obj;
    if (p.shape === "wheel") {
      obj = new THREE.Group();
      for (const [r, d, c] of [
        [p.s[0], p.s[1], p.color],
        [p.s[0] * 0.62, p.s[1] + 0.016, "#dde7f3"],
        [p.s[0] * 0.27, p.s[1] + 0.03, "#568ccb"],
      ]) {
        const m = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, d, 24),
          mat(c),
        );
        m.rotation.z = Math.PI / 2;
        obj.add(m);
      }
    } else if (p.shape === "text") {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const ctx = c.getContext("2d");
      ctx.font = "900 96px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 64, 70);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      obj = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1.5),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          side: THREE.DoubleSide,
        }),
      );
      obj.scale.set(...p.s);
    } else {
      const geo =
        p.shape === "sphere"
          ? new THREE.SphereGeometry(1, 20, 14)
          : p.shape === "box"
            ? new RoundedBoxGeometry(1, 1, 1, 3, 0.15)
            : p.shape === "torus"
              ? new THREE.TorusGeometry(1, 0.105, 8, 28)
              : p.shape === "cone"
                ? new THREE.ConeGeometry(1, 1, 24)
                : new THREE.CylinderGeometry(1, 1, 1, 24);
      obj = new THREE.Mesh(geo, mat(p.color));
      obj.scale.set(...p.s);
    }
    obj.name = p.name;
    obj.position.set(...p.p);
    obj.rotation.set(...p.rotation);
    group.add(obj);
  }
  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}
export function disposeModel(root) {
  const geometries = new Set(),
    ownedMaterials = new Set();
  const shared = new Set(materials.values());
  root.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (m && !shared.has(m)) ownedMaterials.add(m);
    }
  });
  geometries.forEach((g) => g.dispose());
  ownedMaterials.forEach((m) => {
    m.map?.dispose();
    m.dispose();
  });
}
export function rigWheels(model) {
  return [0, 1, 2, 3].map((i) => {
    const wheel = model.getObjectByName("wheel-" + i);
    if (!wheel || wheel.userData.rolling) return wheel;
    const rolling = new THREE.Group();
    for (const child of [...wheel.children]) rolling.add(child);
    wheel.add(rolling);
    wheel.userData.rolling = rolling;
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.06, 8, 24),
      new THREE.MeshBasicMaterial({ color: "#38deff" }),
    );
    glow.rotation.y = Math.PI / 2;
    glow.position.x = i % 2 ? 0.2 : -0.2;
    glow.visible = false;
    wheel.add(glow);
    wheel.userData.glow = glow;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.08, 0.08),
      mat("#e6eaf6"),
    );
    stripe.position.set(i % 2 ? 0.2 : -0.2, 0.26, 0);
    rolling.add(stripe);
    return wheel;
  });
}
export async function loadKartPack(karts, onProgress = () => {}) {
  try {
    const res = await fetch("/assets/mario-kart/manifest.json");
    if (!res.ok) return { loaded: 0, fallback: 8 };
    const manifest = await res.json(),
      loader = new GLTFLoader();
    let loaded = 0;
    await Promise.all(
      karts.map(async (k) => {
        const entry = manifest.characters?.find((c) => c.id === k.id);
        if (!entry) return;
        try {
          const gltf = await loader.loadAsync(
            "/assets/mario-kart/" + entry.file,
          );
          if (k.disposed) {
            disposeModel(gltf.scene);
            return;
          }
          gltf.scene.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          k.root.remove(k.model);
          disposeModel(k.model);
          k.model = gltf.scene;
          k.root.add(k.model);
          k.wheels = rigWheels(k.model);
          k.source = "glb";
          loaded++;
          onProgress(loaded);
        } catch {
          /* a missing individual character retains its procedural sculpture */
        }
      }),
    );
    return { loaded, fallback: karts.length - loaded };
  } catch {
    return { loaded: 0, fallback: karts.length };
  }
}
export function makeGlider(color) {
  const group = new THREE.Group();
  // Six stitched panels follow a shallow aerofoil, with a contrasting pair.
  for (let i = 0; i < 6; i++) {
    const left = -3.2 + (i * 6.4) / 6,
      right = left + 6.4 / 6;
    const edge = (x) => ({
      y: 3.55 - Math.abs(x) * 0.18,
      front: -1.15 + Math.abs(x) * 0.5,
      back: 1.1 - Math.abs(x) * 0.18,
    });
    const a = edge(left),
      b = edge(right),
      geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          left,
          a.y,
          a.front,
          right,
          b.y,
          b.front,
          left,
          a.y - 0.13,
          a.back,
          right,
          b.y,
          b.front,
          right,
          b.y - 0.13,
          b.back,
          left,
          a.y - 0.13,
          a.back,
        ],
        3,
      ),
    );
    geo.computeVertexNormals();
    group.add(
      new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: i === 1 || i === 4 ? "#fff6dd" : color,
          side: THREE.DoubleSide,
          roughness: 0.5,
        }),
      ),
    );
    const seam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(left, a.y + 0.015, a.front),
        new THREE.Vector3(left, a.y - 0.12, a.back),
      ]),
      new THREE.LineBasicMaterial({ color: "#d2d9e8" }),
    );
    group.add(seam);
  }
  for (const x of [-2.5, 2.5])
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 3.1, 0.45),
          new THREE.Vector3(0, 1.5, 0.15),
        ]),
        new THREE.LineBasicMaterial({ color: "#e4efff" }),
      ),
    );
  group.visible = false;
  return group;
}
