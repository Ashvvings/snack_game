import path from "node:path";
import fs from "node:fs";
import type { FourchGenerateOptions } from "../options.js";
import { runGeneration } from "../generator.js";

/**
 * Command handler for:
 *   fourch generate <source> <destination> [options]
 *
 * This file:
 *  - loads the model
 *  - calls the correct backend
 *  - handles the optional "--playable" flag
 */
export async function generateCommandHandler(
    source: string,
    destinationOrOut: string,
    options: Partial<FourchGenerateOptions>
): Promise<void> {

    const target = options.target?.toLowerCase() ?? "ascii";
    const playableFlag = options.playable === true;

    // ---------------------------------------------------------
    // Destination resolution
    // ---------------------------------------------------------
    let destination = destinationOrOut;

    const isDirectory =
        fs.existsSync(destinationOrOut) &&
        fs.lstatSync(destinationOrOut).isDirectory();

    // If destination is a directory, construct filename automatically
    if (isDirectory) {
        let ext = "txt";
        if (target === "html") ext = "html";
        if (target === "json") ext = "json";
        if (target === "playable") ext = "html"; // playable always produces HTML

        destination = path.join(destinationOrOut, `output.${ext}`);
    }

    // ---------------------------------------------------------
    // Run generation
    // (This now returns multiple outputs: main backend + playable)
    // ---------------------------------------------------------

    const outputs = await runGeneration(
        source,
        destination,
        target,
        playableFlag
    );

    // ---------------------------------------------------------
    // Display results
    // ---------------------------------------------------------

    console.log("✔ Generation complete:");
    for (const out of outputs) {
        console.log("   →", out);
    }
}
