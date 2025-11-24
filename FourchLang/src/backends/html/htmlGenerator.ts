import type { Model } from "../../language/index.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function generateHtml(model: Model, destination: string) {

    const width = Number(model.grid[0].y);
    const height = Number(model.grid[0].x);

    // grid[y][x]
    const grid = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ".")
    );

    const place = (x: number, y: number, char: string) => {
        if (y >= 0 && y < height && x >= 0 && x < width) {
            grid[y][x] = char;
        }
    };

    // Remplir la grille
    place(Number(model.player[0].x), Number(model.player[0].y), "O");
    model.snakeBodies.forEach(sb => place(Number(sb.x), Number(sb.y), "S"));
    model.enemies.forEach(e => place(Number(e.x), Number(e.y), "M"));
    model.enemyBodies.forEach(eb => place(Number(eb.x), Number(eb.y), "X"));
    model.fruits.forEach(f => place(Number(f.x), Number(f.y), "F"));
    model.walls.forEach(w => place(Number(w.x), Number(w.y), "W"));

    const playerColor = model.player[0].color ?? "green";

    // -------------------------------
    // 1. Charger le template HTML
    // -------------------------------
    // On lit directement depuis src, ce qui marche même après build,
    // car path.resolve(...) part du cwd (le dossier FourchLang/).
    const templatePath = path.resolve("src/backends/html/template.html");
    let template = fs.readFileSync(templatePath, "utf-8");

    // -------------------------------
    // 2. Remplacer les placeholders
    // -------------------------------
    function formatGridInline(grid: string[][]): string {
        return "[\n" +
            grid
                .map(row => "  [" + row.map(c => JSON.stringify(c)).join(", ") + "]")
                .join(",\n") +
            "\n]";
    }

    template = template
        .replace(/__PLAYER_COLOR__/g, playerColor)
        .replace(/__WIDTH__/g, width.toString())
        .replace(/__HEIGHT__/g, height.toString())
        .replace(/__GRID_JSON__/g, formatGridInline(grid));

    // -------------------------------
    // 3. Copier le CSS à côté du HTML
    // -------------------------------
    const destFolder = path.dirname(destination);
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
    }

    // cssSource = dist/backends/html/assets/style.css
    // (copié par le script "copy:assets" de ton package.json)
    const cssSource = path.join(__dirname, "assets", "style.css");

    const cssDestDir = path.join(destFolder, "assets");
    const cssDest = path.join(cssDestDir, "style.css");

    if (!fs.existsSync(cssDestDir)) {
        fs.mkdirSync(cssDestDir, { recursive: true });
    }

    fs.copyFileSync(cssSource, cssDest);

    // -------------------------------
    // 4. Écrire l’HTML final
    // -------------------------------
    fs.writeFileSync(destination, template);

    return destination;
}
