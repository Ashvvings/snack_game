import type { GameState } from "../core/types.js";
import type { GameContract } from "../core/contract.js";

function cloneState(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state));
}

export function greedyMove(
    state: GameState,
    contract: GameContract,
    actorId: string
) {
    const legal = contract.getLegalMoves(state);
    if (legal.length === 0) return undefined;

    let best = legal[0];
    let bestScore = -Infinity;

    for (const move of legal) {
        const next = contract.applyMove(cloneState(state), move);
        const score = contract.evaluate(next, actorId);
        if (score > bestScore) {
            bestScore = score;
            best = move;
        }
    }
    return best;
}
