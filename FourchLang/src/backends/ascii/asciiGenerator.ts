import type { Model } from "../../language/index.js";
import * as fs from "node:fs";
import * as path from "node:path";
import ansiStyles from "ansi-styles";

export function generateAscii(model: Model, destination: string): string {
    // Création du dossier cible si besoin
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // --- Récup des données du modèle (comme avant) ---
    const enemies = model.enemies.map(e => `(${e.x},${e.y})`);
    const enemyBodies = model.enemyBodies.map(e => `(${e.x},${e.y})`);
    const snakeBodyParts = model.snakeBodies.map(s => `(${s.x},${s.y})`);
    const fruits = model.fruits.map(f => `(${f.x},${f.y})`);
    const walls = model.walls.map(w => `(${w.x},${w.y})`);

    const usingColor = (color: string, text: string): string => {
        switch (color) {
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

    const width = Number(model.grid[0].x);
    const height = Number(model.grid[0].y);

    // Bordure du haut
    for (let s = 0; s < width + 2; s++) {
        grid += " # ";
        consoleGrid += `${ansiStyles.white.open} # ${ansiStyles.white.close}`;
    }
    grid += "\n";
    consoleGrid += "\n";

    for (let i = 0; i < height; i++) {
        grid += " # ";
        consoleGrid += `${ansiStyles.white.open} # ${ansiStyles.white.close}`;

        for (let j = 0; j < width; j++) {
            const coord = `(${j},${i})`;

            if (+model.player[0].x === j && +model.player[0].y === i) {
                grid += " O ";
                consoleGrid += usingColor(model.player[0].color ?? "", " O ");
            } else if (snakeBodyParts.includes(coord)) {
                grid += " S ";
                consoleGrid += usingColor(model.player[0].color ?? "", " S ");
            } else if (enemies.includes(coord)) {
                grid += " M ";
                consoleGrid += `${ansiStyles.red.open} M ${ansiStyles.red.close}`;
            } else if (enemyBodies.includes(coord)) {
                grid += " X ";
                consoleGrid += `${ansiStyles.red.open} X ${ansiStyles.red.close}`;
            } else if (fruits.includes(coord)) {
                grid += " F ";
                consoleGrid += `${ansiStyles.magenta.open} F ${ansiStyles.magenta.close}`;
            } else if (walls.includes(coord)) {
                grid += " █ ";
                consoleGrid += `${ansiStyles.gray.open} █ ${ansiStyles.gray.close}`;
            } else {
                grid += " . ";
                consoleGrid += `${ansiStyles.blue.open} . ${ansiStyles.blue.close}`;
            }
        }

        grid += " # \n";
        consoleGrid += `${ansiStyles.white.open} # ${ansiStyles.white.close}\n`;
    }

    // Bordure du bas
    for (let s = 0; s < width + 2; s++) {
        grid += " # ";
        consoleGrid += `${ansiStyles.white.open} # ${ansiStyles.white.close}`;
    }

    // Écriture fichier + affichage console
    fs.writeFileSync(destination, grid, "utf-8");
    console.log(consoleGrid);

    return destination;
}
