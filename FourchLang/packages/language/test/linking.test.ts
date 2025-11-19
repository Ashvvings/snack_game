import { describe, it, beforeAll, afterEach, expect } from "vitest";
import { parseHelper, clearDocuments } from "langium/test";
import { EmptyFileSystem } from "langium";
import { createFourchLangServices } from "../src/fourch-lang-module.js";
import type { Model, SnakeBody, EnemyBody } from "../src/generated/ast.js";
import type { LangiumDocument } from "langium";

let services: ReturnType<typeof createFourchLangServices>;
let parse: ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(() => {
    services = createFourchLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.FourchLang);
});

afterEach(() => {
    if (document) clearDocuments(services.shared, [document]);
});

describe("Linking tests", () => {

    // ------------------------------------------------------------
    // 1. Linking SnakeBody → Player
    // ------------------------------------------------------------
    it("links snake body to its player", async () => {

        const program = `
            grid size 3*4
            player blob at (1,3)
            snake body b1 at (1,2) following blob
        `;

        document = await parse(program, { validation: true });
        const model = document.parseResult.value;

        const snakeBody = model.snakeBodies?.[0] as SnakeBody;
        expect(snakeBody.parent?.ref).toBeDefined();
        expect(snakeBody.parent?.ref?.name).toBe("blob");
    });

    // ------------------------------------------------------------
    // 2. Linking SnakeBody → SnakeBody (chain)
    // ------------------------------------------------------------
    it("links a chain of snake bodies", async () => {

        const program = `
            grid size 5*5
            player p at (2,2)
            snake body b1 at (2,3) following p
            snake body b2 at (2,4) following b1
        `;

        document = await parse(program, { validation: true });
        const model = document.parseResult.value;

        const b1 = model.snakeBodies?.find(b => b.name === "b1")!;
        const b2 = model.snakeBodies?.find(b => b.name === "b2")!;

        expect(b1.parent?.ref?.name).toBe("p");
        expect(b2.parent?.ref?.name).toBe("b1");
    });

    // ------------------------------------------------------------
    // 3. Broken reference for SnakeBody
    // ------------------------------------------------------------
    it("reports error for snake body following unknown identifier", async () => {
        const program = `
            grid size 3*4
            player blob at (1,3)
            snake body b1 at (1,2) following DOES_NOT_EXIST
        `;

        document = await parse(program, { validation: true });
        const diagnostics = document.diagnostics ?? [];

        const brokenLinks = diagnostics.filter(d =>
            d.message.includes("DOES_NOT_EXIST")
        );

        expect(brokenLinks.length).toBeGreaterThan(0);
    });

    // ------------------------------------------------------------
    // 4. Linking EnemyBody → Enemy
    // ------------------------------------------------------------
    it("links enemy body to enemy", async () => {

        const program = `
            grid size 5*5
            enemy e at (1,1)
            enemy body eb1 at (1,2) following e
        `;

        document = await parse(program, { validation: true });
        const model = document.parseResult.value;

        const eb1 = model.enemyBodies?.[0] as EnemyBody;

        expect(eb1.parent?.ref).toBeDefined();
        expect(eb1.parent?.ref?.x).toBe("1");
        expect(eb1.parent?.ref?.y).toBe("1");
    });

    // ------------------------------------------------------------
    // 5. Linking EnemyBody → EnemyBody (chain)
    // ------------------------------------------------------------
    it("links a chain of enemy bodies", async () => {

        const program = `
            grid size 5*5
            enemy e at (1,1)
            enemy body eb1 at (1,2) following e
            enemy body eb2 at (1,3) following eb1
        `;

        document = await parse(program, { validation: true });
        const model = document.parseResult.value;

        const eb1 = model.enemyBodies?.find(b => b.name === "eb1")!;
        const eb2 = model.enemyBodies?.find(b => b.name === "eb2")!;

        expect(eb1.parent?.ref?.name).toBe("e");
        expect(eb2.parent?.ref?.name).toBe("eb1");
    });

    // ------------------------------------------------------------
    // 6. Broken reference for EnemyBody
    // ------------------------------------------------------------
    it("reports error for enemy body following unknown identifier", async () => {
        const program = `
            grid size 3*3
            enemy ghost at (1,1)
            enemy body eb1 at (1,2) following ???UNKNOWN???
        `;

        document = await parse(program, { validation: true });
        const diagnostics = document.diagnostics ?? [];

        const brokenLinks = diagnostics.filter(d =>
            d.message.includes("UNKNOWN")
        );

        expect(brokenLinks.length).toBeGreaterThan(0);
    });

    // ------------------------------------------------------------
    // 7. Invalid cross-link: EnemyBody following Player (should fail)
    // ------------------------------------------------------------
    it("reports error if EnemyBody follows a Player", async () => {

        const program = `
            grid size 4*4
            player p at (1,1)
            enemy body eb1 at (1,2) following p
        `;

        document = await parse(program, { validation: true });
        const diagnostics = document.diagnostics ?? [];

        const err = diagnostics.some(d =>
            d.message.includes("player") || d.message.includes("p")
        );

        expect(err).toBe(true);
    });
});
