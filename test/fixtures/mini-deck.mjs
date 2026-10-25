// A small synthetic deck for exact-output tests. Real taxonomy, invented cards, so edits to the
// real library never change these fixtures.
import { readFileSync } from "node:fs";

export const taxonomy = JSON.parse(readFileSync(new URL("../../seed/taxonomy.json", import.meta.url), "utf8"));

const base = { colorMode: "light", temperature: "neutral", saturation: "balanced", contrast: "medium", accentHue: "blue", typeStyle: "grotesk", typeScale: "moderate", density: "comfortable", radius: "soft", elevation: "subtle", border: "hairline", ornament: "minimal", mood: "calm" };
const card = (id, title, tags, fonts = []) => ({ id, kind: "component", subtype: "button", title, inspiredBy: "Example", platform: "web", viewport: { w: 390, h: 844 }, tags: { ...base, ...tags }, tokens: { fonts, colors: [], radiiPx: [] } });

export const deck = {
  version: 2,
  hash: "0123456789abcdef",
  cards: [
    card("a-dark-round", "Dark round", { colorMode: "dark", radius: "round", mood: "playful", accentHue: "indigo" }, ["Alpha Sans"]),
    card("b-dark-round", "Dark round two", { colorMode: "dark", radius: "round", mood: "playful", accentHue: "indigo" }, ["Alpha Sans"]),
    card("c-dark-sharp", "Dark sharp", { colorMode: "dark", radius: "sharp", mood: "brutalist", accentHue: "red" }, ["Beta Serif"]),
    card("d-light-sharp", "Light sharp", { colorMode: "light", radius: "sharp", mood: "brutalist", accentHue: "red" }, ["Beta Serif"]),
    card("e-light-pill", "Light pill", { colorMode: "light", radius: "pill", mood: "calm", accentHue: "green" }, ["Gamma Mono"]),
    card("f-light-pill", "Light pill two", { colorMode: "light", radius: "pill", mood: "calm", accentHue: "green" }),
    card("g-odd-tags", "Odd tags", { colorMode: "sepia", radius: "blob" }),
    card("h-plain", "Plain", {}),
  ],
};
export const ids = deck.cards.map((c) => c.id);
export const vote = (id, verdict) => ({ id, verdict });
