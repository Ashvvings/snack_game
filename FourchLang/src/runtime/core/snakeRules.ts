import type { GameContract } from "./contract.js";
import type { GameState, Direction, Pos, Snake } from "./types.js";

/* ============================================================
   1. UTILITAIRES
============================================================ */

function cloneState(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state));
}

function stepHead(pos: Pos, dir: Direction, state: GameState): Pos {
    let { x, y } = pos;

    if (dir === "up") y--;
    if (dir === "down") y++;
    if (dir === "left") x--;
    if (dir === "right") x++;

    const { width, height, wrapX, wrapY } = state.config;

    // Wrap X
    if (wrapX) x = (x + width) % width;
    // Wrap Y
    if (wrapY) y = (y + height) % height;

    return { x, y };
}

function positionsEqual(a: Pos, b: Pos) {
    return a.x === b.x && a.y === b.y;
}

function snakeSelfCollision(s: Snake): boolean {
    const [head, ...rest] = s.body;
    return rest.some(p => positionsEqual(p, head));
}

function isWall(pos: Pos, state: GameState): boolean {
    return state.walls.some(w => positionsEqual(w, pos));
}

function isOutOfBounds(pos: Pos, state: GameState): boolean {
    const { width, height, wrapX, wrapY } = state.config;

    if (wrapX && wrapY) return false;

    return pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height;
}

function collisionWithOtherSnake(pos: Pos, state: GameState, actorId: string) {
    return Object.values(state.snakes).some(s =>
        s.id !== actorId && s.body.some(p => positionsEqual(p, pos))
    );
}

/* ============================================================
   2. RESPAWN DE FRUIT (guidé par le DSL)
============================================================ */

function respawnFruitIfNeeded(state: GameState) {
    const rules = state.config.fruitRespawn;

    if (!rules.enabled) return;

    // Respawn immédiat -> DSL : "reappear when eaten"
    if (!rules.frequencySeconds) {
        respawnOneFruit(state);
        return;
    }

    // Respawn retardé ?
    // 👉 Dans un vrai moteur temps-réel, il faudrait une horloge,
    //    mais en mode "turn-based", on peut faire simple :
    //    Tous les X tours, on respawn un fruit.
    if (state.turn % rules.frequencySeconds === 0) {
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
                Object.values(state.snakes).some(s =>
                    s.body.some(seg => positionsEqual(seg, p))
                ) ||
                state.fruits.some(f => positionsEqual(f, p));

            if (!occupied) freeTiles.push(p);
        }
    }

    if (freeTiles.length > 0) {
        const pos = freeTiles[Math.floor(Math.random() * freeTiles.length)];
        state.fruits.push(pos);
    }
}

/* ============================================================
   3. FIN DE PARTIE
============================================================ */

function setTerminal(state: GameState, actor: Snake, reason: string) {
    state.isTerminal = true;
    state.reason = reason;
    actor.alive = false;
}

/* ============================================================
   4. CONTRACT : getLegalMoves, applyMove, getResult, evaluate
============================================================ */

export const snakeContract: GameContract = {

    /* --------------------------------------
       A. Coups possibles
    -------------------------------------- */
    getLegalMoves(state) {
        if (state.isTerminal) return [];

        const actor = state.snakes[state.currentActorId];
        if (!actor || !actor.alive) return [];

        const directions: Direction[] = ["up", "down", "left", "right"];

        return directions.map(dir => ({
            id: `${state.turn}-${actor.id}-${dir}`,
            label: dir.toUpperCase(),
            actorId: actor.id,
            direction: dir
        }));
    },

    /* --------------------------------------
       B. Application d’un coup
    -------------------------------------- */
    applyMove(state, move) {
        const newState = cloneState(state);
        const actor = newState.snakes[move.actorId];
        const conf = newState.config;

        if (!actor || !actor.alive || newState.isTerminal) return newState;

        const headBefore = actor.body[0];
        const newHead = stepHead(headBefore, move.direction, newState);

        /* --- Border collision --- */
        if (conf.gameOverOn.includes("border") && isOutOfBounds(newHead, newState)) {
            setTerminal(newState, actor, "border");
            return newState;
        }

        /* --- Mise à jour du corps --- */
        actor.body = [newHead, ...actor.body];

        /* --- Fruit --- */
        const fruitIdx = newState.fruits.findIndex(f => positionsEqual(f, newHead));

        if (fruitIdx >= 0) {
            // Manger fruit → on garde la queue (croissance)
            newState.fruits.splice(fruitIdx, 1);

            // Respawn guidé par le DSL
            respawnFruitIfNeeded(newState);

        } else {
            // Pas de fruit → on retire la queue
            actor.body.pop();
        }

        /* --- Self collision --- */
        if (conf.gameOverOn.includes("self") && snakeSelfCollision(actor)) {
            setTerminal(newState, actor, "self");
            return newState;
        }

        /* --- Wall collision --- */
        if (conf.gameOverOn.includes("wall") && isWall(newHead, newState)) {
            setTerminal(newState, actor, "wall");
            return newState;
        }

        /* --- Enemy collision --- */
        if (conf.gameOverOn.includes("enemy") && collisionWithOtherSnake(newHead, newState, actor.id)) {
            setTerminal(newState, actor, "enemy");
            return newState;
        }

        /* --- Prochain tour --- */
        newState.turn++;

        // Pour le moment simple : toujours le joueur/unique acteur
        newState.currentActorId = Object.keys(newState.snakes)[0];

        return newState;
    },

    /* --------------------------------------
       C. Résultat final
    -------------------------------------- */
    getResult(state) {
        if (!state.isTerminal) return { over: false };
        return {
            over: true,
            winnerId: state.winnerId,
            reason: state.reason
        };
    },

    /* --------------------------------------
       D. Évaluation pour IA (random/greedy/minimax)
    -------------------------------------- */
    evaluate(state, forActorId) {
        const s = state.snakes[forActorId];
        if (!s) return 0;

        let score = s.body.length;

        if (state.isTerminal) {
            if (state.winnerId === forActorId) score += 100;
            else score -= 100;
        }

        return score;
    }
};
