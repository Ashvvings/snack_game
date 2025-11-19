import { describe, it, beforeAll, expect } from "vitest";
import { parseHelper } from "langium/test";
import path from "node:path";
import fs from "node:fs";
import { EmptyFileSystem } from "langium";
import { createFourchLangServices } from "../src/fourch-lang-module.js";
import type { Model } from "../src/generated/ast.js";
import type { LangiumDocument } from "langium";

let services: ReturnType<typeof createFourchLangServices>;
let parse: (input: string) => Promise<LangiumDocument<Model>>;

beforeAll(() => {
    services = createFourchLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.FourchLang);
});

describe("Parsing tests", () => {

    // ---------------------------------------------------------------------
    // 1. All example files should parse correctly
    // ---------------------------------------------------------------------
    const examplesRoot = path.join(__dirname, "../../../../examples");

    const allFlFiles = fs.readdirSync(examplesRoot, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .flatMap(dirent => {
            const folder = path.join(examplesRoot, dirent.name);
            return fs.readdirSync(folder)
                .filter(f => f.endsWith(".fl"))
                .map(f => path.join(folder, f));
        });

    it.each(allFlFiles)(
        "Example file %s should parse without syntax errors",
        async (filePath) => {

            const text = fs.readFileSync(filePath, "utf-8");
            const document = await parse(text);

            const syntacticErrors = document.parseResult.parserErrors ?? [];
            expect(syntacticErrors.length).toBe(0);
        }
    );

    // ---------------------------------------------------------------------
    // 2. NEGATIVE TESTS — invalid syntax should produce errors
    // ---------------------------------------------------------------------

    it("should fail when 'grid size' is malformed", async () => {
        const program = `
            grid size WRONG_SYNTAX
        `;

        const document = await parse(program);
        const errors = document.parseResult.parserErrors;

        expect(errors.length).toBeGreaterThan(0);
    });

    it("should fail when player declaration is incomplete", async () => {
        const program = `
            grid size 5*5
            player blob (1,2)   // missing 'at'
        `;

        const document = await parse(program);
        const errors = document.parseResult.parserErrors;

        expect(errors.length).toBeGreaterThan(0);
    });

    it("should fail when coordinates are malformed", async () => {
        const program = `
            grid size 5*5
            player p at 1,2     // missing parentheses
        `;

        const document = await parse(program);
        const errors = document.parseResult.parserErrors;

        expect(errors.length).toBeGreaterThan(0);
    });

    it("should fail when unexpected token appears", async () => {
        const program = `
            grid size 3*3
            player p at (1,1)
            $$$ invalid ###
        `;

        const document = await parse(program);
        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

});