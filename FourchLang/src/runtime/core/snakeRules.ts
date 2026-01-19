import type { GameContract } from "./contract.js";
import type { GameState, Direction, Pos, Snake } from "./types.js";

/* ============================================================
   1. UTILITAIRES
============================================================ */

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

function computeNextHead(pos: Pos, dir: Direction, state: GameState): { raw: Pos; wrapped: Pos } {
  let x = pos.x;
  let y = pos.y;

  if (dir === "up") y--;
  if (dir === "down") y++;
  if (dir === "left") x--;
  if (dir === "right") x++;

  const raw = { x, y };

  const { width, height, wrapX, wrapY } = state.config;

  let wx = x;
  let wy = y;

  if (wrapX) wx = (wx + width) % width;
  if (wrapY) wy = (wy + height) % height;

  const wrapped = { x: wx, y: wy };

  return { raw, wrapped };
}

function positionsEqual(a: Pos, b: Pos) {
  return a.x === b.x && a.y === b.y;
}

function snakeSelfCollision(s: Snake): boolean {
  const [head, ...rest] = s.body;
  return rest.some((p) => positionsEqual(p, head));
}

function isWall(pos: Pos, state: GameState): boolean {
  return state.walls.some((w) => positionsEqual(w, pos));
}

function isOutOfBoundsRaw(raw: Pos, state: GameState): boolean {
  const { width, height, wrapX, wrapY } = state.config;

  const outX = raw.x < 0 || raw.x >= width;
  const outY = raw.y < 0 || raw.y >= height;

  if (wrapX && wrapY) return false;
  if (wrapX && !wrapY) return outY;
  if (!wrapX && wrapY) return outX;
  return outX || outY;
}

function growSnakeBy(actor: Snake, n: number) {
  const growth = Math.max(1, Number(n ?? 1));
  const tail = actor.body[actor.body.length - 1];
  for (let i = 1; i < growth; i++) {
    actor.body.push({ ...tail });
  }
}

/**
 * Détermine si on est en mode Pacman.
 */
function isPacmanMode(state: GameState): boolean {
  const anyState = state as any;
  const mode =
    anyState?.config?.gameMode ??
    anyState?.config?.mode ??
    anyState?.gameMode ??
    anyState?.mode ??
    "";

  return String(mode).toLowerCase() === "pacman";
}

/**
 * IMPORTANT: empêche le bug "je contrôle l'ennemi après mort du joueur".
 * On force toujours l'acteur courant à rester le joueur (s'il existe).
 */
function ensureCurrentActorIsPlayer(state: GameState) {
  const player = Object.values(state.snakes).find((s) => s.isPlayerControlled);
  if (player) state.currentActorId = player.id;
}

function nextActorId(state: GameState): string {
  const ids = Object.keys(state.snakes);
  if (ids.length === 0) return state.currentActorId;

  const curIdx = Math.max(0, ids.indexOf(state.currentActorId));
  for (let step = 1; step <= ids.length; step++) {
    const id = ids[(curIdx + step) % ids.length];
    const s = state.snakes[id];
    if (s && s.alive) return id;
  }
  return state.currentActorId;
}

function removeSnake(state: GameState, snakeId: string) {
  delete state.snakes[snakeId];
}

function killActor(state: GameState, actorId: string, reason: string) {
  const actor = state.snakes[actorId];
  if (!actor) return;

  actor.alive = false;

  if (actor.isPlayerControlled) {
    // On termine la partie => plus aucun contrôle possible
    state.isTerminal = true;
    state.reason = reason;

    // Optionnel: cacher le joueur (si le rendu se base sur snakes)
    // (on garde le snake mais alive=false suffit souvent)
    return;
  }

  removeSnake(state, actorId);
}

/**
 * Gestion des scores par serpent.
 * - state.score pour le HUD (joueur)
 * - (state as any).scores[snakeId] pour l'IA
 */
function ensureScores(state: GameState) {
  const anyState = state as any;
  if (!anyState.scores || typeof anyState.scores !== "object") {
    anyState.scores = {};
  }
}

function addScore(state: GameState, actorId: string, points: number) {
  ensureScores(state);
  const anyState = state as any;

  const p = Math.max(0, Number(points ?? 0));
  anyState.scores[actorId] = (anyState.scores[actorId] ?? 0) + p;

  // compat HUD
  const actor = state.snakes[actorId];
  if (actor?.isPlayerControlled) {
    (state as any).score = anyState.scores[actorId];
  }
}

function getScore(state: GameState, actorId: string): number {
  const anyState = state as any;
  const scores = anyState?.scores ?? {};
  const v = scores?.[actorId];
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

/* ============================================================
   2. RESPAWN DE FRUIT (guidé par le DSL)
============================================================ */

/**
 * Respawn des fruits :
 * - "fruits reappear when eaten"  => onEaten = true, enabled = true, everySeconds = null
 * - "fruits reappear every n seconds" => enabled = true, everySeconds = n, onEaten = false
 * - rien => enabled = false
 *
 * ✅ Anti double-respawn :
 * Si onEaten ET everySeconds tombent sur le même tour, on ne respawn qu'une seule fois.
 */
function respawnFruitIfNeeded(state: GameState, ateFruit: boolean) {
  const rules = state.config.fruitRespawn;
  if (!rules?.enabled) return;

  const everySeconds = (rules as any).everySeconds ?? (rules as any).frequencySeconds ?? null;
  const freq = Number(everySeconds);

  let shouldRespawn = false;

  if (ateFruit && !!(rules as any).onEaten) {
    shouldRespawn = true;
  }

  if (Number.isFinite(freq) && freq > 0) {
    if (state.turn > 0 && state.turn % freq === 0) {
      shouldRespawn = true;
    }
  }

  if (shouldRespawn) {
    respawnOneFruit(state);
  }
}

function respawnOneFruit(state: GameState) {
  const freeTiles: Pos[] = [];

  for (let y = 0; y < state.config.height; y++) {
    for (let x = 0; x < state.config.width; x++) {
      const p = { x, y };

      const occupied =
        isWall(p, state) ||
        Object.values(state.snakes).some((s) => s.body.some((seg) => positionsEqual(seg, p))) ||
        state.fruits.some((f) => positionsEqual(f, p));

      if (!occupied) freeTiles.push(p);
    }
  }

  if (freeTiles.length > 0) {
    const pos = freeTiles[Math.floor(Math.random() * freeTiles.length)];
    state.fruits.push(pos);
  }
}

/* ============================================================
   3. COLLISIONS PLAYER/ENEMY
============================================================ */

/**
 * Règles (celles que tu veux maintenant) :
 * - Si le JOUEUR touche un ennemi (tête OU corps) => GAME OVER (joueur meurt)
 * - Si un ENNEMI touche le joueur (tête OU corps) => l'ENNEMI meurt / disparaît
 *
 * ⚠️ En head-to-head, les deux règles s'appliquent => joueur meurt => terminal.
 *
 * Note: on garde des règles "instantanées" (pas simultané).
 * Si tu veux du vrai simultané, il faut un applyMove batch côté runtime/playable.
 */
function resolvePlayerEnemyCollision(
  state: GameState,
  actor: Snake,
  newHead: Pos
): { terminal: boolean } {
  const player = Object.values(state.snakes).find((s) => s.isPlayerControlled);
  if (!player) return { terminal: false };

  // --- Joueur sur ennemi : joueur meurt (tête OU corps)
  if (actor.isPlayerControlled) {
    for (const s of Object.values(state.snakes)) {
      if (s.isPlayerControlled) continue;
      if (s.body.some((p) => positionsEqual(p, newHead))) {
        killActor(state, actor.id, "enemy");
        return { terminal: state.isTerminal };
      }
    }
    return { terminal: false };
  }

  // --- Ennemi sur joueur : ennemi meurt (tête OU corps)
  if (player.body.some((p) => positionsEqual(p, newHead))) {
    killActor(state, actor.id, "hit_player");
    return { terminal: state.isTerminal };
  }

  return { terminal: false };
}

/* ============================================================
   4. CONTRACT
============================================================ */

export const snakeContract: GameContract = {
  getLegalMoves(state) {
    if (state.isTerminal) return [];

    // IMPORTANT: ne jamais laisser le contrôle passer à un ennemi
    ensureCurrentActorIsPlayer(state);

    const actor = state.snakes[state.currentActorId];
    if (!actor || !actor.alive) return [];

    const directions: Direction[] = ["up", "down", "left", "right"];
    return directions.map((dir) => ({
      id: `${state.turn}-${actor.id}-${dir}`,
      label: dir.toUpperCase(),
      actorId: actor.id,
      direction: dir,
    }));
  },

  applyMove(state, move) {
    const newState = cloneState(state);
    const conf = newState.config;

    if (newState.isTerminal) return newState;

    // Toujours garder le joueur comme acteur contrôlé
    ensureCurrentActorIsPlayer(newState);

    const actor = newState.snakes[move.actorId];
    if (!actor || !actor.alive) return newState;

    ensureScores(newState);

    const headBefore = actor.body[0];
    const { raw, wrapped } = computeNextHead(headBefore, move.direction, newState);

    // --- Border collision ---
    if (conf.gameOverOn.includes("border") && isOutOfBoundsRaw(raw, newState)) {
      killActor(newState, actor.id, "border");

      // respawn périodique possible même si pas de fruit mangé
      respawnFruitIfNeeded(newState, false);

      // si joueur mort => terminal => stop
      if (newState.isTerminal) {
        ensureCurrentActorIsPlayer(newState);
        return newState;
      }

      // ennemi mort => on continue
      newState.turn++;
      ensureCurrentActorIsPlayer(newState);
      return newState;
    }

    const newHead = wrapped;

    // --- Wall collision / blocking ---
    if (isWall(newHead, newState)) {
      if (conf.gameOverOn.includes("wall")) {
        killActor(newState, actor.id, "wall");

        respawnFruitIfNeeded(newState, false);

        if (newState.isTerminal) {
          ensureCurrentActorIsPlayer(newState);
          return newState;
        }

        newState.turn++;
        ensureCurrentActorIsPlayer(newState);
        return newState;
      }

      // mur bloquant (par défaut)
      respawnFruitIfNeeded(newState, false);

      newState.turn++;
      ensureCurrentActorIsPlayer(newState);
      return newState;
    }

    // --- Avance la tête ---
    actor.body = [newHead, ...actor.body];

    // --- Fruits ---
    // Seul le joueur peut consommer un fruit.
    // Si un ennemi passe sur un fruit => il ne le mange PAS.
    let ateFruit = false;
    const fruitIdx = newState.fruits.findIndex((f) => positionsEqual(f, newHead));

    if (fruitIdx >= 0 && actor.isPlayerControlled) {
      ateFruit = true;
      newState.fruits.splice(fruitIdx, 1);

      const growth = Math.max(1, Number(conf.growthLength ?? 1));
      addScore(newState, actor.id, growth);

      if (!isPacmanMode(newState)) {
        growSnakeBy(actor, growth);
      } else {
        // pacman : longueur constante même quand on mange
        actor.body.pop();
      }
    } else {
      // déplacement normal
      actor.body.pop();
    }

    // respawn (anti double-respawn intégré)
    respawnFruitIfNeeded(newState, ateFruit);

    // --- Self collision ---
    if (conf.gameOverOn.includes("self") && snakeSelfCollision(actor)) {
      killActor(newState, actor.id, "self");

      if (newState.isTerminal) {
        ensureCurrentActorIsPlayer(newState);
        return newState;
      }

      newState.turn++;
      ensureCurrentActorIsPlayer(newState);
      return newState;
    }

    // --- Collisions player/enemy ---
    if (conf.gameOverOn.includes("enemy") || conf.gameOverOn.includes("snake_body")) {
      const res = resolvePlayerEnemyCollision(newState, actor, newHead);

      // si le joueur est mort => terminal => stop
      if (res.terminal) {
        ensureCurrentActorIsPlayer(newState);
        return newState;
      }

      // si l'ennemi vient de mourir, il n'existe plus (removeSnake)
      // => on ne doit SURTOUT PAS basculer le contrôle dessus
      if (!newState.snakes[actor.id]) {
        newState.turn++;
        ensureCurrentActorIsPlayer(newState);
        return newState;
      }
    }

    // --- Prochain tour ---
    newState.turn++;
    ensureCurrentActorIsPlayer(newState);
    return newState;
  },

  getResult(state) {
    if (!state.isTerminal) return { over: false };
    return {
      over: true,
      winnerId: state.winnerId,
      reason: state.reason,
    };
  },

  evaluate(state, forActorId) {
    const s = state.snakes[forActorId];
    if (!s) return -1e9;

    if (state.isTerminal || !s.alive) return -1e6;

    function wrappedDelta(a: number, b: number, size: number, wrap: boolean): number {
      const d = Math.abs(a - b);
      return wrap ? Math.min(d, size - d) : d;
    }

    function distToNearestFruit(head: Pos): number {
      const fruits = state.fruits ?? [];
      if (fruits.length === 0) return 0;

      const { width, height, wrapX, wrapY } = state.config;

      let best = Infinity;
      for (const f of fruits) {
        const dx = wrappedDelta(head.x, f.x, width, wrapX);
        const dy = wrappedDelta(head.y, f.y, height, wrapY);
        const d = dx + dy;
        if (d < best) best = d;
      }
      return best === Infinity ? 0 : best;
    }

    function distToPlayerHead(head: Pos): number {
      const player = Object.values(state.snakes).find((sn) => sn.isPlayerControlled);
      if (!player) return 0;
      const pHead = player.body?.[0];
      if (!pHead) return 0;

      const { width, height, wrapX, wrapY } = state.config;
      const dx = wrappedDelta(head.x, pHead.x, width, wrapX);
      const dy = wrappedDelta(head.y, pHead.y, height, wrapY);
      return dx + dy;
    }

    const head = s.body[0];
    const pacman = isPacmanMode(state);
    const isEnemy = !s.isPlayerControlled;

    // ENNEMIS : ne mangent pas, ne visent pas les fruits => ils chassent le joueur
    if (isEnemy) {
      const dPlayer = distToPlayerHead(head);
      const W_CHASE = 50;
      return -dPlayer * W_CHASE;
    }

    // JOUEUR : fruits/score/longueur
    const distFruit = distToNearestFruit(head);
    const myScore = getScore(state, forActorId);

    const W_SCORE = pacman ? 1000 : 0;
    const W_LEN = pacman ? 0 : 100;
    const W_DIST_FRUIT = 10;

    return myScore * W_SCORE + s.body.length * W_LEN - distFruit * W_DIST_FRUIT;
  },
};