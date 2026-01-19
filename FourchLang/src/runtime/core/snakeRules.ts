import type { GameContract } from "./contract.js";
import type { GameState, Direction, Pos, Snake } from "./types.js";

/* ============================================================
   1. UTILITAIRES
============================================================ */

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

function positionsEqual(a: Pos, b: Pos) {
  return a.x === b.x && a.y === b.y;
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

/**
 * Border bloquante si :
 * - raw sort de la grille
 * - ET "border" n'est PAS une condition de game over
 * (si "border" est gameOver, alors c'est un move fatal mais valide)
 */
function isBlockingBorderForPlayer(raw: Pos, state: GameState): boolean {
  const out = isOutOfBoundsRaw(raw, state);
  if (!out) return false;
  return !state.config.gameOverOn.includes("border");
}

function growSnakeBy(actor: Snake, n: number) {
  const growth = Math.max(1, Number(n ?? 1));
  const tail = actor.body[actor.body.length - 1];
  // NOTE: on ne push que growth-1, car l'absence de pop ajoute déjà +1
  for (let i = 1; i < growth; i++) {
    actor.body.push({ ...tail });
  }
}

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

/* ============================================================
   2. SCORE
============================================================ */

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
   3. RESPAWN FRUIT
============================================================ */

function nowMs(state: GameState): number {
  const anyState = state as any;
  if (typeof anyState?.timeMs === "number") return anyState.timeMs;
  return Date.now();
}

function ensureRuntime(state: GameState) {
  const anyState = state as any;
  if (!anyState.runtime || typeof anyState.runtime !== "object") anyState.runtime = {};
}

function respawnFruitIfNeeded(state: GameState, ateFruit: boolean) {
  const rules = state.config.fruitRespawn;
  if (!rules?.enabled) return;

  ensureRuntime(state);
  const anyState = state as any;

  const onEaten = !!(rules as any).onEaten;
  const everySecondsRaw = (rules as any).everySeconds ?? (rules as any).frequencySeconds ?? null;
  const everySeconds = Number(everySecondsRaw);
  const hasTimer = Number.isFinite(everySeconds) && everySeconds > 0;

  const tNow = nowMs(state);

  if (typeof anyState.runtime.fruitRespawnLastMs !== "number") {
    anyState.runtime.fruitRespawnLastMs = tNow;
  }

  // 1) when eaten
  if (ateFruit && onEaten) {
    respawnOneFruit(state);
    anyState.runtime.fruitRespawnLastMs = tNow; // anti double-trigger immédiat
  }

  // 2) every N seconds (temps réel)
  if (hasTimer) {
    const intervalMs = everySeconds * 1000;
    const elapsed = tNow - anyState.runtime.fruitRespawnLastMs;

    if (elapsed >= intervalMs) {
      const n = Math.floor(elapsed / intervalMs);
      const maxPerCall = 5;
      const toSpawn = Math.min(n, maxPerCall);

      for (let i = 0; i < toSpawn; i++) {
        respawnOneFruit(state);
      }

      anyState.runtime.fruitRespawnLastMs += n * intervalMs;
    }
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
   4. COLLISIONS PLAYER/ENEMY
============================================================ */

function resolvePlayerEnemyCollision(
  state: GameState,
  actor: Snake,
  newHead: Pos
): { terminal: boolean; actorStillExists: boolean } {
  const player = Object.values(state.snakes).find((s) => s.isPlayerControlled);
  if (!player) return { terminal: false, actorStillExists: !!state.snakes[actor.id] };

  const playerHead = player.body[0];
  const playerBodyWithoutHead = player.body.slice(1);

  // Joueur sur ennemi => joueur meurt
  if (actor.isPlayerControlled) {
    for (const s of Object.values(state.snakes)) {
      if (s.isPlayerControlled) continue;
      if (s.body.some((p) => positionsEqual(p, newHead))) {
        player.alive = false;
        state.isTerminal = true;
        state.reason = "enemy";
        return { terminal: true, actorStillExists: true };
      }
    }
    return { terminal: false, actorStillExists: true };
  }

  // Ennemi sur tête joueur => joueur meurt
  if (positionsEqual(newHead, playerHead)) {
    player.alive = false;
    state.isTerminal = true;
    state.reason = "enemy_head_to_head";
    return { terminal: true, actorStillExists: !!state.snakes[actor.id] };
  }

  // Ennemi sur corps joueur (hors tête) => ennemi meurt
  if (playerBodyWithoutHead.some((p) => positionsEqual(p, newHead))) {
    delete state.snakes[actor.id];
    return { terminal: false, actorStillExists: false };
  }

  return { terminal: false, actorStillExists: !!state.snakes[actor.id] };
}

/* ============================================================
   5. COLLISIONS ENEMY/ENEMY
============================================================ */

function isOccupiedByEnemyBody(state: GameState, pos: Pos, exceptId?: string): boolean {
  for (const s of Object.values(state.snakes)) {
    if (s.isPlayerControlled) continue;
    if (exceptId && s.id === exceptId) continue;
    if (s.body.some((p) => positionsEqual(p, pos))) return true;
  }
  return false;
}

/* ============================================================
   6. IA ENNEMI
============================================================ */

function wrappedDelta(a: number, b: number, size: number, wrap: boolean): number {
  const d = Math.abs(a - b);
  return wrap ? Math.min(d, size - d) : d;
}

function distToPlayerHead(state: GameState, head: Pos): number {
  const player = Object.values(state.snakes).find((sn) => sn.isPlayerControlled);
  if (!player) return 0;
  const pHead = player.body?.[0];
  if (!pHead) return 0;

  const { width, height, wrapX, wrapY } = state.config;
  const dx = wrappedDelta(head.x, pHead.x, width, wrapX);
  const dy = wrappedDelta(head.y, pHead.y, height, wrapY);
  return dx + dy;
}

function isPosInPlayerBodyExcludingHead(state: GameState, pos: Pos): boolean {
  const player = Object.values(state.snakes).find((s) => s.isPlayerControlled);
  if (!player) return false;
  return player.body.slice(1).some((p) => positionsEqual(p, pos));
}

function wouldPlayerEatFruit(state: GameState, nextHead: Pos): boolean {
  return state.fruits?.some((f) => positionsEqual(f, nextHead)) ?? false;
}

function getEnemyLegalDirections(state: GameState, enemy: Snake): Direction[] {
  const dirs: Direction[] = ["up", "down", "left", "right"];
  const pacman = isPacmanMode(state);

  const legal: Direction[] = [];

  for (const dir of dirs) {
    const { raw, wrapped } = computeNextHead(enemy.body[0], dir, state);
    const next = wrapped;

    // border non traversable => interdit
    if (isOutOfBoundsRaw(raw, state)) continue;

    // mur => interdit
    if (isWall(next, state)) continue;

    // autre ennemi => interdit
    if (isOccupiedByEnemyBody(state, next, enemy.id)) continue;

    // classic => interdit de suicider sa tête sur le corps du joueur
    if (!pacman && isPosInPlayerBodyExcludingHead(state, next)) continue;

    // self collision ennemi => interdit
    const hypothetical: Snake = { ...enemy, body: [next, ...enemy.body] };
    hypothetical.body.pop();
    if (snakeSelfCollision(hypothetical)) continue;

    legal.push(dir);
  }

  return legal;
}

function pickEnemyDirection(state: GameState, enemy: Snake): Direction | null {
  const conf = state.config;

  const player = Object.values(state.snakes).find((s) => s.isPlayerControlled && s.alive);
  if (!player) return null;

  const pacman = isPacmanMode(state);

  const legalDirs = getEnemyLegalDirections(state, enemy);
  if (legalDirs.length === 0) return null;

  const dirsAll: Direction[] = ["up", "down", "left", "right"];

  const headE = enemy.body[0];
  const headP = player.body[0];

  let bestDir: Direction = legalDirs[0];
  let bestScore = -Infinity;

  for (const dir of legalDirs) {
    const { wrapped } = computeNextHead(headE, dir, state);
    const nextE = wrapped;

    let score = 0;

    if (positionsEqual(nextE, headP)) score += 1_000_000;

    let safeMovesForPlayer = 0;
    for (const pDir of dirsAll) {
      const { raw: pRaw, wrapped: pWrapped } = computeNextHead(headP, pDir, state);
      const nextP = pWrapped;

      if (conf.gameOverOn.includes("border") && isOutOfBoundsRaw(pRaw, state)) continue;
      if (isWall(nextP, state)) continue;

      if (positionsEqual(nextP, nextE)) continue;

      const enemyBodyAfter = [nextE, ...enemy.body].slice(0, enemy.body.length);
      if (enemyBodyAfter.some((seg) => positionsEqual(seg, nextP))) continue;

      const playerWillEat = (!pacman && wouldPlayerEatFruit(state, nextP));
      const playerBodyBase = [nextP, ...player.body];
      const playerBodyAfter = playerWillEat ? playerBodyBase : playerBodyBase.slice(0, player.body.length);

      const [pHeadAfter, ...pRestAfter] = playerBodyAfter;
      if (pRestAfter.some((seg) => positionsEqual(seg, pHeadAfter))) continue;

      safeMovesForPlayer++;
    }

    score += (4 - safeMovesForPlayer) * 10_000;
    score += -distToPlayerHead(state, nextE) * 50;

    if (Math.abs(nextE.x - headP.x) + Math.abs(nextE.y - headP.y) === 1) score += 2_000;

    if (score > bestScore) {
      bestScore = score;
      bestDir = dir;
    }
  }

  return bestDir;
}

/* ============================================================
   7. STEP UN SERPENT
============================================================ */

function stepSnake(state: GameState, actorId: string, dir: Direction): void {
  const actor = state.snakes[actorId];
  if (!actor || !actor.alive) return;

  const conf = state.config;
  const pacman = isPacmanMode(state);
  const isEnemy = !actor.isPlayerControlled;

  const headBefore = actor.body[0];
  const { raw, wrapped } = computeNextHead(headBefore, dir, state);
  const newHead = wrapped;

  // Validation joueur:
  // - border: si gameOver => mort, sinon BLOQUANT (donc on ne bouge pas)
  // - wall: si gameOver => mort, sinon BLOQUANT
  // Ennemi: ses directions illégales ne doivent jamais arriver ici (filtrées dans getEnemyLegalDirections)
  if (!isEnemy) {
    if (isOutOfBoundsRaw(raw, state)) {
      if (conf.gameOverOn.includes("border")) {
        actor.alive = false;
        state.isTerminal = true;
        state.reason = "border";
      }
      respawnFruitIfNeeded(state, false);
      return;
    }

    if (isWall(newHead, state)) {
      if (conf.gameOverOn.includes("wall")) {
        actor.alive = false;
        state.isTerminal = true;
        state.reason = "wall";
      }
      respawnFruitIfNeeded(state, false);
      return;
    }
  }

  // Avance
  actor.body = [newHead, ...actor.body];

  // Fruits
  let ateFruit = false;
  const fruitIdx = state.fruits.findIndex((f) => positionsEqual(f, newHead));

  if (fruitIdx >= 0 && actor.isPlayerControlled) {
    ateFruit = true;
    state.fruits.splice(fruitIdx, 1);

    const growth = Math.max(1, Number(conf.growthLength ?? 1));
    addScore(state, actor.id, growth);

    if (!pacman) {
      growSnakeBy(actor, growth);
    } else {
      actor.body.pop();
    }
  } else {
    actor.body.pop();
  }

  respawnFruitIfNeeded(state, ateFruit);

  // Self collision: joueur seulement
  if (actor.isPlayerControlled && conf.gameOverOn.includes("self") && snakeSelfCollision(actor)) {
    actor.alive = false;
    state.isTerminal = true;
    state.reason = "self";
    return;
  }

  // Player/enemy collisions
  if (conf.gameOverOn.includes("enemy") || conf.gameOverOn.includes("snake_body")) {
    const res = resolvePlayerEnemyCollision(state, actor, newHead);
    if (res.terminal) return;
  }
}

/* ============================================================
   8. CONTRACT
============================================================ */

export const snakeContract: GameContract = {
  getLegalMoves(state) {
    if (state.isTerminal) return [];

    const player = Object.values(state.snakes).find((s) => s.isPlayerControlled && s.alive);
    if (!player) return [];

    const directions: Direction[] = ["up", "down", "left", "right"];

    // IMPORTANT:
    // On ne propose PAS les moves impossibles:
    // - mur bloquant (wall pas gameOver)
    // - border bloquante (border pas gameOver + non traversable)
    return directions
      .filter((dir) => {
        const { raw, wrapped } = computeNextHead(player.body[0], dir, state);

        // border bloquante si pas gameOver
        if (isBlockingBorderForPlayer(raw, state)) return false;

        // mur bloquant si pas gameOver
        const wall = isWall(wrapped, state);
        if (wall && !state.config.gameOverOn.includes("wall")) return false;

        // sinon ok (y compris move fatal, ex: border gameOver ou wall gameOver)
        return true;
      })
      .map((dir) => ({
        id: `${state.turn}-${player.id}-${dir}`,
        label: dir.toUpperCase(),
        actorId: player.id,
        direction: dir,
      }));
  },

  applyMove(state, move) {
    const newState = cloneState(state);
    if (newState.isTerminal) return newState;

    ensureScores(newState);

    const player = Object.values(newState.snakes).find((s) => s.isPlayerControlled && s.alive);
    if (!player) return newState;

    if (move.actorId !== player.id) return newState;

    // sécurité: si jamais le runtime envoie quand même un move impossible (border/wall bloquants),
    // on l'ignore (pas de déplacement). (Le joueur doit bouger, mais ici c'est garde-fou.)
    {
      const { raw, wrapped } = computeNextHead(player.body[0], move.direction, newState);
      if (isBlockingBorderForPlayer(raw, newState)) return newState;
      if (isWall(wrapped, newState) && !newState.config.gameOverOn.includes("wall")) return newState;
    }

    // 1) Joueur
    stepSnake(newState, player.id, move.direction);
    if (newState.isTerminal) return newState;

    // 2) Ennemis
    const enemyIds = Object.values(newState.snakes)
      .filter((s) => !s.isPlayerControlled && s.alive)
      .map((s) => s.id);

    for (const eid of enemyIds) {
      if (newState.isTerminal) break;
      const enemy = newState.snakes[eid];
      if (!enemy) continue;

      const dir = pickEnemyDirection(newState, enemy);
      if (!dir) continue;

      stepSnake(newState, eid, dir);
    }

    newState.turn++;
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

    const head = s.body[0];
    const pacman = isPacmanMode(state);
    const isEnemy = !s.isPlayerControlled;

    if (isEnemy) {
      const dPlayer = distToPlayerHead(state, head);
      const W_CHASE = 50;
      return -dPlayer * W_CHASE;
    }

    const distFruit = distToNearestFruit(head);
    const myScore = getScore(state, forActorId);

    const W_SCORE = pacman ? 1000 : 0;
    const W_LEN = pacman ? 0 : 100;
    const W_DIST_FRUIT = 10;

    return myScore * W_SCORE + s.body.length * W_LEN - distFruit * W_DIST_FRUIT;
  },
};