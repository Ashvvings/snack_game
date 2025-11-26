import type { Model } from "../language/index.js";
import { createFourchLangServices } from "../language/index.js";
import { NodeFileSystem } from "langium/node";
import { extractAstNode } from "./util.js";

import { generateAscii } from "../backends/ascii/asciiGenerator.js";
import { generateHtml } from "../backends/html/htmlGenerator.js";
import { generateJson } from "../backends/json/jsonGenerator.js";
import { generatePlayableHtml } from "../backends/playable/html/playableGenerator.js";

export async function runGeneration(
    source: string,
    destination: string,
    backend: string,
    playable?: boolean
): Promise<string[]> {  // 👈 now returns *multiple* outputs

    const outputs: string[] = [];

    const normalized = backend.toLowerCase().trim();

    const services = createFourchLangServices(NodeFileSystem).FourchLang;
    const model = await extractAstNode<Model>(source, services);

    // 1) Backend principal
    let mainOut: string;
    switch (normalized) {
        case "ascii":
        case "ascii.txt":
            mainOut = generateAscii(model, destination);
            break;

        case "html":
        case "html-file":
            mainOut = generateHtml(model, destination);
            break;

        case "json":
        case "json-file":
        case "jsonfile":
            mainOut = generateJson(model, destination);
            break;

        case "playable":
        case "playable-json":
            mainOut = generatePlayableHtml(model, destination);
            break;

        default:
            throw new Error(
                `Unknown backend "${backend}". Expected: ascii | html | json | playable.`
            );
    }

    outputs.push(mainOut);

    if (playable && normalized !== "playable") {
        const playablePath = destination.replace(/\.([a-z]+)$/, "-playable.html");
        const playableFile = generatePlayableHtml(model, playablePath);
        outputs.push(playableFile);
    }

    return outputs;
}