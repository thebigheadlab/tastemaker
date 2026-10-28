// Headless browser checks at a 390px phone width. Skipped (and reported as skipped) when
// playwright-core or a Chromium binary is not available. Point CHROMIUM_PATH at a Chromium if it is not on PATH.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { ensureDist, ROOT } from "./helpers.mjs";

const require = createRequire(import.meta.url);
function findChromium() {
  if (process.env.CHROMIUM_PATH) return existsSync(process.env.CHROMIUM_PATH) ? process.env.CHROMIUM_PATH : null;
  for (const dir of (process.env.PATH || "").split(delimiter)) for (const name of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "chrome"]) {
    const p = join(dir, name);
    if (dir && existsSync(p)) return p;
  }
  return null;
}
let chromium = null;
try { ({ chromium } = require("playwright-core")); } catch (e) { /* not installed */ }
const exe = findChromium();
const SKIP = !chromium || !exe ? "playwright-core or Chromium not available (set CHROMIUM_PATH)" : false;

const W = 390, H = 844;
let browser, server, base, html;

before(async () => {
  if (SKIP) return;
  html = ensureDist();
  server = http.createServer((req, res) => { res.setHeader("content-type", "text/html; charset=utf-8"); res.end(html); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: exe });
});
after(async () => { if (browser) await browser.close(); if (server) server.close(); });

// A fresh phone-sized context per test, with every external request refused and recorded.
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  const seen = { errors: [], external: [], dialogs: [] };
  page.on("pageerror", (e) => seen.errors.push(e.message));
  page.on("dialog", (d) => { seen.dialogs.push(d.message()); d.accept(); });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => { seen.external.push(route.request().url()); route.abort(); });
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto(base);
  await page.waitForSelector(".card");
  return { ctx, page, seen };
}
const rate = async (page, verdict, n = 1) => { for (let i = 0; i < n; i++) { await page.click("#" + verdict); await page.waitForTimeout(60); } };
const count = (page) => page.textContent("#count");
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth);
const toast = (page) => page.textContent("#toast");

test("loads at 390px with no errors, no window.claude, no outside requests from the page", { skip: SKIP }, async () => {
  const { ctx, page, seen } = await open();
  assert.equal(await page.evaluate(() => typeof window.claude), "undefined");
  assert.equal(await page.evaluate(() => document.querySelector('meta[name="viewport"]').content.includes("width=device-width")), true);
  for (const tab of ["tab-swipe", "tab-taste", "tab-export"]) {
    await page.click("#" + tab);
    assert.ok((await overflow(page)) <= W, `${tab} scrollWidth ${await overflow(page)}`);
  }
  assert.deepEqual(seen.errors, []);
  assert.deepEqual(seen.external, []);
  await ctx.close();
});

test("swipes persist across a reload, and undo and re-rate work", { skip: SKIP }, async () => {
  const { ctx, page } = await open();
  await rate(page, "like", 2); await rate(page, "nope"); await rate(page, "love"); await rate(page, "skip");
  assert.match(await count(page), /^5 \/ 128/);
  await page.click("#undo");
  assert.match(await count(page), /^4 \/ 128/);
  await rate(page, "like");
  assert.match(await count(page), /^5 \/ 128/);
  await page.reload(); await page.waitForSelector(".card");
  assert.match(await count(page), /^5 \/ 128/);
  assert.match(await page.textContent("#savehint"), /on this device only/);
  await ctx.close();
});

test("export tab: files match the generator, copy and Blob download work", { skip: SKIP }, async () => {
  const { ctx, page } = await open();
  await rate(page, "love", 3);
  await page.click("#tab-export");
  const shown = await page.textContent("#doc");
  assert.match(shown, /^# DESIGN\.md/);
  assert.match(shown, /hash [0-9a-f]{16}/);
  await page.click("#copy");
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), shown);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
  assert.equal(dl.suggestedFilename(), "DESIGN.md");
  assert.equal(readFileSync(await dl.path(), "utf8"), shown);
  await page.click('#doctabs button[data-k="tokens.json"]');
  const [dl2] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
  assert.equal(dl2.suggestedFilename(), "tokens.json");
  const tokens = JSON.parse(readFileSync(await dl2.path(), "utf8"));
  assert.equal(tokens.$extensions.tastemaker.generator.name, "tastemaker-generator");
  // same swipes, same files: reload and compare
  await page.reload(); await page.waitForSelector(".card"); await page.click("#tab-export");
  assert.equal(await page.textContent("#doc"), shown);
  await ctx.close();
});

test("backup, clear, restore, and bad files", { skip: SKIP }, async () => {
  const { ctx, page } = await open();
  await rate(page, "like", 3); await rate(page, "nope", 2);
  await page.click("#tab-export");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#backup")]);
  const backupPath = await dl.path();
  const backup = JSON.parse(readFileSync(backupPath, "utf8"));
  assert.equal(backup.format, "tastemaker-backup");
  assert.equal(backup.votes.length, 5);
  await page.click("#clearall");
  assert.match(await count(page), /^0 \/ 128/);
  await page.setInputFiles("#restorefile", backupPath);
  await page.waitForFunction(() => /^5 \/ 128/.test(document.getElementById("count").textContent));
  assert.match(await toast(page), /Restored 5/);
  // a file that is not a backup changes nothing
  await page.setInputFiles("#restorefile", { name: "x.json", mimeType: "application/json", buffer: Buffer.from("{nope") });
  await page.waitForFunction(() => /not valid JSON/.test(document.getElementById("toast").textContent));
  assert.match(await count(page), /^5 \/ 128/);
  await page.setInputFiles("#restorefile", { name: "big.json", mimeType: "application/json", buffer: Buffer.alloc(1100000, 32) });
  await page.waitForFunction(() => /too big/.test(document.getElementById("toast").textContent));
  assert.match(await count(page), /^5 \/ 128/);
  await ctx.close();
});

test("blocked storage: page works and says so", { skip: SKIP }, async () => {
  const { ctx, page, seen } = await open({ init: () => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("blocked", "SecurityError"); } }); } });
  assert.equal(await page.isVisible("#notice"), true);
  assert.match(await page.textContent("#notice"), /blocking storage/);
  await rate(page, "like", 2);
  assert.match(await count(page), /^2 \/ 128/);
  await page.click("#tab-export");
  assert.match(await page.textContent("#storagenote"), /blocking storage/);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#notice button")]);
  assert.equal(JSON.parse(readFileSync(await dl.path(), "utf8")).votes.length, 2);
  assert.deepEqual(seen.errors, []);
  await ctx.close();
});

test("corrupt storage: starts fresh, offers the unreadable data, can be dismissed", { skip: SKIP }, async () => {
  const { ctx, page, seen } = await open({ init: () => { if (window !== window.top) return; if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("tastemaker.votes.v1", "{broken"); } } });
  assert.match(await page.textContent("#notice"), /could not be read/);
  assert.match(await count(page), /^0 \/ 128/);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#notice button:first-of-type")]);
  assert.equal(readFileSync(await dl.path(), "utf8"), "{broken");
  await rate(page, "like", 2);
  await page.click("#notice button:nth-of-type(2)");
  assert.equal(await page.isVisible("#notice"), false);
  await page.reload(); await page.waitForSelector(".card");
  assert.match(await count(page), /^2 \/ 128/);
  assert.deepEqual(seen.errors, []);
  await ctx.close();
});

test("a leftover recovery copy is offered on a later visit and can be dismissed", { skip: SKIP }, async () => {
  const { ctx, page } = await open({ init: () => { if (window !== window.top) return; if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("tastemaker.recovery.v1", "old-broken-data"); } } });
  assert.match(await page.textContent("#notice"), /earlier visit/);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#notice button:first-of-type")]);
  assert.equal(readFileSync(await dl.path(), "utf8"), "old-broken-data");
  await page.click("#notice button:nth-of-type(2)");
  assert.equal(await page.isVisible("#notice"), false);
  await page.reload(); await page.waitForSelector(".card");
  assert.equal(await page.isVisible("#notice"), false);
  await ctx.close();
});

test("restoring a backup from another deck warns in the confirmation, and still restores", { skip: SKIP }, async () => {
  const { ctx, page, seen } = await open();
  const id = await page.evaluate(() => document.querySelector(".card").dataset.id);
  const buf = Buffer.from(JSON.stringify({ format: "tastemaker-backup", version: 1, deck: { version: 1, hash: "ffffffffffffffff" }, votes: [{ id, verdict: "love" }] }));
  await page.click("#tab-export");
  await page.setInputFiles("#restorefile", { name: "other.json", mimeType: "application/json", buffer: buf });
  await page.waitForFunction(() => /^1 \/ 128/.test(document.getElementById("count").textContent));
  assert.ok(seen.dialogs.some((d) => /different version of the deck/.test(d)));
  await ctx.close();
});

test("your taste tab fits inside 390px after many swipes", { skip: SKIP }, async () => {
  const { ctx, page } = await open();
  await rate(page, "love", 4); await rate(page, "nope", 4); await rate(page, "like", 6);
  await page.click("#tab-taste");
  await page.waitForSelector(".dim");
  assert.ok((await overflow(page)) <= W);
  assert.ok((await page.locator(".dim").count()) >= 13);
  await ctx.close();
});

// A control that can be tapped before the toast shows must still be tappable after it, unless the toast pushed it off screen.
test("the toast never covers a tappable control on any tab, at the top, middle or bottom", { skip: SKIP }, async () => {
  const { ctx, page } = await open();
  await rate(page, "love", 2);
  const tappable = () => page.evaluate(() => [...document.querySelectorAll("button, a, input, [role=tab]")].filter((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.closest("[hidden]") || r.bottom <= 0 || r.top >= innerHeight) return false;
    const hit = document.elementFromPoint(r.left + r.width / 2, Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1));
    return hit === el || el.contains(hit);
  }).map((el) => el.id || el.dataset.k || el.textContent.trim().slice(0, 24)));
  for (const tab of ["tab-swipe", "tab-taste", "tab-export"]) {
    await page.click("#" + tab);
    for (const where of ["top", "middle", "bottom"]) {
      await page.evaluate((w) => window.scrollTo(0, w === "top" ? 0 : w === "bottom" ? document.body.scrollHeight : document.body.scrollHeight / 2), where);
      const before = await tappable();
      await page.evaluate(() => { const t = document.getElementById("toast"); t.textContent = "Couldn't copy here. Select the text and copy it by hand. More words so it wraps."; t.classList.add("on"); });
      const rect = await page.locator("#toast").boundingBox();
      const after = await page.evaluate(() => [...document.querySelectorAll("button, a, input, [role=tab]")].map((el) => { const r = el.getBoundingClientRect(); return [el.id || el.dataset.k || el.textContent.trim().slice(0, 24), r.top, r.bottom, r.left + r.width / 2]; }));
      const covered = [];
      for (const [name, top, bottom, cx] of after) {
        if (!before.includes(name) || bottom <= 0 || top >= 844) continue;
        const cy = Math.min(Math.max((top + bottom) / 2, 1), 843);
        if (cy >= rect.y && cy <= rect.y + rect.height && cx >= rect.x && cx <= rect.x + rect.width) covered.push(name);
      }
      assert.deepEqual(covered, [], `${tab} at ${where}`);
      await page.evaluate(() => document.getElementById("toast").classList.remove("on"));
    }
  }
  assert.ok((await overflow(page)) <= W);
  await ctx.close();
});

