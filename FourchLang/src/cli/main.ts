import { Command } from 'commander';
import { generateCommandHandler } from './commands/generate.js';
import type { FourchGenerateOptions } from './options.js';
import * as fs from 'node:fs';

export default function cli(): void {
    const program = new Command();

    program
        .name("fourch")
        .description("FourchLang CLI")
        .version("0.1.0");

    // ---------------------------------------------------------
    //   COMMANDE 1 — generate (améliorée)
    // ---------------------------------------------------------
    program
        .command("generate")
        .argument("<source>", "Path to .fl file")
        .argument("<destinationOrOut>", "Output file OR directory")
        .option("--target <target>", "ascii | html | playable", "ascii")
        .option("--ai <ai>", "random | greedy | minimax:2")
        .option("--seed <seed>", "Seed integer", v => parseInt(v, 10))
        .option("--headless", "Run without UI", false)
        .option("--playable", "Generate also a playable version", false)
        .description("Generate output using the selected backend.")
        .action(async (source, destinationOrOut, opts) => {
            try {
                await generateCommandHandler(
                    source,
                    destinationOrOut,
                    opts as Partial<FourchGenerateOptions>
                );
                console.log(`✔ Generated (${opts.target}${opts.playable ? " + playable" : ""})`);
            } catch (err) {
                console.error("❌ Generation failed:", err);
                process.exit(1);
            }
        });

    // ---------------------------------------------------------
    //   COMMANDE 2 — auto (reste inchangée)
    // ---------------------------------------------------------
    program
        .command("auto")
        .requiredOption("--variant <number>", "Variant number (1–5)")
        .requiredOption("--backend <backend>", "ascii | html | json")
        .option("--playable", "Generate the playable version", false)
        .description("Auto-generate code from `examples/variant-X`.")
        .action(async (opts) => {

            const variant = Number(opts.variant);
            const backend = opts.backend.toLowerCase();

            if (!Number.isInteger(variant) || variant < 1 || variant > 5) {
                console.error("❌ Variant must be an integer between 1 and 5.");
                process.exit(1);
            }

            const base = `examples/variant-${variant}`;
            const source = `${base}/program.fl`;

            if (!fs.existsSync(source)) {
                console.error(`❌ Missing file: ${source}`);
                process.exit(1);
            }

            const outputDir = `${base}/${backend}`;
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const extension = backend === "ascii"
                ? "txt"
                : backend === "html"
                    ? "html"
                    : "json";

            const destination = `${outputDir}/output.${extension}`;

            try {
                await generateCommandHandler(
                    source,
                    destination,
                    { target: backend, playable: opts.playable }
                );
                console.log(`✔ Auto-generated (${backend}) → ${destination}`);
            } catch (err) {
                console.error("❌ Automatic generation failed:", err);
                process.exit(1);
            }
        });

    // ---------------------------------------------------------
    //   COMMANDE 3 — generate:all
    // ---------------------------------------------------------
    program
        .command("auto:all")
        .requiredOption("--backend <backend>", "ascii | html | json | playable")
        .option("--playable", "Generate playable version", false)
        .description("Generate all variants (1–5).")
        .action(async (opts) => {
            const backend = opts.backend.toLowerCase();
            const playable = !!opts.playable;

            for (let variant = 1; variant <= 5; variant++) {
                const base = `examples/variant-${variant}`;
                const source = `${base}/program.fl`;

                if (!fs.existsSync(source)) {
                    console.error(`❌ Missing file: ${source}`);
                    continue;
                }

                const outputDir = `${base}/${backend}`;
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const extension =
                    backend === "ascii" ? "txt" :
                        backend === "html" ? "html" :
                            backend === "json" ? "json" :
                                "html"; // playable = html

                const destination = `${outputDir}/output.${extension}`;

                try {
                    await generateCommandHandler(
                        source,
                        destination,
                        { target: backend, playable }
                    );
                    console.log(`✔ Variant ${variant} generated (${backend}) → ${destination}`);
                } catch (err) {
                    console.error(`❌ Variant ${variant} failed:`, err);
                }
            }
        });

    program.parse(process.argv);
}

cli();
