function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}
function minimax(state, contract, depth, maximizing, actorId) {
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
            if (val > best)
                best = val;
        }
        return best;
    }
    else {
        let best = Infinity;
        for (const move of legal) {
            const next = contract.applyMove(cloneState(state), move);
            const val = minimax(next, contract, depth - 1, true, actorId);
            if (val < best)
                best = val;
        }
        return best;
    }
}
export function minimaxMove(state, contract, actorId, depth) {
    const legal = contract.getLegalMoves(state);
    if (legal.length === 0)
        return undefined;
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
//# sourceMappingURL=minimax.js.map