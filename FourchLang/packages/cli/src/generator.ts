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
    
    let using_color = (color:string, text:string) =>{
        switch(color) {
            case "white":   return `${ansiStyles.white.open}${text}${ansiStyles.white.close}`;
            case "green":   return `${ansiStyles.green.open}${text}${ansiStyles.green.close}`;
            case "red":     return `${ansiStyles.red.open}${text}${ansiStyles.red.close}`;
            case "yellow":  return `${ansiStyles.yellow.open}${text}${ansiStyles.yellow.close}`;
            case "blue":    return `${ansiStyles.blue.open}${text}${ansiStyles.blue.close}`;
            case "black":   return `${ansiStyles.black.open}${text}${ansiStyles.black.close}`;
            case "gray":    return `${ansiStyles.gray.open}${text}${ansiStyles.gray.close}`;
            case "cyan":    return `${ansiStyles.cyan.open}${text}${ansiStyles.cyan.close}`;
            case "magenta": return `${ansiStyles.magenta.open}${text}${ansiStyles.magenta.close}`;
            default:        return `${ansiStyles.green.open}${text}${ansiStyles.green.close}`;
        }
    };

    let grid = "";
    let consoleGrid = "";
    for (let s = 0; s < +model.grid.map(g => g.y)[0] + 2; s++) { grid += "# "; consoleGrid += `${ansiStyles.white.open}# ${ansiStyles.white.close}`; }
    grid += "\n"; consoleGrid += "\n";
    for (let i = 0; i < +model.grid.map(g => g.x)[0]; i++) {
        grid += "# "; consoleGrid += `${ansiStyles.white.open}# ${ansiStyles.white.close}`;
        for (let j = 0; j < +model.grid.map(g => g.y)[0]; j++) {
            if (+model.player.map(p => p.x)[0] == i && +model.player.map(p => p.y)[0] == j) {
                grid += "◉ "; consoleGrid += using_color((model.player[0].color? model.player[0].color : ""), '◉ ');
            } else if (snakeBodyParts.includes("("+i+","+j+")")) {
                grid += "◎ "; consoleGrid += using_color((model.player[0].color? model.player[0].color : ""), '◎ ');
            } else if (enemies.includes("("+i+","+j+")")) {
                grid += "M "; consoleGrid += `${ansiStyles.red.open}M ${ansiStyles.red.close}`;
            } else if (enemyBodies.includes("("+i+","+j+")")) {
                grid += "X "; consoleGrid += `${ansiStyles.red.open}X ${ansiStyles.red.close}`;
            } else if (fruits.includes("("+i+","+j+")")) {
                grid += "· "; consoleGrid += `${ansiStyles.magenta.open}· ${ansiStyles.magenta.close}`;
            } else if (walls.includes("("+i+","+j+")")) {
                grid += "█ "; consoleGrid += `${ansiStyles.gray.open}█ ${ansiStyles.gray.close}`;
            } else {
                grid += "  "; consoleGrid += `${ansiStyles.blue.open}  ${ansiStyles.blue.close}`;
            }
        }
        grid += "#\n"; consoleGrid += `${ansiStyles.white.open}#${ansiStyles.white.close}\n`;
    }
    for (let s = 0; s < +model.grid.map(g => g.y)[0] + 2; s++) { grid += "# "; consoleGrid += `${ansiStyles.white.open}# ${ansiStyles.white.close}`; }

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
