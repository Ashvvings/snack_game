// src/game/loop.ts (ou équivalent)
import { promises as fs } from "fs";
import { buildSnakePromptFromGrid } from "../llm/prompt.ts";
import { callLLMOpenRouter } from "../llm/runner/openrouter.ts";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

async function playTurnWithLLM(gameState: GameState, variantConfig: VariantConfig, llmParams: {
  model: string;
  temperature?: number;
  maxTokens?: number;
  seed?: number;
}) {
  // 1) Lire la grille
  const gridText = await fs.readFile("grid.txt", "utf8");

  // 2) Calculer les directions légales pour CE tour
  const legalMoves: Direction[] = computeLegalMovesDirections(gameState); // à partir de ta logique existante

  // 3) Construire le prompt
  const prompt = buildSnakePromptFromGrid({
    gridText,
    legalMoves,
    variantContext: "Reforged snake with enemies ('M'/'X') and fruits 'F'.",
    endConditions: "As defined by playable_python gameOverConditions for this variant."
  });

  // 4) Appel OpenRouter
  const jsonLine = await callLLMOpenRouter(prompt, {
    model: llmParams.model,
    temperature: llmParams.temperature,
    maxTokens: llmParams.maxTokens,
    seed: llmParams.seed
  });

  // 5) Parser et appliquer
  const obj = JSON.parse(jsonLine) as { move?: Direction; pass?: boolean; resign?: boolean; explain?: string };

  // vérifier que obj.move est dans legalMoves, sinon gérer pass / réparation
  if (obj.move && legalMoves.includes(obj.move)) {
    applyDirectionMove(gameState, obj.move); // ta fonction interne
  } else if (obj.pass) {
    // perte de tour
  } else {
    // coup illégal -> soit tentative de réparation, soit perte de tour
  }
}
