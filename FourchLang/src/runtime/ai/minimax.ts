import type { GameState } from "../core/types.js";
import type { GameContract } from "../core/contract.js";

function cloneState(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state));
}

interface MinimaxOptions {
    depth: number;
    actorId: string;
}

function minimax(
    state: GameState,
    contract: GameContract,
    depth: number,
    maximizing: boolean,
    actorId: string
): number {
    const result = contract.getResult(state);
    if (depth === 0 || result.over) {
        return contract.evaluate(state, actorId);
    }

    const legal = contract.getLegalMoves(state);
    if (legal.length === 0) {
        return contract.evaluate(state, actorId);
    }

    if (maximizing) {
        let best = -Infinity;
        for (const move of legal) {
            const next = contract.applyMove(cloneState(state), move);
            const val = minimax(next, contract, depth - 1, false, actorId);
            if (val > best) best = val;
        }
        return best;
    } else {
        let best = Infinity;
        for (const move of legal) {
            const next = contract.applyMove(cloneState(state), move);
            const val = minimax(next, contract, depth - 1, true, actorId);
            if (val < best) best = val;
        }
        return best;
    }
}

export function minimaxMove(
    state: GameState,
    contract: GameContract,
    actorId: string,
    depth: number
) {
    const legal = contract.getLegalMoves(state);
    if (legal.length === 0) return undefined;

    let bestMove = legal[0];
    let bestVal = -Infinity;

    for (const move of legal) {
        const next = contract.applyMove(cloneState(state), move);
        const val = minimax(next, contract, depth - 1, false, actorId);
        if (val > bestVal) {
            bestVal = val;
            bestMove = move;
        }
    }
    return bestMove;
}
