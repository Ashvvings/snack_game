import os
import requests


def call_llm_openrouter(
    prompt: str,
    *,
    model: str = "mistralai/devstral-2512:free",
    temperature: float = 0.2,
    max_tokens: int = 128,
    seed: int = 42,
) -> str:
    api_key = os.environ["OPENROUTER_API_KEY"]
    url = os.environ.get(
        "OPENROUTER_BASE_URL",
        "https://openrouter.ai/api/v1/chat/completions",
    )

    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "seed": seed,
        "messages": [
            {
                "role": "system",
                "content": "You output ONE SINGLE LINE of strict JSON. No extra text.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    res = requests.post(url, json=payload, headers=headers, timeout=60)
    if not res.ok:
        raise RuntimeError(f"OpenRouter error: {res.status_code} - {res.text}")

    data = res.json()
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
    return text.strip()

import json
import re

def extract_move(response: str) -> str:
    """
    Extrait le 'move' du JSON LLM.
    Retourne: "UP", "DOWN", "LEFT", "RIGHT", "pass", "resign" ou "ERROR"
    """
    response = response.strip()
    
    if response.startswith("```"):
        lines = response.splitlines()
        if lines and lines.startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        response = "\n".join(lines).strip()
    
    try:
        data = json.loads(response)
        
        if "move" in data:
            return data["move"]
        
        if data.get("pass") is True:
            return "pass"
        if data.get("resign") is True:
            return "resign"
            
    except json.JSONDecodeError:
        match = re.search(r'"move"\s*:\s*"([^"]+)"', response, re.IGNORECASE)
        if match:
            return match.group(1)
    
    return "ERROR"



if __name__ == "__main__":

    prompt = """
    # RULES
    - Game: reforged Snake, objective is to survive and grow the longest possible.
    - Variant context: 1 fruit qui vaut 1 et un nouveau apparaît  aléatoirement toutes les 2 secondes. Le contact avec les bords provoquent la fin du jeu.
    - Symbols:
        - '#' = wall / border
        - 'F' = fruit
        - '0' = player-controlled snake head
        - 'S' = player snake body
        - 'M' = enemy head
        - 'X' = enemy body
        - '.' = empty cells
    - Move constraints: move must be one of ["UP", "DOWN", "RIGHT", "LEFT"].
    - End conditions: ['hitting border']

    # STATE
    The current grid is given as ASCII text between GRID_TXT_BEGIN and GRID_TXT_END.
    GRID_TXT_BEGIN
    # # # # # # # # # # #
    # . . . . . . . . . #
    # . . . . . . . . . #
    # . . . . . . . . . #
    # . S S O . . . . . #
    # . . . . . . . . . #
    # . . . . . . . . . #
    # . . . . . . . F . #
    # . . . . . . . . . #
    # . . . . . . . . . #
    # . . . . . . . . . #
    # # # # # # # # # # #
    GRID_TXT_END

    # LEGAL_MOVES
    All directions except the one that is the exact opposite of the current snake direction.
    Concrete list of allowed moves for THIS state:
    ['UP', 'DOWN', 'LEFT', 'RIGHT']

    # OUTPUT SCHEMA (strict)
    {"move":"UP","explain":"optional, single sentence"} or {"pass":true} or {"resign":true}
    """
    
    try:
        result = call_llm_openrouter(prompt, max_tokens=300)
        print("Réponse brute :", result)
        
        move = extract_move(result)
        print(f"🎮 MOVE EXTRAIT : '{move}'")
    except Exception as e:
        print(f"Erreur : {e}")