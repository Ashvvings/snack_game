import type { Model } from "../../language/index.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type XY = { x: number; y: number };

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Construit les segments d'un snake HEAD -> TAIL en suivant une liste de bodies
 * qui pointe via parent.ref (même logique que player/snakeBodies).
 */
function buildSegmentsFromHeadAndBodies(headNode: any, bodies: any[]): XY[] {
  const segments: XY[] = [];
  if (!headNode) return segments;

  segments.push({ x: toNum(headNode.x), y: toNum(headNode.y) });

  let current: any = headNode;
  while (true) {
    const nextBody = bodies.find((b) => b.parent?.ref === current);
    if (!nextBody) break;

    segments.push({ x: toNum(nextBody.x), y: toNum(nextBody.y) });
    current = nextBody;
  }

  return segments;
}

// --------------------------
// Couleurs ennemis + headColor (plus foncé que le corps)
// --------------------------
function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function normalizeHexColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  const c = color.trim();

  // #RGB -> #RRGGBB
  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    const r = c[1],
      g = c[2],
      b = c[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  // #RRGGBB
  if (/^#[0-9a-fA-F]{6}$/.test(c)) {
    return c.toUpperCase();
  }

  // si on reçoit un nom "red"/"cyan", etc. on fallback pour rester robuste
  return fallback;
}

/**
 * Rend une couleur hex plus foncée.
 * amount: 0.0 => identique, 0.35 => ~35% plus sombre
 */
function darkenHex(hex: string, amount = 0.35): string {
  const h = normalizeHexColor(hex, "#EF4444"); // fallback rouge
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);

  const factor = 1 - Math.max(0, Math.min(1, amount));
  const rr = clampByte(r * factor);
  const gg = clampByte(g * factor);
  const bb = clampByte(b * factor);

  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb
    .toString(16)
    .padStart(2, "0")}`.toUpperCase();
}

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
  const width = toNum(model.grid[0].y);
  const height = toNum(model.grid[0].x);

  const player = model.player[0];
  const playerBodyColor = normalizeHexColor(player.color, "#6DD66D");
  const playerHeadColor = darkenHex(playerBodyColor, 0.35);

  // Fruits
  const fruits = (model.fruits ?? []).map((f: any) => ({
    x: toNum(f.x),
    y: toNum(f.y),
  }));

  // Murs
  const walls = (model.walls ?? []).map((w: any) => ({
    x: toNum(w.x),
    y: toNum(w.y),
  }));

  // --------------------------
  // 2 — Player HEAD → TAIL
  // --------------------------
  const snakeSegments = buildSegmentsFromHeadAndBodies(player, model.snakeBodies ?? []);

  // --------------------------
  // 2bis — Enemies HEAD → TAIL
  // --------------------------
  // ⚠️ Selon ton AST, ça peut s'appeler model.enemy ou model.enemies.
  // Ici on essaie enemies, sinon fallback enemy.
  const enemies: any[] = (model as any).enemies ?? (model as any).enemy ?? [];
  const enemyBodies: any[] = (model as any).enemyBodies ?? (model as any).enemiesBodies ?? [];

  // Palette sans vert (bleu, jaune, orange, cyan, magenta, rouge)
  const enemyPalette = ["#3B82F6", "#F59E0B", "#F97316", "#06B6D4", "#D946EF", "#EF4444"];

  const enemySnakes = enemies.map((enemyNode: any, idx: number) => {
    const segments = buildSegmentsFromHeadAndBodies(enemyNode, enemyBodies);

    const bodyColor = normalizeHexColor(enemyNode.color, enemyPalette[idx % enemyPalette.length]);
    const headColor = darkenHex(bodyColor, 0.35);

    return {
      id: enemyNode.name ?? enemyNode.id ?? `enemy-${idx + 1}`,
      isPlayerControlled: false,
      color: bodyColor,
      headColor, // ✅ tête plus foncée (cohérente avec le corps)
      body: segments,
    };
  });

  // --------------------------
  // 3 — Wrap rules
  // --------------------------
  const wrapX = model.borderRules?.some((b: any) => b.direction === "horizontally") ?? false;
  const wrapY = model.borderRules?.some((b: any) => b.direction === "vertically") ?? false;

  // --------------------------
  // 4 — Fruit growth
  // --------------------------
  const fruitConf = model.fruitConfig?.[0];
  const growthLength = fruitConf?.growthLength ? toNum(fruitConf.growthLength) : 1;

  // --------------------------
  // 5 — Game Over
  // --------------------------
  const targets = (model.game_over_conditions ?? []).map((c: any) => c.target);

  const killSelf = targets.includes("snake_body");
  const killEnemy = targets.includes("enemy");
  const killBorder = targets.includes("border");
  const killWall = targets.includes("wall");

  // --------------------------
  // 6 — Objet PlayableGameInit
  // --------------------------
  const gameInit = {
    config: {
      width,
      height,
      wrapX,
      wrapY,

      growthLength,

      fruitRespawn: {
        enabled: !!fruitConf?.reappear,
        onEaten: !!fruitConf?.reappear,
        everySeconds: fruitConf?.seconds ? toNum(fruitConf.seconds) : null,
      },

      gameOverOn: [
        ...(killSelf ? ["self"] : []),
        ...(killEnemy ? ["enemy"] : []),
        ...(killBorder ? ["border"] : []),
        ...(killWall ? ["wall"] : []),
      ],
    },

    // ✅ player + enemies
    snakes: [
      {
        id: player.name ?? "player",
        isPlayerControlled: true,
        color: playerBodyColor,
        headColor: playerHeadColor, // ✅ tête plus foncée
        body: snakeSegments,
      },
      ...enemySnakes,
    ],

    walls,
    fruits,
  };

  // --------------------------
  // 7 — Charger le template
  // --------------------------
  const templatePath = path.resolve("src/backends/playable/template.html");
  let template = fs.readFileSync(templatePath, "utf-8");

  template = template.replace("__FOURCH_INIT__", JSON.stringify(gameInit, null, 2));

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
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
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