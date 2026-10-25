import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (script) => execFileSync(process.execPath, [join(ROOT, script)], { cwd: ROOT, stdio: "pipe" });

let deckBuilt = false;
export function ensureDeck() {
  if (!deckBuilt) { run("library/build-deck.mjs"); deckBuilt = true; }
  return JSON.parse(readFileSync(join(ROOT, "library/cards.json"), "utf8"));
}
let distBuilt = false;
export function ensureDist() {
  if (!distBuilt) { ensureDeck(); run("app/build.mjs"); distBuilt = true; }
  return readFileSync(join(ROOT, "dist/index.html"), "utf8");
}

// Golden files: test/fixtures/golden/<name>/<file>. Run with UPDATE_GOLDEN=1 to rewrite them, then read the diff.
export function readGolden(name, file) {
  const p = join(ROOT, "test/fixtures/golden", name, file);
  if (process.env.UPDATE_GOLDEN) { mkdirSync(dirname(p), { recursive: true }); return { p, update: (t) => writeFileSync(p, t) }; }
  return { p, text: existsSync(p) ? readFileSync(p, "utf8") : null };
}
