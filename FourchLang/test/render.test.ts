import { describe, it, expect, beforeAll } from "vitest";
import { parseHTML } from "linkedom";
import * as path from "node:path";
import * as fs from "node:fs";

import { runGeneration } from "../src/cli/generator.js";
import { loadExampleFiles } from "./util.js";

const OUTPUT = path.resolve(__dirname, "../.test-output");

// Garder SEULEMENT les fichiers valides
const examples = loadExampleFiles().filter(f =>
    !f.includes("invalid") && !f.includes("invalid-variant")
);

beforeAll(() => {
    fs.mkdirSync(OUTPUT, { recursive: true });
});

describe("render", () => {

    it.each(examples)(
        "HTML output for %s should contain required DOM structure",
        async (filePath) => {

            const dest = path.join(OUTPUT, path.basename(filePath) + ".html");
            const out = await runGeneration(filePath, dest, "html");

            const html = fs.readFileSync(out, "utf-8");
            const { document } = parseHTML(html);

            // Vérifie le squelette statique
            expect(document.querySelector("html")).not.toBeNull();
            expect(document.querySelector("head")).not.toBeNull();
            expect(document.querySelector("body")).not.toBeNull();

            // Le script existe
            expect(document.querySelector("script")).not.toBeNull();

            // La zone où la grille sera insérée existe bien
            expect(document.querySelector("#grid")).not.toBeNull();

            // On vérifie aussi que le CSS externe est bien référencé
            expect(
                document.querySelector('link[rel="stylesheet"]')
            ).not.toBeNull();
        }
    );

});
