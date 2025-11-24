import type { Model } from "../../language/index.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function generatePlayableHtml(model: Model, destination: string) {

    // --------------------------
    // 0 — Chemin final (index.html)
    // --------------------------
    let finalDestination = destination;

    if (!path.extname(destination)) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }
        finalDestination = path.join(destination, "index.html");
    }

    // --------------------------
    // 1 — Lecture des infos DSL
    // --------------------------
    const width = Number(model.grid[0].y);
    const height = Number(model.grid[0].x);

    const player = model.player[0];
    const playerColor = player.color ?? "green";

    // Fruits
    const fruits = model.fruits.map(f => ({
        x: Number(f.x),
        y: Number(f.y)
    }));

    // Murs
    const walls = model.walls.map(w => ({
        x: Number(w.x),
        y: Number(w.y)
    }));

    // --------------------------
    // 2 — Snake HEAD → TAIL
    // --------------------------
    const snakeSegments: { x: number; y: number }[] = [];
    snakeSegments.push({ x: Number(player.x), y: Number(player.y) });

    let current: any = player;

    while (true) {
        const nextBody = model.snakeBodies.find(sb => sb.parent?.ref === current);
        if (!nextBody) break;
        snakeSegments.push({ x: Number(nextBody.x), y: Number(nextBody.y) });
        current = nextBody;
    }

    // --------------------------
    // 3 — Wrap rules
    // --------------------------
    const wrapX = model.borderRules?.some(b => b.direction === "horizontally") ?? false;
    const wrapY = model.borderRules?.some(b => b.direction === "vertically") ?? false;

    // --------------------------
    // 4 — Fruit growth
    // --------------------------
    const fruitConf = model.fruitConfig?.[0];
    const growthLength = fruitConf?.growthLength
        ? Number(fruitConf.growthLength)
        : 1;

    // --------------------------
    // 5 — Game Over
    // --------------------------
    const targets = (model.game_over_conditions ?? []).map(c => c.target);

    const killSelf   = targets.includes("snake_body");
    const killEnemy  = targets.includes("enemy");
    const killBorder = targets.includes("border");
    const killWall   = targets.includes("wall");

    // --------------------------
    // 6 — Objet PlayableGameInit
    // --------------------------

    const gameInit = {
        config: {
            width,
            height,
            wrapX,
            wrapY,

            growthLength: growthLength,

            fruitRespawn: {
                enabled: !!fruitConf?.reappear,
                onEaten: !!fruitConf?.reappear,
                everySeconds: fruitConf?.seconds ? Number(fruitConf.seconds) : null
            },

            gameOverOn: [
                ...(killSelf ? ["self"] : []),
                ...(killEnemy ? ["enemy"] : []),
                ...(killBorder ? ["border"] : []),
                ...(killWall ? ["wall"] : [])
            ]
        },

        snakes: [
            {
                id: player.name ?? "player",
                isPlayerControlled: true,
                color: playerColor,
                body: snakeSegments
            }
        ],

        walls,
        fruits
    };

    // --------------------------
    // 7 — Charger le template
    // --------------------------
    const templatePath = path.resolve("src/backends/playable/template.html");
    let template = fs.readFileSync(templatePath, "utf-8");

    template = template.replace(
        "__FOURCH_INIT__",
        JSON.stringify(gameInit, null, 2)
    );

    // --------------------------
    // 8 — Copier style.css + script.js + runtime/*
    // --------------------------
    const destFolder = path.dirname(finalDestination);

    const assetsSourceDir = path.join(__dirname, "assets");
    const assetsDestDir = path.join(destFolder, "assets");

    if (!fs.existsSync(assetsDestDir)) {
        fs.mkdirSync(assetsDestDir, { recursive: true });
    }

    // CSS + script.js
    fs.copyFileSync(path.join(assetsSourceDir, "style.css"), path.join(assetsDestDir, "style.css"));
    fs.copyFileSync(path.join(assetsSourceDir, "script.js"), path.join(assetsDestDir, "script.js"));

    // ------------ Copier runtime ------------
    const runtimeSrc = path.resolve("dist/src/runtime");
    const runtimeDest = path.join(assetsDestDir, "runtime");

    if (!fs.existsSync(runtimeDest)) {
        fs.mkdirSync(runtimeDest, { recursive: true });
    }

    function copyRecursive(src: string, dest: string) {
        const items = fs.readdirSync(src);
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);

            if (fs.statSync(srcPath).isDirectory()) {
                if (!fs.existsSync(destPath)) fs.mkdirSync(destPath);
                copyRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    copyRecursive(runtimeSrc, runtimeDest);

    // --------------------------
    // 9 — Écrire index.html
    // --------------------------
    fs.writeFileSync(finalDestination, template);

    return finalDestination;
}
