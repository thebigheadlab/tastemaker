// Renders every card in a folder to PNG and flags common problems.
// Usage: node library/check.cjs library/<folder>
// Writes <folder>/_renders/<id>.png. Prints one line per card.
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const dir = path.resolve(process.argv[2]);
const out = path.join(dir, "_renders");
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
  const metas = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  let bad = 0;
  for (const f of metas) {
    const problems = [];
    let meta;
    try { meta = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch (e) { console.log(`✗ ${f}: invalid JSON`); bad++; continue; }
    const html = path.join(dir, meta.id + ".html");
    if (!fs.existsSync(html)) { console.log(`✗ ${meta.id}: missing ${meta.id}.html`); bad++; continue; }
    for (const k of ["id", "kind", "subtype", "title", "inspiredBy", "viewport", "tags"]) if (!meta[k]) problems.push(`missing ${k}`);
    if (!["component", "screen"].includes(meta.kind)) problems.push("kind must be component|screen");
    const src = fs.readFileSync(html, "utf8");
    if (/<script/i.test(src)) problems.push("contains <script>");
    const ext = [...src.matchAll(/(?:src|href)=["'](https?:[^"']+)/g)].map((m) => m[1]).filter((u) => !u.startsWith("https://fonts.googleapis.com"));
    if (ext.length) problems.push("external resources: " + ext.slice(0, 2).join(", "));
    if (/url\(\s*["']?https?:/i.test(src)) problems.push("external url() in CSS");
    const page = await browser.newPage({ viewport: { width: meta.viewport.w, height: meta.viewport.h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("file://" + html, { waitUntil: "networkidle" });
    await page.waitForTimeout(150);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
      clipped: [...document.querySelectorAll("body *")].filter((el) => {
        const cs = getComputedStyle(el);
        return el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 && cs.overflow !== "visible" && cs.textOverflow !== "ellipsis";
      }).length,
    }));
    if (m.sw > meta.viewport.w + 1) problems.push(`horizontal overflow ${m.sw}px > ${meta.viewport.w}px`);
    if (m.sh > meta.viewport.h + 1) problems.push(`content taller than viewport (${m.sh}px > ${meta.viewport.h}px), bottom gets cut`);
    if (m.clipped) problems.push(`${m.clipped} text elements clipped`);
    if (errors.length) problems.push("page errors");
    await page.screenshot({ path: path.join(out, meta.id + ".png") });
    await page.close();
    console.log(`${problems.length ? "✗" : "✓"} ${meta.id}${problems.length ? ": " + problems.join("; ") : ""}`);
    if (problems.length) bad++;
  }
  await browser.close();
  console.log(`\n${metas.length} cards, ${bad} with problems. Renders in ${out}`);
})();
