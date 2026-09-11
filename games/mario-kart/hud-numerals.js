/** Local segmented race-counter artwork, with an accessible text equivalent. */
const segments = [
  "4,0 18,0 21,3 17,6 6,6 2,3",
  "19,5 22,3 22,16 19,19 16,16 17,8",
  "18,21 21,18 21,32 18,35 15,32 16,24",
  "4,32 15,32 18,36 15,38 1,38 0,35",
  "1,21 4,19 7,22 5,31 1,34 0,31",
  "3,5 6,7 5,16 2,19 0,16 1,7",
  "5,16 16,16 19,19 15,22 5,22 2,19",
];
const masks = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];
export function raceNumerals(element, value) {
  if (element.dataset.numerals === value) return;
  element.dataset.numerals = value;
  element.setAttribute("aria-label", value);
  let x = 0,
    body = "";
  for (const char of value) {
    if (char === " ") {
      x += 7;
      continue;
    }
    if (char === "/") {
      body += `<path d="M${x + 2} 37l11-36h4L${x + 6} 37z"/>`;
      x += 19;
      continue;
    }
    const mask = masks[Number(char)];
    body += `<g transform="translate(${x},0)">${segments.map((points, i) => (mask & (1 << i) ? `<polygon points="${points}"/>` : "")).join("")}</g>`;
    x += 27;
  }
  element.innerHTML = `<svg class="race-numerals" aria-hidden="true" viewBox="-2 -1 ${x + 2} 41" width="${(x + 2) * 0.74}" height="31">${body}</svg>`;
}
