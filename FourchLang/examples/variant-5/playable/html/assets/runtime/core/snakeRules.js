/* ============================================================
   1. UTILITAIRES
============================================================ */
function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}
function stepHead(pos, dir, state) {
    let { x, y } = pos;
    if (dir === "up")
        y--;
    if (dir === "down")
        y++;
    if (dir === "left")
        x--;
    if (dir === "right")
        x++;
    const { width, height, wrapX, wrapY } = state.config;
    if (wrapX)
        x = (x + width) % width;
    if (wrapY)
        y = (y + height) % height;
    return { x, y };
}
function positionsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
}
function snakeSelfCollision(s) {
    const [head, ...rest] = s.body;
    return rest.some((p) => positionsEqual(p, head));
}
function isWall(pos, state) {
    return state.walls.some((w) => positionsEqual(w, pos));
}
function isOutOfBounds(pos, state) {
    const { width, height, wrapX, wrapY } = state.config;
    if (wrapX && wrapY)
        return false;
    return pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height;
}
function growSnakeBy(actor, n) {
    const growth = Math.max(1, Number(n ?? 1));
    // déjà +1 car on ne retire pas la queue le tour où on mange
    const tail = actor.body[actor.body.length - 1];
    for (let i = 1; i < growth; i++) {
        actor.body.push({ ...tail });
    }
}
/**
 * Tour suivant : prend le prochain snake "alive".
 * Si aucun => on garde l'acteur courant (cas rare).
 */
function nextActorId(state) {
    const ids = Object.keys(state.snakes);
    if (ids.length === 0)
        return state.currentActorId;
    const curIdx = Math.max(0, ids.indexOf(state.currentActorId));
    for (let step = 1; step <= ids.length; step++) {
        const id = ids[(curIdx + step) % ids.length];
        const s = state.snakes[id];
        if (s && s.alive)
            return id;
    }
    return state.currentActorId;
}
/**
 * Retire un snake (ennemi) du jeu : il "disparaît"
 */
function removeSnake(state, snakeId) {
    delete state.snakes[snakeId];
    // on pourrait aussi nettoyer des fruits/walls si besoin, mais pas nécessaire ici
}
/**
 * Mort du joueur => fin de partie.
 * Mort d'un ennemi => on le retire, la partie continue.
 */
function killActor(state, actorId, reason) {
    const actor = state.snakes[actorId];
    if (!actor)
        return;
    actor.alive = false;
    if (actor.isPlayerControlled) {
        state.isTerminal = true;
        state.reason = reason;
        return;
    }
    // ennemi : disparaît
    removeSnake(state, actorId);
}
/* ============================================================
   2. RESPAWN DE FRUIT (guidé par le DSL)
============================================================ */
function respawnFruitIfNeeded(state) {
    const rules = state.config.fruitRespawn;
    if (!rules.enabled)
        return;
    if (!rules.frequencySeconds) {
        respawnOneFruit(state);
        return;
    }
    if (state.turn % rules.frequencySeconds === 0) {
        respawnOneFruit(state);
    }
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
   3. COLLISIONS ASYMÉTRIQUES PLAYER/ENEMY
============================================================ */
/**
 * Si actor est le joueur :
 *  - toucher tête/corps ennemi => joueur meurt
 *
 * Si actor est un ennemi :
 *  - toucher le corps du joueur (hors tête) => ennemi meurt
 *  - toucher la tête du joueur => joueur meurt (choix raisonnable pour un head-on)
 */
function resolvePlayerEnemyCollision(state, actor, newHead) {
    const player = Object.values(state.snakes).find((s) => s.isPlayerControlled);
    if (!player)
        return { terminal: false };
    // collisions avec les ennemis (quand actor est joueur)
    if (actor.isPlayerControlled) {
        for (const s of Object.values(state.snakes)) {
            if (s.isPlayerControlled)
                continue;
            if (s.body.some((p) => positionsEqual(p, newHead))) {
                killActor(state, actor.id, "enemy");
                return { terminal: state.isTerminal };
            }
        }
        return { terminal: false };
    }
    // actor est ennemi : collision avec joueur
    const [playerHead, ...playerBody] = player.body;
    // ennemi sur tête du joueur => joueur meurt
    if (positionsEqual(newHead, playerHead)) {
        killActor(state, player.id, "enemy");
        return { terminal: state.isTerminal };
    }
    // ennemi sur corps du joueur (hors tête) => ennemi meurt
    if (playerBody.some((p) => positionsEqual(p, newHead))) {
        killActor(state, actor.id, "snake_body");
        return { terminal: state.isTerminal };
    }
    return { terminal: false };
}
/* ============================================================
   4. CONTRACT
============================================================ */
export const snakeContract = {
    getLegalMoves(state) {
        if (state.isTerminal)
            return [];
        const actor = state.snakes[state.currentActorId];
        if (!actor || !actor.alive)
            return [];
        const directions = ["up", "down", "left", "right"];
        return directions.map((dir) => ({
            id: `${state.turn}-${actor.id}-${dir}`,
            label: dir.toUpperCase(),
            actorId: actor.id,
            direction: dir,
        }));
    },
    applyMove(state, move) {
        const newState = cloneState(state);
        const actor = newState.snakes[move.actorId];
        const conf = newState.config;
        if (!actor || !actor.alive || newState.isTerminal)
            return newState;
        const headBefore = actor.body[0];
        const newHead = stepHead(headBefore, move.direction, newState);
        // --- Border collision ---
        if (conf.gameOverOn.includes("border") && isOutOfBounds(newHead, newState)) {
            killActor(newState, actor.id, "border");
            // si joueur mort => terminal, sinon on continue
            if (newState.isTerminal)
                return newState;
        }
        // --- Mise à jour du corps (on avance la tête) ---
        actor.body = [newHead, ...actor.body];
        // --- Fruit ---
        const fruitIdx = newState.fruits.findIndex((f) => positionsEqual(f, newHead));
        if (fruitIdx >= 0) {
            newState.fruits.splice(fruitIdx, 1);
            const growth = Math.max(1, Number(conf.growthLength ?? 1));
            // ✅ le score correspond aux fruits du JOUEUR seulement
            if (actor.isPlayerControlled) {
                newState.score = (newState.score ?? 0) + growth;
            }
            // ✅ croissance pour tous (joueur + ennemis)
            growSnakeBy(actor, growth);
            respawnFruitIfNeeded(newState);
        }
        else {
            // pas de fruit => on retire la queue
            actor.body.pop();
        }
        // --- Self collision ---
        if (conf.gameOverOn.includes("self") && snakeSelfCollision(actor)) {
            killActor(newState, actor.id, "self");
            if (newState.isTerminal)
                return newState;
        }
        // --- Wall collision ---
        if (conf.gameOverOn.includes("wall") && isWall(newHead, newState)) {
            killActor(newState, actor.id, "wall");
            if (newState.isTerminal)
                return newState;
        }
        // --- Collisions asymétriques player/enemy ---
        // (doit arriver avant un éventuel "enemy collision" générique)
        if (conf.gameOverOn.includes("enemy") || conf.gameOverOn.includes("snake_body")) {
            const res = resolvePlayerEnemyCollision(newState, actor, newHead);
            if (res.terminal)
                return newState;
            // si l'ennemi vient de mourir, actor n'existe plus
            if (!newState.snakes[actor.id]) {
                // passe au tour suivant directement
                newState.turn++;
                newState.currentActorId = Object.keys(newState.snakes)[0] ?? newState.currentActorId;
                return newState;
            }
        }
        // --- Prochain tour ---
        newState.turn++;
        newState.currentActorId = nextActorId(newState);
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
        // (garde ta version heuristique améliorée)
        const s = state.snakes[forActorId];
        if (!s)
            return -1e9;
        if (state.isTerminal || !s.alive)
            return -1e6;
        // distance fruit (wrap)
        function wrappedDelta(a, b, size, wrap) {
            const d = Math.abs(a - b);
            return wrap ? Math.min(d, size - d) : d;
        }
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
        const distFruit = distToNearestFruit(head);
        const W_LEN = 100;
        const W_DIST = 10;
        return s.body.length * W_LEN - distFruit * W_DIST;
    },
};
//# sourceMappingURL=snakeRules.js.map