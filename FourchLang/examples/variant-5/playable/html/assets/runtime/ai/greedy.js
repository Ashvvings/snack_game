function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}
export function greedyMove(state, contract, actorId) {
    const legal = contract.getLegalMoves(state);
    if (legal.length === 0)
        return undefined;
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
//# sourceMappingURL=greedy.js.map