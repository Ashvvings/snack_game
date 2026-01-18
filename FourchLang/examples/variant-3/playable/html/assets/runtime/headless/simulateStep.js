// src/runtime/headless/simulateStep.ts
import * as fs from "node:fs";
import * as path from "node:path";
import { fromPlayableInit } from "../core/fromPlayableInit.js";
import { snakeContract } from "../core/snakeRules.js";
import { randomMove } from "../ai/random.js";
import { greedyMove } from "../ai/greedy.js";
import { minimaxMove } from "../ai/minimax.js";
function setSeed(seed) {
    let s = seed;
    Math.random = () => {
        // LCG très basique, suffisant pour la repro
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}
export async function simulateStep(opts) {
    const jsonPath = path.join(opts.outDir, "game.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const init = JSON.parse(raw);
    const state = fromPlayableInit(init);
    setSeed(opts.seed);
    // Pour la démonstration : IA contrôle tous les snakes non joueurs
    const actorId = state.currentActorId;
    const move = pickMoveByAiSpec(state, actorId, opts.aiSpec);
    const next = move
        ? snakeContract.applyMove(state, move)
        : state;
    const out = {
        ai: opts.aiSpec,
        seed: opts.seed,
        moveChosen: move,
        stateBefore: state,
        stateAfter: next
    };
    fs.writeFileSync(path.join(opts.outDir, "next_state.json"), JSON.stringify(out, null, 2), "utf-8");
}
function pickMoveByAiSpec(state, actorId, spec) {
    if (spec === "random") {
        return randomMove(state, snakeContract);
    }
    if (spec === "greedy") {
        return greedyMove(state, snakeContract, actorId);
    }
    if (spec.startsWith("minimax:")) {
        const depth = Number(spec.split(":")[1] ?? 2);
        return minimaxMove(state, snakeContract, actorId, depth);
    }
    // fallback
    return randomMove(state, snakeContract);
}
//# sourceMappingURL=simulateStep.js.map