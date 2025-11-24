/* ============================
   Positions & directions
============================ */

export interface Pos {
    x: number;
    y: number;
}

export type Direction = "up" | "down" | "left" | "right";

/* ============================
   Snakes (player + enemies)
============================ */

export interface Snake {
    id: string;                  // "player", "enemy-1", …
    isPlayerControlled: boolean;
    color: string;
    body: Pos[];                 // [0] = tête
    alive: boolean;
}

/* ============================
   Fruit respawn rules (from DSL)
============================ */

export interface FruitRespawnConfig {
    enabled: boolean;            // DSL: "reappear"
    frequencySeconds?: number;   // DSL: "every X seconds"
    onEaten: boolean;            // DSL: "when eaten"
}

/* ============================
   Game rules from DSL
============================ */

export interface GameConfig {
    width: number;
    height: number;

    wrapX: boolean;              // DSL: border horizontally crossable
    wrapY: boolean;              // DSL: border vertically crossable

    growthLength: number;        // DSL: fruits grow snake by N

    fruitRespawn: FruitRespawnConfig;

    gameOverOn: Array<"wall" | "enemy" | "self" | "border" | "snake_body">;
}

export interface PlayableGameInit {
    config: GameConfig;
    snakes: Snake[];
    walls: Pos[];
    fruits: Pos[];
}

/* ============================
   Game state runtime
============================ */

export interface GameState {
    turn: number;
    currentActorId: string;      // id du snake dont c’est le tour

    snakes: Record<string, Snake>;

    walls: Pos[];
    fruits: Pos[];

    config: GameConfig;

    isTerminal: boolean;
    winnerId?: string;
    reason?: string;
}

/* ============================
   Moves given to the contract
============================ */

export interface Move {
    id: string;
    label: string;               // "UP", "LEFT", ...
    actorId: string;
    direction: Direction;
}
