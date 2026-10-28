import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, ensureDist, ensureDeck } from "./helpers.mjs";

// The page's own code, without the deck data (card mockups can contain any text, including code samples).
function appCode(html) {
  return html.replace(/<script type="application\/json" id="(deck|taxonomy)-data">[\s\S]*?<\/script>/g, "");
}
const FORBIDDEN = [
  [/window\.claude/, "window.claude"], [/\bclaude\b/i, "the word claude"], [/anthropic|openai|api[_-]?key/i, "AI provider or key"],
  [/\bfetch\s*\(/, "fetch("], [/XMLHttpRequest/, "XMLHttpRequest"], [/WebSocket/, "WebSocket"], [/EventSource/, "EventSource"],
  [/sendBeacon/, "sendBeacon"], [/importScripts|\bimport\s*\(/, "dynamic import"], [/navigator\.serviceWorker/, "service worker"],
  [/\.use\(\s*["'](db|sample|downloads)["']/, "host service call"],
];

test("source and built page have no window.claude, AI, or network calls", () => {
  const files = readdirSync(join(ROOT, "app")).filter((f) => /\.(mjs|html)$/.test(f)).map((f) => [`app/${f}`, readFileSync(join(ROOT, "app", f), "utf8")]);
  files.push(["dist/index.html", appCode(ensureDist())]);
  assert.ok(files.length >= 4);
  for (const [name, text] of files) for (const [re, what] of FORBIDDEN) assert.doesNotMatch(text, re, `${name} contains ${what}`);
});

test("the page itself loads nothing from outside", () => {
  const code = appCode(ensureDist());
  const urls = [...code.matchAll(/(?:https?:)?\/\/[\w.-]+\.[a-z]{2,}[^\s"'<>)]*/g)].map((m) => m[0]).filter((u) => !u.startsWith("//www.w3.org") && !u.startsWith("http://www.w3.org"));
  assert.deepEqual(urls, []);
  assert.doesNotMatch(code, /<link[^>]+href=/i);
  assert.doesNotMatch(code, /<script[^>]+\bsrc=/i);
});

test("cards and seed generator do not reference external font services", () => {
  ensureDeck();
  const html = JSON.parse(readFileSync(join(ROOT, "library/html.json"), "utf8"));
  const hosts = new Set();
  for (const src of Object.values(html)) for (const m of src.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?:^|["'(\s])(?:https?:)?\/\/([\w.-]+)/gi)) hosts.add(m[1].toLowerCase());
  assert.deepEqual([...hosts].filter((h) => h !== "www.w3.org"), []);
  assert.doesNotMatch(readFileSync(join(ROOT, "seed/generate.mjs"), "utf8"), /fonts\.(googleapis|gstatic)\.com/);
});

test("deck retains the cards' intended font families", () => {
  const { cards } = ensureDeck();
  assert.deepEqual(cards.find((c) => c.id === "vercel-projects").tokens.fonts, ["Geist", "Geist Mono"]);
  assert.deepEqual(cards.find((c) => c.id === "airbnb-listing-card").tokens.fonts, ["Nunito Sans"]);
});

test("no personal profile, host paths, or emails ship in the repo", () => {
  assert.equal(existsSync(join(ROOT, "taste")), false);
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (["node_modules", ".git", "dist", "_renders"].includes(e.name) ? [] : e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
  const bad = [];
  for (const f of walk(ROOT)) {
    if (!/\.(mjs|cjs|js|json|md|html|py|toml|txt)$/.test(f) || /bun\.lock|library\/(cards|html)\.json|test\/no-ai/.test(f)) continue;
    const text = readFileSync(f, "utf8");
    if (/\/home\/[a-z]|\/Users\/[A-Za-z]|\/opt\/(node|pw)/.test(text)) bad.push(`${relative(ROOT, f)}: host path`);
    for (const m of text.matchAll(/[\w.+-]+@([\w-]+\.)+[a-z]{2,}/g)) if (!/@example\.com$|@\d|wght@/.test(m[0]) && !/^[\w.-]+@(types|playwright)/.test(m[0])) bad.push(`${relative(ROOT, f)}: email ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});

test("page copy states that swipes stay on this device", () => {
  const html = ensureDist();
  assert.doesNotMatch(html, /Nothing is sent anywhere/);
  assert.match(html, /Your swipes never leave this device/);
});
