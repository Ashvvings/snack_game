export function randomMove(state, contract) {
    const legal = contract.getLegalMoves(state);
    if (legal.length === 0)
        return undefined;
    const idx = Math.floor(Math.random() * legal.length);
    return legal[idx];
}
//# sourceMappingURL=random.js.map