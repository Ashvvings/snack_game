import type { PlayableGameInit } from "./playableTypes.js";
import type { GameState } from "./types.js";

export function fromPlayableInit(init: PlayableGameInit): GameState {
    const snakesRecord: GameState["snakes"] = {};
    for (const s of init.snakes) {
        snakesRecord[s.id] = {
            id: s.id,
            isPlayerControlled: s.isPlayerControlled,
            color: s.color,
            body: s.body,
            alive: true
        };
    }

    const firstId = init.snakes[0]?.id ?? "player";

    return {
        turn: 0,
        currentActorId: firstId,
        snakes: snakesRecord,
        walls: init.walls,
        fruits: init.fruits,
        config: init.config,
        isTerminal: false
    };
}
