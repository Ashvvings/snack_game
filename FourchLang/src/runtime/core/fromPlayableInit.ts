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
      alive: true,
    };
  }

  const firstId = init.snakes[0]?.id ?? "player";

  const anyInit = init as any;
  const config: any = { ...(init.config as any) };
  if (config.gameMode == null && anyInit.gameMode != null) {
    config.gameMode = anyInit.gameMode;
  }

  return {
    turn: 0,
    currentActorId: firstId,
    snakes: snakesRecord,
    walls: init.walls,
    fruits: init.fruits,
    config,
    isTerminal: false,
    score: 0,
  };
}
