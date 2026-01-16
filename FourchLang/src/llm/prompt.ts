
export function buildSnakePromptFromGrid(options: {
  gridText: string;
  legalMoves: string[];    // ex. ["UP","RIGHT","DOWN"]
  variantContext: string;  // description courte de la variante
  endConditions: string;   // venant de playable_python
}): string {
  const { gridText, legalMoves, variantContext, endConditions } = options;

  return [
    "# RULES",
    "- Game: reforged Snake, objective is to survive and grow the longest possible.",
    "- Symbols:",
    "  - '#' = wall / border",
    "  - 'F' = fruit",
    "  - '0' = player-controlled snake head",
    "  - 'S' = player snake body",
    "  - 'M' = enemy head",
    "  - 'X' = enemy body",
    "  - '.' = empty cells",
    "- Move constraints: move must be one of [\"UP\", \"DOWN\", \"RIGHT\", \"LEFT\"].",
    `- End conditions: ${endConditions}`,
    `- Variant context: ${variantContext}`,
    "",
    "# STATE",
    "The current grid is given as ASCII text between GRID_TXT_BEGIN and GRID_TXT_END.",
    "GRID_TXT_BEGIN",
    gridText.trim(),
    "GRID_TXT_END",
    "",
    "# LEGAL_MOVES",
    "All directions except the one that is the exact opposite of the current snake direction.",
    "Concrete list of allowed moves for THIS state:",
    JSON.stringify(legalMoves),
    "",
    "# OUTPUT SCHEMA (strict)",
    `{"move":"UP","explain":"optional, single sentence"}`,
    "or {\"pass\":true} or {\"resign\":true}"
  ].join("\n");
}
