export interface FourchGenerateOptions {
    target: "ascii" | "html" | "json" | "playable";
    playable: boolean;
    ai?: string;
    seed?: number;
    headless?: boolean;
}