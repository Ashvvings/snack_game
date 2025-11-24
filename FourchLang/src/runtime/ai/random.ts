import type { GameState } from "../core/types.js";
import type { GameContract } from "../core/contract.js";

export function randomMove(
    state: GameState,
    contract: GameContract
) {
    const legal = contract.getLegalMoves(state);
    if (legal.length === 0) return undefined;
    const idx = Math.floor(Math.random() * legal.length);
    return legal[idx];
}
