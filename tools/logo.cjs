// ORAYVA wordmark (2026-11-23, from the design brief): uppercase Manrope
// ExtraBold with open tracking and a custom O: a round letter whose
// counter is a pointed arch, like the portal of a madrasa seen straight on.
// The O is pomegranate, the rest takes the text colour. Outlines only, so
// no font is needed to show it.
// Run (opentype.js installed):  node tools/logo.cjs
const fs = require("fs");
const opentype = require("opentype.js");
const ROOT = __dirname + "/../";
const font = opentype.loadSync(__dirname + "/fonts/manrope800.ttf"); // Manrope ExtraBold, SIL Open Font License

const CAP = 26, BOX = 40;
const scale = CAP / font.tables.os2.sCapHeight;
const SIZE = font.unitsPerEm * scale;
const BASE = (BOX + CAP) / 2;
const TRACK = 0.1 * SIZE;
const r2 = (n) => Math.round(n * 100) / 100;

function glyph(ch, x) {
  const g = font.charToGlyph(ch);
  const p = g.getPath(x, BASE, SIZE);
  return { d: p.toPathData(2), width: g.advanceWidth * scale };
}
// the arch O: a circle with an equilateral pointed-arch counter (even-odd fill)
function archO(x) {
  const R = CAP / 2 + 0.6;            // round letters overshoot a little
  const t = 272 * scale * 1.02;       // ring as thick as Manrope's stems
  const cx = x + R, cy = BASE - CAP / 2;
  const w = 2 * (R - t) * 0.92;       // counter width
  const bottom = cy + R - t;
  const apex = cy - R + t * 0.95;
  const spring = apex + 0.866 * w;    // where the arch starts curving
  const xl = cx - w / 2, xr = cx + w / 2;
  const circle = `M${r2(cx - R)} ${r2(cy)}A${r2(R)} ${r2(R)} 0 1 0 ${r2(cx + R)} ${r2(cy)}A${r2(R)} ${r2(R)} 0 1 0 ${r2(cx - R)} ${r2(cy)}Z`;
  const arch = `M${r2(xl)} ${r2(bottom)}L${r2(xl)} ${r2(spring)}A${r2(w)} ${r2(w)} 0 0 1 ${r2(cx)} ${r2(apex)}A${r2(w)} ${r2(w)} 0 0 1 ${r2(xr)} ${r2(spring)}L${r2(xr)} ${r2(bottom)}Z`;
  return { d: circle + arch, width: 2 * R };
}

let x = 1;
const o = archO(x); x += o.width + TRACK;
let word = "";
for (const ch of "RAYVA") { const g = glyph(ch, x); word += g.d; x += g.width + TRACK; }
const width = Math.ceil(x - TRACK + 1);

const svg = (ink, accent) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${BOX}" role="img" aria-label="ORAYVA"><path fill="${accent}" fill-rule="evenodd" d="${o.d}"/><path fill="${ink}" d="${word}"/></svg>\n`;
fs.writeFileSync(ROOT + "assets/brand/orayva-logo.svg", svg("#182044", "#C21F4B"));
fs.writeFileSync(ROOT + "assets/brand/orayva-logo-dark.svg", svg("#F6F1FF", "#FF7894"));
fs.writeFileSync(ROOT + "assets/brand/orayva-logo-mono.svg", svg("#000000", "#000000"));
// favicon: the arch O alone, in pomegranate on cream
const pad = 4;
const f = archO(pad);
const S = f.width + pad * 2;
const dy = S / 2 - (BASE - CAP / 2); // move the letter centre to the middle of the square
fs.writeFileSync(ROOT + "assets/brand/orayva-favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(S)} ${r2(S)}"><rect width="${r2(S)}" height="${r2(S)}" rx="${r2(S * 0.22)}" fill="#F3F5FC"/><path transform="translate(0 ${r2(dy)})" fill="#C21F4B" fill-rule="evenodd" d="${f.d}"/></svg>
`);
fs.writeFileSync(ROOT + "js/logo.js", `/* ORAYVA wordmark outlines, written by tools/logo.cjs */\nwindow.LOGO = ${JSON.stringify({ width, height: BOX, o: o.d, word })};\n`);
console.log("logo", width, "x", BOX);
