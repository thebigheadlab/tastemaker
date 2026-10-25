import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import * as G from "../app/generator.mjs";
import { taxonomy } from "./fixtures/mini-deck.mjs";
import { ensureDeck, ensureDist } from "./helpers.mjs";

function inlinedModules(html) {
  const m = html.match(/<script id="tastemaker-modules">([\s\S]*?)<\/script>/);
  assert.ok(m, "modules script present in dist/index.html");
  const ctx = vm.createContext({});
  return vm.runInContext(m[1] + "\nTM;", ctx);
}

test("the code inlined in dist/index.html gives byte-identical files to the Node import", () => {
  const html = ensureDist();
  const deck = ensureDeck();
  const TM = inlinedModules(html);
  assert.equal(TM.generator.GENERATOR_VERSION, G.GENERATOR_VERSION);
  const verdicts = ["love", "like", "nope", "skip", "like"];
  const votes = deck.cards.map((c, i) => ({ id: c.id, verdict: verdicts[(i * 3) % verdicts.length] }));
  for (const v of [[], votes.slice(0, 5), votes]) {
    const a = TM.generator.generate(v, deck, taxonomy).files;
    const b = G.generate(v, deck, taxonomy).files;
    assert.deepEqual(Object.keys(a), Object.keys(b));
    for (const k of Object.keys(b)) assert.equal(a[k], b[k], k);
  }
});

test("dist/index.html embeds the same deck hash the generator will record", () => {
  const html = ensureDist();
  const deck = ensureDeck();
  const m = html.match(/<script type="application\/json" id="deck-data">([\s\S]*?)<\/script>/);
  assert.equal(JSON.parse(m[1]).hash, deck.hash);
});

test("inlined storage and io modules behave like the Node imports", async () => {
  const S = await import("../app/storage.mjs");
  const IO = await import("../app/io.mjs");
  const html = ensureDist();
  const deck = ensureDeck();
  const TM = inlinedModules(html);
  const votes = new Map(deck.cards.slice(0, 6).map((c, i) => [c.id, ["love", "like", "nope"][i % 3]]));
  const text = S.makeBackup(votes, deck);
  assert.equal(TM.storage.makeBackup(votes, deck), text);
  assert.deepEqual([...TM.storage.parseBackup(text, deck).votes], [...votes]);
  assert.equal(TM.storage.parseBackup("{", deck).error, "not-json");
  assert.equal(TM.io.safeFilename("../x y.json"), IO.safeFilename("../x y.json"));
});
