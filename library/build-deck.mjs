// Collects every card in library/<folder>/ into library/cards.json (+ html map) for the app build.
// Cards listed in library/cut.txt (one id per line) are left out.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const LIB = dirname(fileURLToPath(import.meta.url));
const cut = new Set(existsSync(join(LIB, "cut.txt")) ? readFileSync(join(LIB, "cut.txt"), "utf8").split(/\s+/).filter(Boolean) : []);
const cards = [], html = {};

// Rough tokens pulled from the card's CSS so generated docs can quote real values.
function extractTokens(src) {
  const fonts = [...src.matchAll(/family=([^:&"']+)/g)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, " "));
  const count = (re, norm = (x) => x) => {
    const m = {};
    for (const x of src.matchAll(re)) { const k = norm(x[1]); m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  };
  const hex = (h) => { h = h.toLowerCase(); return h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h; };
  return {
    fonts: [...new Set(fonts)],
    colors: count(/(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b)/g, hex).slice(0, 8),
    radiiPx: count(/border-radius:\s*(\d+)px/g).slice(0, 4).map(Number),
  };
}

for (const folder of readdirSync(LIB).sort()) {
  const dir = join(LIB, folder);
  if (!statSync(dir).isDirectory() || folder.startsWith("_")) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const meta = JSON.parse(readFileSync(join(dir, f), "utf8"));
    if (cut.has(meta.id) || !existsSync(join(dir, meta.id + ".html"))) continue;
    if (html[meta.id]) throw new Error(`duplicate id ${meta.id}`);
    html[meta.id] = readFileSync(join(dir, meta.id + ".html"), "utf8");
    cards.push({ ...meta, author: folder, tokens: extractTokens(html[meta.id]), source: { type: "generated", inspiredBy: meta.inspiredBy } });
  }
}

writeFileSync(join(LIB, "cards.json"), JSON.stringify({ version: 2, generated: new Date().toISOString().slice(0, 10), count: cards.length, cards }, null, 2));
writeFileSync(join(LIB, "html.json"), JSON.stringify(html));
const by = (k) => cards.reduce((m, c) => ((m[c[k]] = (m[c[k]] || 0) + 1), m), {});
console.log(`${cards.length} cards`, by("kind"), by("platform"), `${Object.keys(by("inspiredBy")).length} products`);
