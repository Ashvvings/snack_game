import type { Model } from "../../../language/index.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function generatePlayableHtml(model: Model, destination: string) {
    const gridModel = model.grid?.[0];
    if (!gridModel) {
        throw new Error("No grid defined in model.");
    }

    const width = Number(model.grid[0].x);
    const height = Number(model.grid[0].y);


    const player = model.player?.[0];
    if (!player) {
        throw new Error("Exactly one player is required (none found).");
    }

    const playerColor = player.color ?? "green";

    // Border rules
    const borderRules = model.borderRules ?? [];
    const horizontalCrossable = borderRules.some(br => br.direction === 'horizontally');
    const verticalCrossable = borderRules.some(br => br.direction === 'vertically');

    // Fruit configuration
    const fruitConfigNode = model.fruitConfig?.[0];
    const fruitConfig = {
        reappear: !!fruitConfigNode?.reappear,
        seconds: fruitConfigNode?.seconds
            ? Number(fruitConfigNode.seconds)
            : undefined,
        growthBy: fruitConfigNode?.growthLength
            ? Number(fruitConfigNode.growthLength)
            : 0
    };

    // Game over conditions
    const gameOverConditions = model.game_over_conditions ?? [];
    const gameOver = {
        hitSnakeBody: gameOverConditions.some(c => c.target === 'snake_body'),
        hitEnemy: gameOverConditions.some(c => c.target === 'enemy'),
        hitBorder: gameOverConditions.some(c => c.target === 'border'),
        hitWall: gameOverConditions.some(c => c.target === 'wall')
    };

    // Sérialisation des entités
    const config = {
        width,
        height,
        player: {
            x: Number(player.x),
            y: Number(player.y),
            color: playerColor
        },
        snakeBodies: (model.snakeBodies ?? []).map(sb => ({
            x: Number(sb.x),
            y: Number(sb.y),
            name: sb.name ?? null
        })),
        enemies: (model.enemies ?? []).map(e => ({
            x: Number(e.x),
            y: Number(e.y),
            len: e.len ? Number(e.len) : 1,
            speed: e.speed ? Number(e.speed) : 1
        })),
        enemyBodies: (model.enemyBodies ?? []).map(eb => ({
            x: Number(eb.x),
            y: Number(eb.y),
            name: eb.name ?? null
        })),
        walls: (model.walls ?? []).map(w => ({
            x: Number(w.x),
            y: Number(w.y)
        })),
        fruits: (model.fruits ?? []).map(f => ({
            x: Number(f.x),
            y: Number(f.y),
            points: Number(f.points)
        })),
        border: {
            horizontalCrossable,
            verticalCrossable
        },
        fruitConfig,
        gameOver
    };

    // 1. Charger le template dynamique
    const templatePath = path.resolve("src/backends/playable/html/template.html");
    let template = fs.readFileSync(templatePath, "utf-8");

    // 2. Remplacer les placeholders
    template = template
        .replace(/__PLAYER_COLOR__/g, playerColor)
        .replace(/__CONFIG_JSON__/g, JSON.stringify(config, null, 2));

    // 3. Copier le CSS à côté du HTML (comme ton generator-html)
    const destFolder = path.dirname(destination);
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
    }

    const cssSource = path.join(__dirname, "assets", "style.css");
    const cssDestDir = path.join(destFolder, "assets");
    const cssDest = path.join(cssDestDir, "style.css");

    if (!fs.existsSync(cssDestDir)) {
        fs.mkdirSync(cssDestDir, { recursive: true });
    }

    fs.copyFileSync(cssSource, cssDest);

    const iaSource = path.join(__dirname, "assets", "ia");
    const iaDestDir = path.join(destFolder, "assets", "ia");

    // Copier récursivement
    fs.cpSync(iaSource, iaDestDir, { recursive: true });

    // 4. Écrire l’HTML final
    fs.writeFileSync(destination, template);

    return destination;
}
