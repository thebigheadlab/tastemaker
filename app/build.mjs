// Builds dist/index.html: app/app.html with the deck, the taxonomy and the app/*.mjs modules inlined.
// Run `node library/build-deck.mjs` first (or `bun run build` for both).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// "<" escaped so card markup can never close the surrounding <script>.
const safe = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

// Browser modules are plain ES modules that Node can import for tests. For the single-file page they are
// wrapped in functions: `import { a } from "./x.mjs"` becomes a destructure from an earlier module,
// and `export const|function|async function name` becomes a property of the module's result.
// Modules may only use those two export forms and named imports of the form `import { a, b } from "./x.mjs";`.
export const MODULES = ["generator", "storage", "io"];
export function bundleModules(names = MODULES) {
  let out = "var TM = (function () {\n\"use strict\";\nvar mods = {};\n";
  for (const name of names) {
    const file = `app/${name}.mjs`;
    if (!existsSync(join(ROOT, file))) continue;
    const src = read(file);
    const exported = [...src.matchAll(/^export (?:const|function|async function) (\w+)/gm)].map((m) => m[1]);
    const body = src
      .replace(/^import \{([^}]*)\} from "\.\/(\w+)\.mjs";$/gm, (_, list, from) => `const {${list}} = mods.${from};`)
      .replace(/^export (const|function|async function) /gm, "$1 ");
    if (/^\s*(import|export)\b/m.test(body)) throw new Error(`${file}: unsupported import or export form`);
    out += `mods.${name} = (function () {\n${body}\nreturn { ${exported.join(", ")} };\n})();\n`;
  }
  return out + "return mods;\n})();\n";
}

export function build() {
  const deck = JSON.parse(read("library/cards.json"));
  const html = JSON.parse(read("library/html.json"));
  const taxonomy = JSON.parse(read("seed/taxonomy.json"));
  const out = read("app/app.html")
    .replace("/*MODULES*/", () => bundleModules().replace(/<\/script/gi, "<\\/script"))
    .replace("/*DECK*/", () => safe({ ...deck, html }))
    .replace("/*TAXONOMY*/", () => safe(taxonomy));
  mkdirSync(join(ROOT, "dist"), { recursive: true });
  writeFileSync(join(ROOT, "dist/index.html"), out);
  return { bytes: out.length, cards: deck.cards.length, hash: deck.hash };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = build();
  console.log(`dist/index.html ${(r.bytes / 1024).toFixed(0)} KB, ${r.cards} cards, deck hash ${r.hash}`);
}
