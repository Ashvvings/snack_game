import * as fs from "node:fs";
import * as path from "node:path";

import { runGeneration } from "../generator.js";
import { simulateStep } from "../../runtime/headless/simulateStep.js";
import type { FourchGenerateOptions } from "../options.js";

/**
 * Heuristique:
 * - si destinationOrOut a une extension => c'est un fichier
 * - sinon => c'est un dossier (ou un chemin "dossier")
 */
function isFilePath(p: string): boolean {
  return Boolean(path.extname(p));
}

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Résout la destination finale.
 *
 * Règles:
 * - si target != playable : on garde le comportement actuel (fichier OU dossier)
 * - si target == playable :
 *    - si destinationOrOut est un fichier => on respecte tel quel
 *    - si destinationOrOut est un dossier => on génère dans:
 *        <destinationOrOut>/playable/<playableBackend>/index.html
 *
 * Ex:
 *  - generate ... examples/variant-1  --target playable
 *     => examples/variant-1/playable/html/index.html
 *  - generate ... examples/variant-1/playable/html --target playable
 *     => examples/variant-1/playable/html/index.html
 *  - generate ... examples/variant-1/playable/html/index.html --target playable
 *     => (inchangé)
 */
function resolvePlayableDestination(destinationOrOut: string, playableBackend: string): string {
  // si on donne un fichier: on laisse
  if (isFilePath(destinationOrOut)) return destinationOrOut;

  // sinon on construit <out>/playable/<backend>/index.html
  const outDir = destinationOrOut;

  // si l'utilisateur a déjà mis .../playable ou .../playable/html, on évite de doubler
  const normalized = outDir.replace(/\\/g, "/");
  const hasPlayable = normalized.endsWith("/playable") || normalized.includes("/playable/");
  const hasBackend =
    normalized.endsWith(`/playable/${playableBackend}`) ||
    normalized.includes(`/playable/${playableBackend}/`);

  let base = outDir;

  if (!hasPlayable) {
    base = path.join(base, "playable");
  }
  if (!hasBackend) {
    base = path.join(base, playableBackend);
  }

  return path.join(base, "index.html");
}

export async function generateCommandHandler(
  source: string,
  destinationOrOut: string,
  opts: Partial<FourchGenerateOptions>
) {
  const backend = (opts.target ?? "ascii").toLowerCase().trim();

  const playableBackend = (opts.playableBackend ?? "html").toLowerCase().trim();

  let finalDestination = destinationOrOut;

  if (backend === "playable") {
    finalDestination = resolvePlayableDestination(destinationOrOut, playableBackend);
    ensureDirExists(path.dirname(finalDestination));
  } else {
    if (!isFilePath(finalDestination)) ensureDirExists(finalDestination);
  }

  const generated = await runGeneration(source, finalDestination, backend /*, opts*/);

  if (backend === "playable" && opts.headless) {
    const outDir = isFilePath(finalDestination) ? path.dirname(finalDestination) : finalDestination;

    await simulateStep({
      outDir,
      aiSpec: opts.ai ?? "random",
      seed: opts.seed ?? 42,
    });
  }

  return generated;
}