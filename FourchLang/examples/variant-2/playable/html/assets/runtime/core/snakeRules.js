/* ============================================================
   1. UTILITAIRES
============================================================ */
function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}
function positionsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
}
function computeNextHead(pos, dir, state) {
    let x = pos.x;
    let y = pos.y;
    if (dir === "up")
        y--;
    if (dir === "down")
        y++;
    if (dir === "left")
        x--;
    if (dir === "right")
        x++;
    const raw = { x, y };
    const { width, height, wrapX, wrapY } = state.config;
    let wx = x;
    let wy = y;
    if (wrapX)
        wx = (wx + width) % width;
    if (wrapY)
        wy = (wy + height) % height;
    const wrapped = { x: wx, y: wy };
    return { raw, wrapped };
}
function snakeSelfCollision(s) {
    const [head, ...rest] = s.body;
    return rest.some((p) => positionsEqual(p, head));
}
function isWall(pos, state) {
    return state.walls.some((w) => positionsEqual(w, pos));
}
function isOutOfBoundsRaw(raw, state) {
    const { width, height, wrapX, wrapY } = state.config;
    const outX = raw.x < 0 || raw.x >= width;
    const outY = raw.y < 0 || raw.y >= height;
    if (wrapX && wrapY)
        return false;
    if (wrapX && !wrapY)
        return outY;
    if (!wrapX && wrapY)
        return outX;
    return outX || outY;
}
function growSnakeBy(actor, n) {
    const growth = Math.max(1, Number(n ?? 1));
    const tail = actor.body[actor.body.length - 1];
    // NOTE: on ne push que growth-1, car l'absence de pop ajoute déjà +1
    for (let i = 1; i < growth; i++) {
        actor.body.push({ ...tail });
    }
}
function isPacmanMode(state) {
    const anyState = state;
    const mode = anyState?.config?.gameMode ??
        anyState?.config?.mode ??
        anyState?.gameMode ??
        anyState?.mode ??
        "";
    return String(mode).toLowerCase() === "pacman";
}
/* ============================================================
   2. SCORE (inchangé)
============================================================ */
function ensureScores(state) {
    const anyState = state;
    if (!anyState.scores || typeof anyState.scores !== "object") {
        anyState.scores = {};
    }
}
function addScore(state, actorId, points) {
    ensureScores(state);
    const anyState = state;
    const p = Math.max(0, Number(points ?? 0));
    anyState.scores[actorId] = (anyState.scores[actorId] ?? 0) + p;
    const actor = state.snakes[actorId];
    if (actor?.isPlayerControlled) {
        state.score = anyState.scores[actorId];
    }
}
function getScore(state, actorId) {
    const anyState = state;
    const scores = anyState?.scores ?? {};
    const v = scores?.[actorId];
    return Number.isFinite(Number(v)) ? Number(v) : 0;
}
/* ============================================================
   3. RESPAWN FRUIT (inchangé)
============================================================ */
function nowMs(state) {
    // Option A (recommandé si ton runtime peut fournir le temps) :
    const anyState = state;
    if (typeof anyState?.timeMs === "number")
        return anyState.timeMs;
    // Option B (fallback) :
    return Date.now();
}
function ensureRuntime(state) {
    const anyState = state;
    if (!anyState.runtime || typeof anyState.runtime !== "object")
        anyState.runtime = {};
}
function respawnFruitIfNeeded(state, ateFruit) {
    const rules = state.config.fruitRespawn;
    if (!rules?.enabled)
        return;
    ensureRuntime(state);
    const anyState = state;
    const onEaten = !!rules.onEaten;
    const everySecondsRaw = rules.everySeconds ?? rules.frequencySeconds ?? null;
    const everySeconds = Number(everySecondsRaw);
    const hasTimer = Number.isFinite(everySeconds) && everySeconds > 0;
    const tNow = nowMs(state);
    // init: point de départ du timer
    if (typeof anyState.runtime.fruitRespawnLastMs !== "number") {
        anyState.runtime.fruitRespawnLastMs = tNow;
    }
    let spawned = 0;
    // 1) Respawn "when eaten"
    if (ateFruit && onEaten) {
        respawnOneFruit(state);
        spawned++;
        // Option: ré-ancrer le timer après un spawn évènementiel (évite double spawn immédiat)
        anyState.runtime.fruitRespawnLastMs = tNow;
    }
    // 2) Respawn périodique en vraies secondes
    if (hasTimer) {
        const intervalMs = everySeconds * 1000;
        // combien d'intervalles complets ont passé depuis le dernier tick timer ?
        const elapsed = tNow - anyState.runtime.fruitRespawnLastMs;
        if (elapsed >= intervalMs) {
            // si tu veux EXACTEMENT 1 fruit max par appel : remplace n par 1
            const n = Math.floor(elapsed / intervalMs);
            // cap sécurité (évite de spawn 200 fruits après une pause)
            const maxPerCall = 5;
            const toSpawn = Math.min(n, maxPerCall);
            // anti double-respawn : si on vient déjà de respawn via onEaten, on peut réduire de 1
            // (selon ton intention). Ici: on ne retire rien car on a déjà reset lastMs au-dessus.
            for (let i = 0; i < toSpawn; i++) {
                respawnOneFruit(state);
                spawned++;
            }
            // avance l’horloge interne du timer
            // (on garde le "reste" pour ne pas dériver)
            anyState.runtime.fruitRespawnLastMs += n * intervalMs;
        }
    }
    // Rien d'autre à faire
}
function respawnOneFruit(state) {
    const freeTiles = [];
    for (let y = 0; y < state.config.height; y++) {
        for (let x = 0; x < state.config.width; x++) {
            const p = { x, y };
            const occupied = isWall(p, state) ||
                Object.values(state.snakes).some((s) => s.body.some((seg) => positionsEqual(seg, p))) ||
                state.fruits.some((f) => positionsEqual(f, p));
            if (!occupied)
                freeTiles.push(p);
        }
    }
    if (freeTiles.length > 0) {
        const pos = freeTiles[Math.floor(Math.random() * freeTiles.length)];
        state.fruits.push(pos);
    }
}
/* ============================================================
   4. COLLISIONS PLAYER/ENEMY (règles)
============================================================ */
/**
 * Règles voulues :
 * - Si la TÊTE du JOUEUR touche un ennemi (tête OU corps) => joueur meurt
 * - Si la TÊTE d'un ENNEMI touche le joueur :
 *    - si touche la TÊTE du joueur => joueur meurt
 *    - si touche le CORPS du joueur => ennemi meurt (il disparaît)
 *
 * NOTE IMPORTANT :
 * - Un ennemi ne doit JAMAIS mourir pour bord/mur/self/etc.
 *   La seule mort ennemi est enemy-head -> player-body (hors tête).
 */
function resolvePlayerEnemyCollision(state, actor, newHead) {
    const player = Object.values(state.snakes).find((s) => s.isPlayerControlled);
    if (!player)
        return { terminal: false, actorStillExists: !!state.snakes[actor.id] };
    const playerHead = player.body[0];
    const playerBodyWithoutHead = player.body.slice(1);
    // Joueur se déplace sur ennemi (tête OU corps) => joueur meurt
    if (actor.isPlayerControlled) {
        for (const s of Object.values(state.snakes)) {
            if (s.isPlayerControlled)
                continue;
            if (s.body.some((p) => positionsEqual(p, newHead))) {
                player.alive = false;
                state.isTerminal = true;
                state.reason = "enemy";
                return { terminal: true, actorStillExists: true };
            }
        }
        return { terminal: false, actorStillExists: true };
    }
    // Ennemi se déplace sur tête joueur => joueur meurt
    if (positionsEqual(newHead, playerHead)) {
        player.alive = false;
        state.isTerminal = true;
        state.reason = "enemy_head_to_head";
        return { terminal: true, actorStillExists: !!state.snakes[actor.id] };
    }
    // Ennemi se déplace sur corps joueur (hors tête) => ennemi meurt (seule mort possible)
    if (playerBodyWithoutHead.some((p) => positionsEqual(p, newHead))) {
        delete state.snakes[actor.id];
        return { terminal: false, actorStillExists: false };
    }
    return { terminal: false, actorStillExists: !!state.snakes[actor.id] };
}
/* ============================================================
   5. COLLISIONS ENEMY/ENEMY (interdit)
============================================================ */
function isOccupiedByEnemyBody(state, pos, exceptId) {
    for (const s of Object.values(state.snakes)) {
        if (s.isPlayerControlled)
            continue;
        if (exceptId && s.id === exceptId)
            continue;
        if (s.body.some((p) => positionsEqual(p, pos)))
            return true;
    }
    return false;
}
/* ============================================================
   6. IA ENNEMI (chasse le joueur)
   - Les directions illégales NE doivent JAMAIS être choisies.
   - "Bloqué" = aucune direction légale.
============================================================ */
function wrappedDelta(a, b, size, wrap) {
    const d = Math.abs(a - b);
    return wrap ? Math.min(d, size - d) : d;
}
function distToPlayerHead(state, head) {
    const player = Object.values(state.snakes).find((sn) => sn.isPlayerControlled);
    if (!player)
        return 0;
    const pHead = player.body?.[0];
    if (!pHead)
        return 0;
    const { width, height, wrapX, wrapY } = state.config;
    const dx = wrappedDelta(head.x, pHead.x, width, wrapX);
    const dy = wrappedDelta(head.y, pHead.y, height, wrapY);
    return dx + dy;
}
function isPosInPlayerBodyExcludingHead(state, pos) {
    const player = Object.values(state.snakes).find((s) => s.isPlayerControlled);
    if (!player)
        return false;
    return player.body.slice(1).some((p) => positionsEqual(p, pos));
}
function wouldPlayerEatFruit(state, nextHead) {
    return state.fruits?.some((f) => positionsEqual(f, nextHead)) ?? false;
}
/**
 * Directions légales pour un ennemi.
 * IMPORTANT:
 * - interdit: mur, border non traversable, collision sur autre ennemi, self-collision,
 *   et en classic: tête sur corps joueur (hors tête) (suicide).
 */
function getEnemyLegalDirections(state, enemy) {
    const dirs = ["up", "down", "left", "right"];
    const pacman = isPacmanMode(state);
    const legal = [];
    for (const dir of dirs) {
        const { raw, wrapped } = computeNextHead(enemy.body[0], dir, state);
        const next = wrapped;
        // border non traversable
        if (isOutOfBoundsRaw(raw, state))
            continue;
        // mur
        if (isWall(next, state))
            continue;
        // pas traverser un autre ennemi
        if (isOccupiedByEnemyBody(state, next, enemy.id))
            continue;
        // classic: pas de suicide sur corps joueur
        if (!pacman && isPosInPlayerBodyExcludingHead(state, next))
            continue;
        // self collision ennemi: interdite
        const hypothetical = { ...enemy, body: [next, ...enemy.body] };
        hypothetical.body.pop();
        if (snakeSelfCollision(hypothetical))
            continue;
        legal.push(dir);
    }
    return legal;
}
function pickEnemyDirection(state, enemy) {
    const conf = state.config;
    const player = Object.values(state.snakes).find((s) => s.isPlayerControlled && s.alive);
    if (!player)
        return null;
    const pacman = isPacmanMode(state);
    const legalDirs = getEnemyLegalDirections(state, enemy);
    if (legalDirs.length === 0)
        return null; // seul vrai cas "bloqué"
    const dirsAll = ["up", "down", "left", "right"];
    const headE = enemy.body[0];
    const headP = player.body[0];
    let bestDir = legalDirs[0];
    let bestScore = -Infinity;
    for (const dir of legalDirs) {
        const { wrapped } = computeNextHead(headE, dir, state);
        const nextE = wrapped;
        let score = 0;
        // kill immédiat: head-to-head
        if (positionsEqual(nextE, headP))
            score += 1_000_000;
        // minimax léger: réduire les moves sûrs du joueur
        let safeMovesForPlayer = 0;
        for (const pDir of dirsAll) {
            const { raw: pRaw, wrapped: pWrapped } = computeNextHead(headP, pDir, state);
            const nextP = pWrapped;
            // joueur: border mortel
            if (conf.gameOverOn.includes("border") && isOutOfBoundsRaw(pRaw, state))
                continue;
            // joueur: mur (mortel ou bloquant) => pas safe
            if (isWall(nextP, state))
                continue;
            // joueur sur tête ennemie => head-to-head => joueur meurt
            if (positionsEqual(nextP, nextE))
                continue;
            // joueur sur corps ennemi après move (approx)
            const enemyBodyAfter = [nextE, ...enemy.body].slice(0, enemy.body.length);
            if (enemyBodyAfter.some((seg) => positionsEqual(seg, nextP)))
                continue;
            // self collision joueur avec anticipation croissance (classic)
            const playerWillEat = (!pacman && wouldPlayerEatFruit(state, nextP));
            const playerBodyBase = [nextP, ...player.body];
            const playerBodyAfter = playerWillEat ? playerBodyBase : playerBodyBase.slice(0, player.body.length);
            const [pHeadAfter, ...pRestAfter] = playerBodyAfter;
            if (pRestAfter.some((seg) => positionsEqual(seg, pHeadAfter)))
                continue;
            safeMovesForPlayer++;
        }
        score += (4 - safeMovesForPlayer) * 10_000;
        // agressivité légère
        score += -distToPlayerHead(state, nextE) * 50;
        // bonus pression adjacency (simple)
        if (Math.abs(nextE.x - headP.x) + Math.abs(nextE.y - headP.y) === 1)
            score += 2_000;
        if (score > bestScore) {
            bestScore = score;
            bestDir = dir;
        }
    }
    return bestDir;
}
/* ============================================================
   7. STEP UN SERPENT (joueur ou ennemi)
   - Ennemi: on ASSUME que dir est légale (sinon pickEnemyDirection retourne null).
   - Ennemi ne meurt pas sur border/wall/self/etc (seulement collision tête->corps joueur).
============================================================ */
function stepSnake(state, actorId, dir) {
    const actor = state.snakes[actorId];
    if (!actor || !actor.alive)
        return;
    const conf = state.config;
    const pacman = isPacmanMode(state);
    const isEnemy = !actor.isPlayerControlled;
    const headBefore = actor.body[0];
    const { raw, wrapped } = computeNextHead(headBefore, dir, state);
    const newHead = wrapped;
    // --- VALIDATION UNIQUEMENT POUR LE JOUEUR ---
    // L'ennemi ne doit jamais recevoir une direction illégale (filtrée avant).
    if (!isEnemy) {
        if (conf.gameOverOn.includes("border") && isOutOfBoundsRaw(raw, state)) {
            actor.alive = false;
            state.isTerminal = true;
            state.reason = "border";
            respawnFruitIfNeeded(state, false);
            return;
        }
        if (isWall(newHead, state)) {
            if (conf.gameOverOn.includes("wall")) {
                actor.alive = false;
                state.isTerminal = true;
                state.reason = "wall";
                respawnFruitIfNeeded(state, false);
                return;
            }
            // mur bloquant pour joueur => pas de move (selon tes règles globales)
            // ici on considère que ton runtime ne donnera pas ce move au joueur si tu ne veux pas
            respawnFruitIfNeeded(state, false);
            return;
        }
    }
    // --- Avance la tête ---
    actor.body = [newHead, ...actor.body];
    // --- Fruits ---
    let ateFruit = false;
    const fruitIdx = state.fruits.findIndex((f) => positionsEqual(f, newHead));
    if (fruitIdx >= 0 && actor.isPlayerControlled) {
        ateFruit = true;
        state.fruits.splice(fruitIdx, 1);
        const growth = Math.max(1, Number(conf.growthLength ?? 1));
        addScore(state, actor.id, growth);
        if (!pacman) {
            growSnakeBy(actor, growth);
        }
        else {
            // pacman : longueur constante même quand on mange
            actor.body.pop();
        }
    }
    else {
        // déplacement normal (joueur ou ennemi)
        actor.body.pop();
    }
    respawnFruitIfNeeded(state, ateFruit);
    // --- Self collision ---
    // Joueur seulement (ennemi: self collision interdite en amont dans getEnemyLegalDirections)
    if (actor.isPlayerControlled && conf.gameOverOn.includes("self") && snakeSelfCollision(actor)) {
        actor.alive = false;
        state.isTerminal = true;
        state.reason = "self";
        return;
    }
    // --- Collisions player/enemy ---
    if (conf.gameOverOn.includes("enemy") || conf.gameOverOn.includes("snake_body")) {
        const res = resolvePlayerEnemyCollision(state, actor, newHead);
        if (res.terminal)
            return;
    }
}
/* ============================================================
   8. CONTRACT
============================================================ */
export const snakeContract = {
    getLegalMoves(state) {
        if (state.isTerminal)
            return [];
        // On ne propose des coups QUE pour le joueur
        const player = Object.values(state.snakes).find((s) => s.isPlayerControlled && s.alive);
        if (!player)
            return [];
        const directions = ["up", "down", "left", "right"];
        return directions.map((dir) => ({
            id: `${state.turn}-${player.id}-${dir}`,
            label: dir.toUpperCase(),
            actorId: player.id,
            direction: dir,
        }));
    },
    applyMove(state, move) {
        const newState = cloneState(state);
        if (newState.isTerminal)
            return newState;
        ensureScores(newState);
        // 1) Coup joueur
        const player = Object.values(newState.snakes).find((s) => s.isPlayerControlled && s.alive);
        if (!player)
            return newState;
        // sécurité : on ignore un move qui ne vient pas du joueur
        if (move.actorId !== player.id)
            return newState;
        stepSnake(newState, player.id, move.direction);
        // si joueur mort => stop
        if (newState.isTerminal)
            return newState;
        // 2) Coup(s) ennemis (un pas chacun)
        const enemyIds = Object.values(newState.snakes)
            .filter((s) => !s.isPlayerControlled && s.alive)
            .map((s) => s.id);
        for (const eid of enemyIds) {
            if (newState.isTerminal)
                break;
            const enemy = newState.snakes[eid];
            if (!enemy)
                continue;
            const dir = pickEnemyDirection(newState, enemy);
            if (!dir) {
                // SEUL cas de blocage réel: aucune direction légale
                continue;
            }
            stepSnake(newState, eid, dir);
        }
        // 3) Tour suivant
        newState.turn++;
        return newState;
    },
    getResult(state) {
        if (!state.isTerminal)
            return { over: false };
        return {
            over: true,
            winnerId: state.winnerId,
            reason: state.reason,
        };
    },
    evaluate(state, forActorId) {
        const s = state.snakes[forActorId];
        if (!s)
            return -1e9;
        if (state.isTerminal || !s.alive)
            return -1e6;
        function distToNearestFruit(head) {
            const fruits = state.fruits ?? [];
            if (fruits.length === 0)
                return 0;
            const { width, height, wrapX, wrapY } = state.config;
            let best = Infinity;
            for (const f of fruits) {
                const dx = wrappedDelta(head.x, f.x, width, wrapX);
                const dy = wrappedDelta(head.y, f.y, height, wrapY);
                const d = dx + dy;
                if (d < best)
                    best = d;
            }
            return best === Infinity ? 0 : best;
        }
        const head = s.body[0];
        const pacman = isPacmanMode(state);
        const isEnemy = !s.isPlayerControlled;
        // ENNEMIS : chassent le joueur
        if (isEnemy) {
            const dPlayer = distToPlayerHead(state, head);
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
//# sourceMappingURL=snakeRules.js.map