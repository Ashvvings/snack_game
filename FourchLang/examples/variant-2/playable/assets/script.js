// assets/script.js
import { fromPlayableInit } from "./runtime/core/fromPlayableInit.js";
import { snakeContract } from "./runtime/core/snakeRules.js";

import { randomMove } from "./runtime/ai/random.js";
import { greedyMove } from "./runtime/ai/greedy.js";
import { minimaxMove } from "./runtime/ai/minimax.js";

// --- Récupération du canvas ---
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

// --- Boutons ---
const btnRandom = document.getElementById("btn-random");
const btnGreedy = document.getElementById("btn-greedy");
const btnMinimax = document.getElementById("btn-minimax");
const btnReset = document.getElementById("btn-reset");

const autoSelect = document.getElementById("auto-ai");
const btnAutoStart = document.getElementById("btn-auto-start");
const btnAutoStop = document.getElementById("btn-auto-stop");

// Slider vitesse (min 0.2s, max 1.0s) + label
const speedEl = document.getElementById("speed");
const speedLabelEl = document.getElementById("speed-label");

const gameoverEl = document.getElementById("gameover");
const btnRestart = document.getElementById("btn-restart");

let gameIsOver = false;

// Auto-play
let autoTimer = null; // setInterval id
let autoRunning = false;
const MINIMAX_DEPTH = 3;

// ===============================================================
//  SCORE (HUD)
// ===============================================================
const scoreEl = document.getElementById("score");
function updateHud() {
  if (scoreEl) scoreEl.textContent = String(state?.score ?? 0);
}

// ===============================================================
//  VITESSE (slider)
// ===============================================================
function getTickMs() {
  const v = Number(speedEl?.value ?? 1000);
  return Math.max(200, Math.min(1000, v));
}

function updateSpeedLabel() {
  const ms = getTickMs();
  if (speedLabelEl) speedLabelEl.textContent = `${(ms / 1000).toFixed(1)}s`;
}

// ===============================================================
//  COULEURS (fallbacks + tête plus foncée)
// ===============================================================
function normalizeHexColor(color, fallback) {
  if (!color) return fallback;
  const c = String(color).trim();

  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    const r = c[1], g = c[2], b = c[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toUpperCase();
  return fallback;
}

function darkenHex(hex, amount = 0.35) {
  const h = normalizeHexColor(hex, "#6DD66D");
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);

  const factor = 1 - Math.max(0, Math.min(1, amount));
  const rr = Math.max(0, Math.min(255, Math.round(r * factor)));
  const gg = Math.max(0, Math.min(255, Math.round(g * factor)));
  const bb = Math.max(0, Math.min(255, Math.round(b * factor)));

  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb
    .toString(16)
    .padStart(2, "0")}`.toUpperCase();
}

function ensureSnakeColors(st) {
  const snakes = Object.values(st.snakes ?? {});
  if (snakes.length === 0) return;

  const enemies = snakes.filter((s) => s.isPlayerControlled === false);
  const hasEnemies = enemies.length > 0;

  for (const s of snakes) {
    const isEnemy = s.isPlayerControlled === false;
    if (!hasEnemies && isEnemy) continue;

    if (!s.color) {
      if (isEnemy) s.color = "#EF4444";
      else s.color = "#6DD66D";
    } else {
      s.color = normalizeHexColor(s.color, s.color);
    }

    if (!s.headColor) {
      const bodyHex = normalizeHexColor(s.color, isEnemy ? "#EF4444" : "#6DD66D");
      s.headColor = darkenHex(bodyHex, 0.35);
    } else {
      s.headColor = normalizeHexColor(s.headColor, s.headColor);
    }
  }
}

// --- Construction état initial depuis le JSON injecté ---
const initialState = fromPlayableInit(window.FOURCH_INIT);
let state = structuredClone(initialState);

ensureSnakeColors(state);

// init slider label
updateSpeedLabel();

// Si on change la vitesse pendant l'auto => on redémarre l'interval
if (speedEl) {
  speedEl.addEventListener("input", () => {
    updateSpeedLabel();
    if (autoRunning) {
      stopAuto();
      startAuto();
    }
  });
}

// ===============================================================
//  RENDU
// ===============================================================
function render() {
  const { width, height } = state.config;
  const cellW = canvas.width / width;
  const cellH = canvas.height / height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // grille
  ctx.strokeStyle = "white";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.strokeRect(x * cellW, y * cellH, cellW, cellH);
    }
  }

  // murs
  ctx.fillStyle = "gray";
  state.walls.forEach((w) => {
    ctx.fillRect(w.x * cellW, w.y * cellH, cellW, cellH);
  });

  // fruits
  state.fruits.forEach((f) => {
    ctx.fillStyle = "magenta";
    ctx.beginPath();
    ctx.arc(
      (f.x + 0.5) * cellW,
      (f.y + 0.5) * cellH,
      Math.min(cellW, cellH) / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });

  // snakes
  Object.values(state.snakes).forEach((s) => {
    const headColor = s.headColor ?? darkenHex(s.color ?? "#6DD66D", 0.35);
    const bodyColor = s.color ?? "#6DD66D";

    s.body.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? headColor : bodyColor;
      ctx.fillRect(seg.x * cellW, seg.y * cellH, cellW, cellH);
    });
  });

  updateHud();
}

render();

// ===============================================================
//  GAME OVER
// ===============================================================
function showGameOver() {
  gameIsOver = true;
  gameoverEl.classList.remove("hidden");
  stopAuto(); // stop auto si game over
}

function hideGameOver() {
  gameIsOver = false;
  gameoverEl.classList.add("hidden");
}

function checkAndShowGameOver() {
  if (state?.isTerminal) {
    showGameOver();
    return true;
  }
  const legal = snakeContract.getLegalMoves(state);
  if (!legal || legal.length === 0) {
    showGameOver();
    return true;
  }
  return false;
}

// ===============================================================
//  ENNEMIS : jouent jusqu'au retour au joueur
// ===============================================================
function runEnemyTurns() {
  while (!gameIsOver && !state.isTerminal) {
    const actor = state.snakes[state.currentActorId];
    if (!actor) break;
    if (actor.isPlayerControlled) break;

    const mv = greedyMove(state, snakeContract, actor.id) ?? randomMove(state, snakeContract);
    if (!mv) break;

    state = snakeContract.applyMove(state, mv);
    ensureSnakeColors(state);
    render();

    if (checkAndShowGameOver()) break;
  }
}

// ===============================================================
//  EXEC IA (joueur) (tour par tour)
// ===============================================================
function applyAiStep(pickMoveFn) {
  if (gameIsOver) return;
  if (checkAndShowGameOver()) return;

  const actorId = state.currentActorId;
  const actor = state.snakes[actorId];

  if (!actor || !actor.isPlayerControlled) {
    runEnemyTurns();
    return;
  }

  const move = pickMoveFn(state, snakeContract, actorId);
  if (!move) {
    showGameOver();
    return;
  }

  state = snakeContract.applyMove(state, move);
  ensureSnakeColors(state);
  render();

  if (!checkAndShowGameOver()) runEnemyTurns();
}

// IA joueur disponibles
const IA = {
  random: (st, contract) => randomMove(st, contract),
  greedy: (st, contract, actorId) => greedyMove(st, contract, actorId),
  minimax: (st, contract, actorId) => minimaxMove(st, contract, actorId, MINIMAX_DEPTH),
};

// Boutons IA (one-shot)
btnRandom.addEventListener("click", () => applyAiStep(IA.random));
btnGreedy.addEventListener("click", () => applyAiStep(IA.greedy));
btnMinimax.addEventListener("click", () => applyAiStep(IA.minimax));

// ===============================================================
//  AUTO-PLAY : tick = 1 coup joueur (IA choisie) + tours ennemis
// ===============================================================
function startAuto() {
  if (autoRunning) return;
  autoRunning = true;

  if (btnAutoStart) btnAutoStart.disabled = true;
  if (btnAutoStop) btnAutoStop.disabled = false;

  autoTimer = setInterval(() => {
    if (gameIsOver) {
      stopAuto();
      return;
    }

    const actor = state.snakes[state.currentActorId];
    if (!actor) {
      stopAuto();
      return;
    }

    // Si ce n'est pas au joueur, on fait d'abord jouer les ennemis
    if (!actor.isPlayerControlled) {
      runEnemyTurns();
      return;
    }

    const selected = autoSelect?.value ?? "greedy";
    const fn = IA[selected] ?? IA.greedy;

    applyAiStep(fn);
  }, getTickMs());
}

function stopAuto() {
  autoRunning = false;
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  if (btnAutoStart) btnAutoStart.disabled = false;
  if (btnAutoStop) btnAutoStop.disabled = true;
}

if (btnAutoStart) btnAutoStart.addEventListener("click", startAuto);
if (btnAutoStop) btnAutoStop.addEventListener("click", stopAuto);

// ===============================================================
//  RESET / RESTART
// ===============================================================
function resetGame() {
  stopAuto();
  state = structuredClone(initialState);
  ensureSnakeColors(state);
  hideGameOver();
  render();
}

btnReset.addEventListener("click", resetGame);
btnRestart.addEventListener("click", resetGame);

// ===============================================================
//  CLAVIER (tour par tour manuel)
// ===============================================================
document.addEventListener("keydown", (e) => {
  if (gameIsOver) return;
  if (autoRunning) return; // pendant auto, on évite les inputs manuels

  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  if (!map[e.key]) return;

  if (checkAndShowGameOver()) return;

  const actor = state.snakes[state.currentActorId];
  if (!actor || !actor.isPlayerControlled) {
    runEnemyTurns();
    return;
  }

  const dir = map[e.key];
  const moves = snakeContract.getLegalMoves(state);
  const move = moves.find((m) => m.direction === dir);

  if (move) {
    state = snakeContract.applyMove(state, move);
    ensureSnakeColors(state);
    render();
    if (!checkAndShowGameOver()) runEnemyTurns();
  }

  checkAndShowGameOver();
});
