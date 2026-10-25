// Inlines the card library into the single-file Tastemaker artifact.
// Run `node library/build-deck.mjs` first.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const deck = JSON.parse(readFileSync(join(ROOT, "library/cards.json"), "utf8"));
const html = JSON.parse(readFileSync(join(ROOT, "library/html.json"), "utf8"));
const taxonomy = JSON.parse(readFileSync(join(ROOT, "seed/taxonomy.json"), "utf8"));

// "<" escaped so card markup can never close the surrounding <script>.
const safe = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const out = readFileSync(join(ROOT, "app/app.html"), "utf8")
  .replace("/*DECK*/", () => safe({ ...deck, html }))
  .replace("/*TAXONOMY*/", () => safe(taxonomy));

mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist/taste-deck.html"), out);
console.log(`dist/taste-deck.html ${(out.length / 1024).toFixed(0)} KB, ${deck.cards.length} cards`);
