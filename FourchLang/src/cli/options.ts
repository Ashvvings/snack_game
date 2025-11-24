export interface FourchGenerateOptions {
    target?: string;              // ascii | html | playable ...
    ai?: string;                  // random | greedy | minimax:2
    seed?: number;
    headless?: boolean;
}
