import type { Model } from "../../language/index.js";
import * as fs from "node:fs";
import * as path from "node:path";

export function generateJson(model: Model, destination: string): string {

    // --- Raccourcis utiles avec protections ---
    const gridNode   = model.grid[0];
    const gameMode   = model.gameMode[0];
    const fruitCfg   = model.fruitConfig[0];
    const playerNode = model.player[0];

    // --- Construction de l’objet JSON dans le format demandé ---
    const json: any = {
        grid: {
            x: gridNode ? Number(gridNode.x) : 0,
            y: gridNode ? Number(gridNode.y) : 0
        },

        // "adder" | "pacman" | "snake" ou "undefined"
        "game-mode": gameMode?.mode ?? "undefined",

        // borderRules: Array<BorderRule> avec direction: 'horizontally' | 'vertically'
        // Format attendu: [ { "horizontally": true }, { "vertically": true }, ... ]
        "border-rules": model.borderRules.map(rule => ({
            [rule.direction]: true
        })),

        // FruitConfiguration
        // growthLength?: string; reappear: boolean; seconds?: string;
        "fruits-config": {
            reappear: fruitCfg?.reappear ?? false,
            "respawn-time": fruitCfg?.reappear
                ? (fruitCfg?.seconds !== undefined ? Number(fruitCfg.seconds) : "undefined")
                : null,
            "snake-growth": fruitCfg?.growthLength !== undefined
                ? Number(fruitCfg.growthLength)
                : 1
        },

        // Player
        player: playerNode
            ? {
                id: playerNode.name ?? "player",
                position: {
                    x: Number(playerNode.x),
                    y: Number(playerNode.y)
                },
                size: playerNode.len !== undefined ? Number(playerNode.len) : 1,
                speed: playerNode.speed ?? "undefined",
                color: playerNode.color ?? "undefined"
            }
            : null,

        // Enemy : len?: string; movable: boolean; name?: string; speed?: string; x,y: string
        enemies: model.enemies.map(e => ({
            id: e.name ?? "",
            position: {
                x: Number(e.x),
                y: Number(e.y)
            },
            size: e.len !== undefined ? Number(e.len) : "undefined",
            moves: e.movable,
            speed: e.speed ?? "undefined"
        })),

        // SnakeBody : name?: string; parent: Reference<ToFollowSnake>; x,y
        "snake-body": model.snakeBodies.map(sb => ({
            id: sb.name ?? "",
            position: {
                x: Number(sb.x),
                y: Number(sb.y)
            },
            // On récupère le nom de la cible si elle est résolue
            follows: sb.parent.ref?.name ?? ""
        })),

        // EnemyBody : name?: string; parent: Reference<ToFollowEnemy>; x,y
        "enemy-bodies": model.enemyBodies.map(eb => ({
            id: eb.name ?? "",
            position: {
                x: Number(eb.x),
                y: Number(eb.y)
            },
            follows: eb.parent.ref?.name ?? ""
        })),

        // Walls
        walls: model.walls.map(w => ({
            position: {
                x: Number(w.x),
                y: Number(w.y)
            }
        })),

        // Fruits
        fruits: model.fruits.map(f => ({
            position: {
                x: Number(f.x),
                y: Number(f.y)
            },
            points: Number(f.points)
        })),

        // GameOverCondition : target: 'border' | 'enemy' | 'snake_body' | 'wall'
        "game-over-conditions": model.game_over_conditions.map(goc => ({
            target: goc.target
        }))
    };

    // --- Création du dossier si nécessaire ---
    const dir = path.dirname(destination);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destination, JSON.stringify(json, null, 4), "utf-8");
    return destination;
}
