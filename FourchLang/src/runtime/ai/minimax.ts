import type { GameState } from "../core/types.js";
import type { GameContract } from "../core/contract.js";
import type { Move } from "../core/types.js";

import { greedyMove } from "./greedy.js";
import { randomMove } from "./random.js";

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

function hasAnyEnemy(state: GameState): boolean {
  return Object.values(state.snakes).some((s) => s && s.alive && s.isPlayerControlled === false);
}

/**
 * Politique ennemie : greedy puis random.
 * Si l'acteur courant n'est pas un ennemi (ou s'il n'y a pas d'ennemi), retourne undefined.
 */
function pickEnemyMove(state: GameState, contract: GameContract): Move | undefined {
  const actor = state.snakes[state.currentActorId];
  if (!actor) return undefined;

  // Si ce n'est pas un ennemi, on ne choisit rien ici
  if (actor.isPlayerControlled) return undefined;

  // S'il n'y a aucun ennemi (cas rare si l'acteur est encore marqué ennemi), idem
  if (!hasAnyEnemy(state)) return undefined;

  return greedyMove(state, contract, actor.id) ?? randomMove(state, contract);
}

function minimaxPlayerVsPolicy(
  state: GameState,
  contract: GameContract,
  playerId: string,
  depth: number
): number {
  const result = contract.getResult(state);
  if (depth <= 0 || result.over || state.isTerminal) {
    return contract.evaluate(state, playerId);
  }

  const legal = contract.getLegalMoves(state);
  if (legal.length === 0) {
    return contract.evaluate(state, playerId);
  }

  const currentId = state.currentActorId;

  // ------------------------------------------------------------
  // Tour du joueur : maximise
  // ------------------------------------------------------------
  if (currentId === playerId) {
    let best = -Infinity;

    for (const mv of legal) {
      const next = contract.applyMove(cloneState(state), mv);
      const val = minimaxPlayerVsPolicy(next, contract, playerId, depth - 1);
      if (val > best) best = val;
    }

    return best;
  }

  // ------------------------------------------------------------
  // Tour non-joueur (ennemi) : applique une policy si possible.
  // Si pas d'ennemi / pas de move -> on retombe sur evaluate.
  // ------------------------------------------------------------
  const enemyMove = pickEnemyMove(state, contract);
  if (!enemyMove) {
    return contract.evaluate(state, playerId);
  }

  const next = contract.applyMove(cloneState(state), enemyMove);
  return minimaxPlayerVsPolicy(next, contract, playerId, depth - 1);
}

export function minimaxMove(
  state: GameState,
  contract: GameContract,
  actorId: string,
  depth: number
) {
  // Minimax = IA du joueur. Si ce n'est pas son tour, on ne choisit pas.
  if (state.currentActorId !== actorId) return undefined;

  const legal = contract.getLegalMoves(state);
  if (legal.length === 0) return undefined;

  let bestMove = legal[0];
  let bestVal = -Infinity;

  for (const mv of legal) {
    const next = contract.applyMove(cloneState(state), mv);
    const val = minimaxPlayerVsPolicy(next, contract, actorId, depth - 1);

    if (val > bestVal) {
      bestVal = val;
      bestMove = mv;
    }
  }

  return bestMove;
}