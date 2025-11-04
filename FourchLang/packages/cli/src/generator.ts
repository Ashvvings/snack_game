import type { Model } from 'fourch-lang-language';
import { expandToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import { extractDestinationAndName } from './util.js';
import ansiStyles from 'ansi-styles';

export function generateOutput(model: Model, source: string, destination: string): string {
    const data = extractDestinationAndName(destination);

    let enemies : string[] = model.enemies.map(e => 
        "("+e.x+","+e.y+")");
    let enemyBodies : string[] = model.enemyBodies.map(e => 
        "("+e.x+","+e.y+")");
    let snakeBodyParts : string[] = model.snakeBodies.map(s => 
        "("+s.x+","+s.y+")");
    let fruits : string[] = model.fruits.map(f => 
        "("+f.x+","+f.y+")");
    let walls : string[] = model.walls.map(w => 
        "("+w.x+","+w.y+")");

    let grid = "";
    let consoleGrid = "";
    for (let s = 0; s < +model.grid.map(g => g.x)[0] + 2; s++) { grid += "# "; consoleGrid += `${ansiStyles.white.open}# ${ansiStyles.white.close}`; }
    grid += "\n"; consoleGrid += "\n";
    for (let i = 0; i < +model.grid.map(g => g.y)[0]; i++) {
        grid += "# "; consoleGrid += `${ansiStyles.white.open}# ${ansiStyles.white.close}`;
        for (let j = 0; j < +model.grid.map(g => g.x)[0]; j++) {
            if (+model.player.map(p => p.x)[0] == j && +model.player.map(p => p.y)[0] == i) {
                grid += "A "; consoleGrid += `${ansiStyles.green.open}A ${ansiStyles.green.close}`;
            } else if (snakeBodyParts.includes("("+j+","+i+")")) {
                grid += "S "; consoleGrid += `${ansiStyles.green.open}S ${ansiStyles.green.close}`;
            } else if (enemies.includes("("+j+","+i+")")) {
                grid += "M "; consoleGrid += `${ansiStyles.red.open}M ${ansiStyles.red.close}`;
            } else if (enemyBodies.includes("("+j+","+i+")")) {
                grid += "X "; consoleGrid += `${ansiStyles.red.open}X ${ansiStyles.red.close}`;
            } else if (fruits.includes("("+j+","+i+")")) {
                grid += "F "; consoleGrid += `${ansiStyles.yellow.open}F ${ansiStyles.yellow.close}`;
            } else if (walls.includes("("+j+","+i+")")) {
                grid += "# "; consoleGrid += `${ansiStyles.white.open}# ${ansiStyles.white.close}`;
            } else {
                grid += ". "; consoleGrid += `${ansiStyles.blue.open}. ${ansiStyles.blue.close}`;
            }
        }
        grid += "#\n"; consoleGrid += `${ansiStyles.white.open}#${ansiStyles.white.close}\n`;
    }
    for (let s = 0; s < +model.grid.map(g => g.x)[0] + 2; s++) { grid += "# "; consoleGrid += `${ansiStyles.white.open}# ${ansiStyles.white.close}`; }

    // Edition
    const fileNode = expandToNode`
        ${grid}
    `.appendNewLineIfNotEmpty();
    console.log(consoleGrid);
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(destination, toString(fileNode));
    return destination;
}
