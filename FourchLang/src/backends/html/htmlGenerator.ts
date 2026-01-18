import type { Model } from "../../language/index.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * IMPORTANT (aligné avec generateAscii) :
 * - Dans le DSL/AST, x = ligne (row), y = colonne (col).
 * - Dans la grille HTML (grid[y][x]), on veut :
 *      x = colonne, y = ligne
 * Donc SWAP : gridX = modelY, gridY = modelX.
 */
function mapXYFromModel(node: any): { x: number; y: number } {
  const modelRow = toNum(node?.x); // row
  const modelCol = toNum(node?.y); // col
  return { x: modelCol, y: modelRow };
}

export function generateHtml(model: Model, destination: string) {
  const width = toNum(model.grid?.[0]?.y);  // colonnes (comme generateAscii)
  const height = toNum(model.grid?.[0]?.x); // lignes

  // grid[y][x]
  const grid: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ".")
  );

  const place = (x: number, y: number, char: string) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      grid[y][x] = char;
    }
  };

  // Helpers de placement (SWAP appliqué)
  const placeNode = (node: any, char: string) => {
    if (!node) return;
    const { x, y } = mapXYFromModel(node);
    place(x, y, char);
  };

  const placeList = (nodes: any[] | undefined, char: string) => {
    (nodes ?? []).forEach((n) => placeNode(n, char));
  };

  // Remplir la grille (ordre similaire à generateAscii)
  placeNode(model.player?.[0], "O");
  placeList((model as any).snakeBodies ?? model.snakeBodies, "S");
  placeList((model as any).enemies ?? (model as any).enemy ?? model.enemies, "M");
  placeList((model as any).enemyBodies ?? model.enemyBodies, "X");
  placeList(model.fruits, "F");
  placeList(model.walls, "W");

  const playerColor = model.player?.[0]?.color ?? "green";

  // -------------------------------
  // 1. Charger le template HTML
  // -------------------------------
  const templatePath = path.resolve("src/backends/html/template.html");
  let template = fs.readFileSync(templatePath, "utf-8");

  // -------------------------------
  // 2. Remplacer les placeholders
  // -------------------------------
  function formatGridInline(g: string[][]): string {
    return (
      "[\n" +
      g
        .map((row) => "  [" + row.map((c) => JSON.stringify(c)).join(", ") + "]")
        .join(",\n") +
      "\n]"
    );
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