/** Original character sculptures, shared by the Blender build and live fallback.
 * All coordinates use Three's Y-up space, kart nose along -Z. */
import { CHARACTERS } from "./logic.js";
export function modelSpec(id) {
  const ch = CHARACTERS.find((c) => c.id === id) || CHARACTERS[0],
    parts = [];
  const add = (name, shape, color, p, s, rotation = [0, 0, 0], extra = {}) =>
    parts.push({ name, shape, color, p, s, rotation, ...extra });
  const ball = (n, c, p, s) => add(n, "sphere", c, p, s);
  const box = (n, c, p, s) => add(n, "box", c, p, s);
  const tube = (n, c, p, s, rot = [0, 0, 0]) =>
    add(n, "cylinder", c, p, s, rot);
  const skin = "#ffd0a1",
    white = "#fff7e8",
    black = "#151725",
    blue = "#2259be",
    gold = "#ffc72b",
    red = "#e42c34";
  // Standard kart: rounded painted nose, separate cockpit, chrome pipe frame,
  // flared rear fairing, twin exhausts, axle hubs, tread rings and seat.
  box("chassis", ch.color, [0, 0.67, 0], [1.55, 0.42, 2.45]);
  ball("nose", ch.color, [0, 0.78, -1.05], [0.86, 0.39, 0.68]);
  box("nose-stripe", white, [0, 1.01, -1.18], [0.2, 0.045, 0.55]);
  box("cockpit", black, [0, 0.95, 0.17], [1.07, 0.32, 1.14]);
  box("seat", "#333950", [0, 1.2, 0.52], [0.8, 0.75, 0.27]);
  box("rear-fairing", ch.color, [0, 1.04, 0.97], [1.63, 0.4, 0.42]);
  for (const sign of [-1, 1]) {
    tube(
      "side-frame-" + sign,
      "#d6dfed",
      [sign * 0.84, 0.51, 0],
      [0.095, 2.25, 0.095],
      [Math.PI / 2, 0, 0],
    );
    tube(
      "exhaust-" + sign,
      "#a6b7d0",
      [sign * 0.53, 0.7, 1.32],
      [0.15, 0.52, 0.15],
      [Math.PI / 2, 0, 0],
    );
    tube(
      "exhaust-hole-" + sign,
      black,
      [sign * 0.53, 0.7, 1.59],
      [0.115, 0.015, 0.115],
      [Math.PI / 2, 0, 0],
    );
  }
  tube(
    "front-bumper",
    "#e7edf5",
    [0, 0.58, -1.62],
    [0.09, 1.65, 0.09],
    [0, 0, Math.PI / 2],
  );
  for (const [i, [x, z]] of [
    [-1, -0.87],
    [1, -0.87],
    [-1, 0.9],
    [1, 0.9],
  ].entries()) {
    add("wheel-" + i, "wheel", black, [x * 0.99, 0.46, z], [0.39, 0.34, 0.39]);
  }
  // Short cartoon proportions read at chase-camera size. Each has a unique
  // silhouette, face details and rear silhouette, not just a palette swap.
  const heavy = ["bowser", "donkey-kong"].includes(id),
    headY = heavy ? 2.05 : 2.15;
  const body =
    id === "peach"
      ? "#f46fac"
      : id === "donkey-kong"
        ? "#814324"
        : id === "bowser"
          ? "#f4ae35"
          : id === "yoshi"
            ? "#49bd38"
            : id === "koopa"
              ? "#edbf42"
              : ch.color;
  ball(
    "torso",
    body,
    [0, 1.48, 0.04],
    heavy ? [0.64, 0.66, 0.47] : [0.44, 0.53, 0.33],
  );
  if (["mario", "luigi"].includes(id)) {
    ball("overalls", blue, [0, 1.22, -0.07], [0.46, 0.35, 0.38]);
    for (const x of [-0.27, 0.27]) {
      box("strap" + x, blue, [x, 1.53, -0.275], [0.13, 0.48, 0.075]);
      ball("button" + x, gold, [x, 1.49, -0.33], [0.065, 0.065, 0.03]);
    }
  }
  for (const side of [-1, 1]) {
    ball(
      "boot" + side,
      id === "yoshi" ? "#f06425" : "#603521",
      [side * 0.37, 1.05, -0.65],
      [0.26, 0.21, 0.4],
    );
    const arm = ball(
      "arm" + side,
      body,
      [side * (heavy ? 0.59 : 0.43), 1.45, -0.3],
      [0.19, 0.28, 0.35],
    );
    ball(
      "hand" + side,
      ["mario", "luigi", "peach", "toad"].includes(id) ? white : body,
      [side * 0.43, 1.49, -0.67],
      [0.2, 0.19, 0.2],
    );
  }
  add(
    "steering",
    "torus",
    "#1d2130",
    [0, 1.47, -0.65],
    [0.43, 0.43, 0.43],
    [0.65, 0, 0],
  );
  if (["mario", "luigi", "peach", "toad"].includes(id)) {
    ball("head", skin, [0, headY, -0.04], [0.44, 0.44, 0.4]);
    for (const x of [-0.43, 0.43])
      ball("ear" + x, skin, [x, headY, -0.015], [0.12, 0.17, 0.1]);
    ball("nose-face", skin, [0, headY - 0.06, -0.45], [0.2, 0.18, 0.2]);
    for (const x of [-0.155, 0.155]) {
      ball(
        "eye-white" + x,
        white,
        [x, headY + 0.075, -0.383],
        [0.105, 0.15, 0.045],
      );
      ball(
        "eye-blue" + x,
        "#2868bd",
        [x, headY + 0.07, -0.424],
        [0.048, 0.091, 0.027],
      );
      ball(
        "pupil" + x,
        black,
        [x, headY + 0.07, -0.446],
        [0.026, 0.057, 0.016],
      );
    }
    if (id === "mario" || id === "luigi") {
      ball("hair", "#50291a", [0, headY - 0.09, 0.27], [0.4, 0.33, 0.18]);
      for (let i = -2; i <= 2; i++)
        ball(
          "mustache" + i,
          "#49291e",
          [i * 0.079, headY - 0.2, -0.421],
          [0.09, 0.073, 0.056],
        );
      ball("cap", ch.color, [0, headY + 0.31, 0], [0.51, 0.26, 0.46]);
      ball("brim", ch.color, [0, headY + 0.23, -0.4], [0.49, 0.07, 0.33]);
      ball("cap-badge", white, [0, headY + 0.36, -0.419], [0.15, 0.14, 0.03]);
      add(
        "cap-letter",
        "text",
        ch.color,
        [0, headY + 0.35, -0.455],
        [0.19, 0.19, 0.03],
        [0, Math.PI, 0],
        { text: id === "mario" ? "M" : "L" },
      );
    } else if (id === "peach") {
      ball("hair-back", "#f8c637", [0, 2.12, 0.25], [0.55, 0.69, 0.3]);
      for (const x of [-0.43, 0.43])
        ball("hair-side" + x, "#f8c637", [x, 2.02, 0.09], [0.18, 0.55, 0.23]);
      ball("fringe", "#ffda4f", [0, 2.49, -0.1], [0.45, 0.17, 0.33]);
      tube("crown", gold, [0, 2.71, 0.03], [0.23, 0.29, 0.23]);
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        add(
          "crown-tip" + i,
          "cone",
          gold,
          [Math.cos(a) * 0.22, 2.96, Math.sin(a) * 0.22],
          [0.085, 0.25, 0.085],
        );
      }
      ball("crown-jewel", "#ed3563", [0, 2.73, -0.24], [0.085, 0.11, 0.03]);
      ball("brooch", "#3dbbec", [0, 1.67, -0.31], [0.09, 0.12, 0.045]);
    } else {
      ball("mushroom-cap", white, [0, 2.5, 0.03], [0.74, 0.45, 0.63]);
      for (let i = 0; i < 7; i++) {
        const a = (i * Math.PI * 2) / 7;
        ball(
          "spot" + i,
          red,
          [Math.sin(a) * 0.66, 2.53, Math.cos(a) * 0.57 + 0.03],
          [0.21, 0.22, 0.065],
        );
        parts.at(-1).rotation = [0, a, 0];
      }
      ball("top-spot", red, [0, 2.91, 0.03], [0.27, 0.045, 0.27]);
      box("vest", "#2858ae", [0, 1.5, 0.25], [0.77, 0.61, 0.16]);
    }
  } else if (id === "yoshi" || id === "koopa") {
    const c = id === "yoshi" ? "#49bd38" : "#f1c343";
    ball("head", c, [0, 2.09, -0.08], [0.48, 0.48, 0.4]);
    ball(
      "snout",
      c,
      [0, 1.97, -0.52],
      id === "yoshi" ? [0.46, 0.34, 0.5] : [0.39, 0.26, 0.32],
    );
    ball("chin", white, [0, 1.79, -0.41], [0.39, 0.15, 0.32]);
    for (const x of [-0.19, 0.19]) {
      ball("eye" + x, white, [x, 2.38, -0.21], [0.19, 0.31, 0.17]);
      ball("pupil" + x, black, [x, 2.41, -0.362], [0.064, 0.13, 0.035]);
    }
    ball("shell-rim", white, [0, 1.55, 0.37], [0.53, 0.5, 0.19]);
    ball(
      "shell",
      id === "yoshi" ? red : "#279b3f",
      [0, 1.6, 0.49],
      [0.45, 0.43, 0.21],
    );
    if (id === "yoshi")
      for (let i = 0; i < 3; i++)
        add(
          "dorsal" + i,
          "cone",
          "#e4482e",
          [0, 2.44 - i * 0.2, 0.26 + i * 0.05],
          [0.14, 0.23, 0.14],
          [0.8, 0, 0],
        );
  } else if (id === "bowser") {
    ball("shell-rim", white, [0, 1.7, 0.44], [0.82, 0.84, 0.23]);
    ball("shell", "#318238", [0, 1.78, 0.61], [0.75, 0.77, 0.35]);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        rr = i === 0 ? 0 : 0.5;
      add(
        "shell-spike" + i,
        "cone",
        white,
        [Math.sin(a) * rr, 1.8 + Math.cos(a) * rr, 0.9],
        [0.14, 0.43, 0.14],
        [Math.PI / 2, 0, 0],
      );
    }
    ball("head", body, [0, 2.4, -0.12], [0.6, 0.51, 0.48]);
    ball("snout", "#ffe199", [0, 2.22, -0.55], [0.62, 0.31, 0.4]);
    for (const x of [-0.32, 0.32]) {
      ball("eye" + x, white, [x, 2.6, -0.46], [0.2, 0.19, 0.08]);
      ball("pupil" + x, "#c53022", [x, 2.58, -0.53], [0.085, 0.11, 0.03]);
      add(
        "horn" + x,
        "cone",
        white,
        [x * 1.7, 2.85, -0.03],
        [0.18, 0.58, 0.18],
        [0, 0, -x],
      );
      box("brow" + x, red, [x, 2.79, -0.43], [0.42, 0.14, 0.14]);
    }
    for (let i = 0; i < 4; i++)
      add(
        "mane" + i,
        "cone",
        red,
        [0, 2.9 - i * 0.12, 0.15 + i * 0.15],
        [0.23, 0.4, 0.23],
        [0.5, 0, 0],
      );
  } else {
    ball("chest", "#c69259", [0, 1.56, -0.35], [0.48, 0.57, 0.11]);
    ball("head", body, [0, 2.18, -0.11], [0.55, 0.53, 0.43]);
    ball("muzzle", "#cf9c65", [0, 2.01, -0.46], [0.48, 0.29, 0.27]);
    for (const x of [-0.19, 0.19]) {
      ball("eye-patch" + x, "#cf9c65", [x, 2.42, -0.38], [0.24, 0.23, 0.09]);
      ball("eye" + x, white, [x, 2.4, -0.46], [0.12, 0.12, 0.05]);
      ball("pupil" + x, black, [x, 2.41, -0.5], [0.044, 0.065, 0.025]);
    }
    box("brow", body, [0, 2.58, -0.4], [0.87, 0.19, 0.17]);
    add(
      "tie",
      "cone",
      red,
      [0, 1.45, -0.49],
      [0.17, 0.58, 0.065],
      [0, 0, Math.PI],
    );
    add(
      "tie-letter",
      "text",
      gold,
      [0, 1.45, -0.57],
      [0.16, 0.16, 0.02],
      [0, Math.PI, 0],
      { text: "DK" },
    );
  }
  return { id: ch.id, name: ch.name, parts };
}
