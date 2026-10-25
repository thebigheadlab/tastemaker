import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./helpers.mjs";

const read = (p) => readFileSync(join(ROOT, p), "utf8");

test("package.json has build and test scripts and few dependencies", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.build, "node library/build-deck.mjs && node app/build.mjs");
  assert.match(pkg.scripts.test, /node --test/);
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0);
  assert.ok(Object.keys(pkg.devDependencies || {}).length <= 1);
});

test("the documented build commands produce dist/index.html from a clean dist", () => {
  execFileSync(process.execPath, [join(ROOT, "library/build-deck.mjs")], { cwd: ROOT, stdio: "pipe" });
  execFileSync(process.execPath, [join(ROOT, "app/build.mjs")], { cwd: ROOT, stdio: "pipe" });
  const p = join(ROOT, "dist/index.html");
  assert.ok(existsSync(p));
  assert.ok(statSync(p).size > 500000);
});

test("dist/index.html is a complete mobile page", () => {
  const html = read("dist/index.html");
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1[^"]*">/);
  assert.match(html, /<title>Tastemaker<\/title>/);
  assert.equal((html.match(/<script id="tastemaker-modules">/g) || []).length, 1);
});

test("vercel.json is valid static config pointing at dist", () => {
  const v = JSON.parse(read("vercel.json"));
  assert.equal(v.outputDirectory, "dist");
  assert.match(v.buildCommand, /build-deck\.mjs/);
  assert.match(v.buildCommand, /app\/build\.mjs/);
  assert.equal(v.rewrites, undefined);
});

test("build output is not committed", () => {
  const ignore = read(".gitignore").split("\n");
  for (const p of ["dist/", "library/cards.json", "library/html.json", "node_modules/"]) assert.ok(ignore.includes(p), p);
  const tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" }).split("\n");
  assert.deepEqual(tracked.filter((f) => /^dist\/|^library\/(cards|html)\.json$/.test(f)), []);
});

test("license and README usage are present", () => {
  assert.match(read("LICENSE"), /MIT License/);
  assert.match(read("README.md"), /## Use it/);
  assert.match(read("CONTEXT.md"), /\*\*Curated default\*\*/);
});

// static.test.mjs and no-ai.test.mjs hold the patterns themselves, so they are left out.
test("scripts and tests contain no machine-specific paths", () => {
  const files = [];
  for (const dir of ["app", "library", "seed", "test"]) for (const f of readdirSync(join(ROOT, dir))) if (/\.(mjs|cjs|py)$/.test(f) && !/^test\/(static|no-ai)\.test\.mjs$/.test(`${dir}/${f}`)) files.push(`${dir}/${f}`);
  assert.ok(files.length > 8);
  for (const f of files) assert.doesNotMatch(read(f), /\/home\/|\/Users\/|\/opt\/|C:\\\\/, f);
});

test("the toast is part of the sticky header, not a floating layer", () => {
  const html = read("app/app.html");
  assert.match(html, /header\{position:sticky/);
  assert.match(html, /<div class="toast" id="toast"[^>]*><\/div>\n  <\/header>/);
  assert.doesNotMatch(html.match(/\.toast\{[^}]*\}/)[0], /position:\s*fixed/);
});
