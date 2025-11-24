import { describe, it, expect } from 'vitest';
import * as path from "node:path";
import * as fs from "node:fs";
import { runGeneration } from '../src/cli/generator.js';

const ORACLE_DIR = path.resolve(__dirname, './oracles');

describe("oracle", () => {

    it("HTML generation matches oracle", async () => {

        const source = path.resolve(__dirname, '../examples/variant-1/program.fl');

        const output = path.resolve(__dirname, '../.test-output/oracle.html');
        fs.mkdirSync(path.dirname(output), { recursive: true });

        const oracle = path.join(ORACLE_DIR, 'minimal-html.html');

        const generatedFile = await runGeneration(source, output, "html");

        const got = fs.readFileSync(generatedFile, 'utf-8');
        const expected = fs.readFileSync(oracle, 'utf-8');

        expect(got.trim()).toBe(expected.trim());
    });

});
