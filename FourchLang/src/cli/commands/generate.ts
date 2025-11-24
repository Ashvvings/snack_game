import { runGeneration } from "../generator.js";
import { simulateStep } from "../../runtime/headless/simulateStep.js";
import { FourchGenerateOptions } from "../options.js";

export async function generateCommandHandler(
    source: string,
    destinationOrOut: string,
    opts: Partial<FourchGenerateOptions>
) {
    const backend = opts.target ?? "ascii";

    const generated = await runGeneration(source, destinationOrOut, backend);

    if (backend === "playable") {
        if (opts.headless) {
            await simulateStep({
                outDir: destinationOrOut,
                aiSpec: opts.ai ?? "random",
                seed: opts.seed ?? 42
            });
        }
    }

    return generated;
}
