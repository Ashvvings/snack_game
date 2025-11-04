import type { Model } from 'fourch-lang-language';
import { expandToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import { extractDestinationAndName } from './util.js';

export function generateOutput(model: Model, source: string, destination: string): string {
    const data = extractDestinationAndName(destination);

    // Edition
    const fileNode = expandToNode`

        Testing ${source} generation.
        player name is ${model.player.map(player => player.name).join(', ')}
        grid size is ${model.grid.map(g => g.x)} x ${model.grid.map(g => g.y)}
    `.appendNewLineIfNotEmpty();
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(destination, toString(fileNode));
    return destination;
}
