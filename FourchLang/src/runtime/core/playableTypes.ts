import type {GameConfig, Pos, Snake} from "./types.js";

export interface PlayableSnakeInit {
    id: string;
    isPlayerControlled: boolean;
    color: string;
    body: Pos[];
}

export interface PlayableConfig {
    width: number;
    height: number;
    wrapX: boolean;
    wrapY: boolean;
    fruitGrowth: number;
    gameOverOn: Array<"wall" | "enemy" | "self" | "border">;
}

export interface PlayableGameInit {
    config: GameConfig;   // toutes les règles du DSL
    snakes: Snake[];      // player + enemy + body déjà chaînés
    walls: Pos[];
    fruits: Pos[];
}