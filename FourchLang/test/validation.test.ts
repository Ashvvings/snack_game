import { describe, it, expect, beforeAll } from "vitest";
import {
    loadExampleFiles,
    parseFromText,
    parseFromFile,
    createTestServices
} from "./util.js";

let services: any;

beforeAll(() => {
    services = createTestServices();
});

describe("validation", () => {

    // ============================================================
    // 1. EXAMPLES SHOULD PARSE & VALIDATE (no syntax or semantic errors)
    // ============================================================
    const exampleFiles = loadExampleFiles();
    const validExamples = exampleFiles.filter(f => !f.includes('invalid-variant'));

    it.each(validExamples)(
        "Example %s should parse & validate without errors",
        async (filePath) => {
            const document = await parseFromFile(filePath);
            const errors = (document.diagnostics ?? []).filter(d => d.severity === 1);
            expect(errors.length).toBe(0);
        }
    );

    // ============================================================
    // 2. FRUIT CONFIGURATION VALIDATION RULES
    // ============================================================

    it("should fail when using 'every X seconds' without 'reappear'", async () => {
        const program = `
            grid size 5*5
            player p at (0,0)
            game over when hitting border
            fruits every 3 seconds
        `;
        const doc = await parseFromText(program);
        const parserErrors = doc.parseResult?.parserErrors ?? [];
        expect(parserErrors.length).toBeGreaterThan(0);
    });

    it("'fruits reappear' should be allowed without seconds", async () => {
        const program = `
            grid size 5*5
            player p at (0,0)
            game over when hitting border
            fruits reappear
        `;
        const doc = await parseFromText(program);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBe(0);
    });

    it("'grow snake by' must be > 0", async () => {
        const program = `
            grid size 5*5
            fruits grow snake by -3
        `;
        const doc = await parseFromText(program);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.message.toLowerCase().includes("growth"))).toBe(true);
    });

    // ============================================================
    // 3. GRID DIMENSION VALIDATION
    // ============================================================

    it("rejects negative grid dimensions", async () => {
        const doc = await parseFromText(`grid size -5*10`);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBeGreaterThan(0);
    });

    it("rejects zero grid dimensions", async () => {
        const doc = await parseFromText(`grid size 0*10`);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBeGreaterThan(0);
    });

    it("accepts large grid sizes", async () => {
        const doc = await parseFromText(`
            grid size 100*200
            player p at (0,0)
        `);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBe(0);
    });

    // ============================================================
    // 4. COORDINATE VALIDATION
    // ============================================================

    it("rejects negative coordinates", async () => {
        const program = `
            grid size 10*10
            player p at (-1, 5)
        `;
        const doc = await parseFromText(program);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBeGreaterThan(0);
    });

    it("rejects coordinates outside the grid", async () => {
        const program = `
            grid size 5*5
            player p at (99, 0)
        `;
        const doc = await parseFromText(program);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBeGreaterThan(0);
    });

    // ============================================================
    // 5. LINKING VALIDATION (references must exist)
    // ============================================================

    it("reports error when snake body follows an unknown element", async () => {
        const program = `
            grid size 5*5
            snake body b1 at (1,1) following DOES_NOT_EXIST
        `;
        const doc = await parseFromText(program);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.message.includes("DOES_NOT_EXIST"))).toBe(true);
    });

    it("accepts valid following references", async () => {
        const program = `
            grid size 5*5
            player p at (1,1)
            snake body b1 at (1,2) following p
        `;
        const doc = await parseFromText(program);
        const errors = doc.diagnostics?.filter(d => d.severity === 1) ?? [];
        expect(errors.length).toBe(0);
    });

    // ============================================================
    // 6. GAME-OVER CONDITIONAL RULES
    // ============================================================

    it("warns when walls exist but no 'game over when hitting wall'", async () => {
        const program = `
            grid size 5*5
            wall at (1,1)
        `;
        const doc = await parseFromText(program);
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings.some(w => w.message.includes("Walls are defined"))).toBe(true);
    });

    it("no warnings when walls + appropriate game-over rule", async () => {
        const program = `
            grid size 5*5
            wall at (1,1)
            game over when hitting wall
        `;
        const doc = await parseFromText(program);
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.length).toBe(0);
    });

    // ============================================================
    // 7. BONUS: SYNTAX ERROR DETECTION
    // ============================================================

    it("fails when unexpected tokens appear", async () => {
        const program = `
            grid size 5*5
            player p at (1,1)
            $$$ BAD ### !!! 
        `;
        const doc = await parseFromText(program);
        expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    it("fails on incomplete statements", async () => {
        const doc = await parseFromText(`
            grid size 5*
        `);
        expect(doc.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

});
