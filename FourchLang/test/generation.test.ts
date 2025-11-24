import { describe, it, expect, beforeAll } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs";

import { loadExampleFiles } from "./util.js";
import { runGeneration } from "../src/cli/generator.js";

const OUTPUT = path.resolve(__dirname, "../.test-output");

beforeAll(() => {
    fs.mkdirSync(OUTPUT, { recursive: true });
});

const examples = loadExampleFiles();
const validExamples = examples.filter(f => !f.includes("invalid-variant"));
const invalidExamples = examples.filter(f => f.includes("invalid-variant"));

describe("generation", () => {

    // ================================================================
    // ASCII
    // ================================================================
    it.each(validExamples)(
        "Generate ASCII for %s",
        async (filePath) => {
            const dest = path.join(OUTPUT, path.basename(filePath) + ".txt");
            const out = await runGeneration(filePath, dest, "ascii");

            expect(fs.existsSync(out)).toBe(true);

            const content = fs.readFileSync(out, "utf-8");

            // Vérification conforme : fichier non vide + présence d’un caractère de grille
            expect(content.trim().length).toBeGreaterThan(5);
            expect(/[A-Za-z0-9#\.]/.test(content)).toBe(true);
        }
    );

    // ================================================================
    // HTML
    // ================================================================
    it.each(validExamples)(
        "Generate HTML for %s",
        async (filePath) => {
            const dest = path.join(OUTPUT, path.basename(filePath) + ".html");
            const out = await runGeneration(filePath, dest, "html");

            expect(fs.existsSync(out)).toBe(true);

            const html = fs.readFileSync(out, "utf-8");

            // Vérification minimale : fichier non vide
            expect(html.trim().length).toBeGreaterThan(20);

            // 🔍 Vérification des ancres / marqueurs obligatoires
            expect(html).toContain("<pre id=\"grid\">");

            // Vérification que le template a été assemblé
            expect(html).toContain("<script>");
            expect(html).toContain("const grid =");

            // Vérifie que style.css est référencé
            expect(html).toContain("<link rel=\"stylesheet\" href=\"./assets/style.css\">");

            // Vérifie que les classes du rendu existent
            expect(
                html.includes("player") ||
                html.includes("snake-body") ||
                html.includes("enemy") ||
                html.includes("fruit") ||
                html.includes("wall")
            ).toBe(true);
        }
    );

    // ================================================================
    // ASSETS
    // ================================================================
    it("Assets folder exists for HTML generation", () => {
        const assetsPath = path.resolve(__dirname, "../dist/src/backends/html/assets/style.css");
        expect(fs.existsSync(assetsPath)).toBe(true);
    });

    // ================================================================
    // INVALID MODELS DOIT THROW
    // ================================================================
    it.each(invalidExamples)(
        "Invalid program fails generation: %s",
        async (filePath) => {
            const dest = path.join(OUTPUT, path.basename(filePath) + ".error.txt");

            await expect(
                runGeneration(filePath, dest, "ascii")
            ).rejects.toThrow();
        }
    );
});
