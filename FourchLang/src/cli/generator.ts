import type { Model } from "../language/index.js";
import { createFourchLangServices } from "../language/index.js";
import { NodeFileSystem } from "langium/node";
import { extractAstNode } from "./util.js";

import { generateAscii } from "../backends/ascii/asciiGenerator.js";
import { generateHtml } from "../backends/html/htmlGenerator.js";
import { generateJson } from "../backends/json/jsonGenerator.js";
import { generatePlayableHtml } from "../backends/playable/playableGenerator.js";

export async function runGeneration(
    source: string,
    destination: string,
    backend: string
): Promise<string> {

    const normalized = backend.toLowerCase().trim();

    const services = createFourchLangServices(NodeFileSystem).FourchLang;

    const model = await extractAstNode<Model>(source, services);

    switch (normalized) {

        case "ascii":
        case "ascii.txt":
            return generateAscii(model, destination);

        case "html":
        case "html-file":
            return generateHtml(model, destination);

        case "json":
        case "json-file":
        case "jsonfile":
            return generateJson(model, destination);

        case "playable":
        case "playable-json":
            return generatePlayableHtml(model, destination);

        default:
            throw new Error(
                `Unknown backend "${backend}". Expected: ascii | html | json.`
            );
    }
}