import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import { LangiumDocument, EmptyFileSystem, URI } from "langium";
import { parseHelper } from "langium/test";
import { createFourchLangServices } from "../src/fourch-lang-module.js";
import type { Model } from "../src/generated/ast.js";

let services: ReturnType<typeof createFourchLangServices>;
let parse: ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createFourchLangServices(EmptyFileSystem);
    const doParse = parseHelper<Model>(services.FourchLang);
    parse = (input: string) => doParse(input, { validation: true });

    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]); // Optional
});

describe("FourchLang validation", () => {

    const examplesRoot = path.join(__dirname, "../../../../examples");

    const allFlFiles = fsSync.readdirSync(examplesRoot, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .flatMap(dirent => {
            const folder = path.join(examplesRoot, dirent.name);
            return fsSync.readdirSync(folder)
                .filter(f => f.endsWith(".fl"))
                .map(f => path.join(folder, f));
        });

    // ------------------------------------------------------------------
    // 1. All example programs should parse & validate without errors
    // ------------------------------------------------------------------
    it.each(allFlFiles)(
        "Variant %s should parse & validate without errors",
        async (filePath) => {
            const text = await fs.readFile(filePath, 'utf-8');
            const uri = URI.file(filePath);

            const langiumDoc = services.shared.workspace.LangiumDocuments.createDocument(uri, text);
            await services.shared.workspace.DocumentBuilder.build([langiumDoc], { validation: true });

            document = langiumDoc as LangiumDocument<Model>;

            const diagnostics = document.diagnostics ?? [];
            const errors = diagnostics.filter(d => d.severity === 1);

            expect(errors.length).toBe(0);
        }
    );

    // ------------------------------------------------------------------
    // 2. Fruit configuration validation
    // ------------------------------------------------------------------
    it("should fail to parse 'every X seconds' without 'reappear'", async () => {
        const program = `
        grid size 5*5
        player p at (0,0)
        game over when hitting border
        fruits every 3 seconds
    `;

        const result = await parse(program);
        const parseErrors = result.parseResult?.parserErrors ?? [];

        expect(parseErrors.length).toBeGreaterThan(0);
    });

    it("should allow 'reappear' without seconds", async () => {
        const program = `
        grid size 5*5
        player p at (0,0)
        game over when hitting border
        fruits reappear
        `;

        document = await parse(program);
        const errors = document.diagnostics?.filter(d => d.severity === 1) ?? [];

        console.log("Diagnostics:", document.diagnostics?.map(d => `${d.message} (${d.severity})`));

        expect(errors.length).toBe(0);
    });

    it("should require fruit growth > 0 when specifying 'grow snake by'", async () => {
        const program = `
            grid size 5*5
            fruits grow snake by -3
        `;

        document = await parse(program);
        const errors = document.diagnostics?.filter(d => d.severity === 1) ?? [];

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e =>
            e.message.includes("growth")
        )).toBe(true);
    });

    // ------------------------------------------------------------------
    // 3. Grid validation
    // ------------------------------------------------------------------
    it("should reject negative grid dimensions", async () => {
        const program = `
            grid size -5*10
        `;

        document = await parse(program);
        const errors = document.diagnostics?.filter(d => d.severity === 1) ?? [];

        expect(errors.length).toBeGreaterThan(0);
    });

    it("should reject a zero grid dimension", async () => {
        const program = `
            grid size 0*10
        `;

        document = await parse(program);
        const errors = document.diagnostics?.filter(d => d.severity === 1) ?? [];

        expect(errors.length).toBeGreaterThan(0);
    });

    // ------------------------------------------------------------------
    // 4. Coordinate validation
    // ------------------------------------------------------------------
    it("should reject negative coordinates", async () => {
        const program = `
            grid size 10*10
            player p at (-1, 5)
        `;

        document = await parse(program);
        const errors = document.diagnostics?.filter(d => d.severity === 1) ?? [];

        expect(errors.length).toBeGreaterThan(0);
    });

    // ------------------------------------------------------------------
    // 5. Linking correctness: following reference must exist
    // ------------------------------------------------------------------
    it("should report error when snake body follows unknown element", async () => {
        const program = `
            grid size 5*5
            snake body b1 at (1,1) following DOES_NOT_EXIST
        `;

        document = await parse(program);
        const errors = document.diagnostics?.filter(d => d.severity === 1) ?? [];

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e =>
            e.message.includes("DOES_NOT_EXIST")
        )).toBe(true);
    });

    // ------------------------------------------------------------------
    // 6. Game-over conditional rules
    // ------------------------------------------------------------------
    it("should warn when walls exist but no 'game over when hitting wall'", async () => {
        const program = `
            grid size 5*5
            wall at (1,1)
        `;

        document = await parse(program);
        const warnings = document.diagnostics?.filter(d => d.severity === 2) ?? [];

        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings.some(w =>
            w.message.includes("Walls are defined")
        )).toBe(true);
    });

});
