import type { GameState, Move } from "./types.js";

export interface GameResult {
    over: boolean;
    winnerId?: string;
    reason?: string;
}

export interface GameContract {
    getLegalMoves(state: GameState): Move[];
    applyMove(state: GameState, move: Move): GameState;
    getResult(state: GameState): GameResult;
    evaluate(state: GameState, forActorId: string): number;
}
