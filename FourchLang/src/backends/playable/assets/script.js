import { fromPlayableInit } from "./runtime/core/fromPlayableInit.js";
import { snakeContract } from "./runtime/core/snakeRules.js";

// --- Récupération du canvas ---
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

// --- Boutons ---
const btnRandom = document.getElementById("btn-random");
const btnGreedy = document.getElementById("btn-greedy");
const btnReset = document.getElementById("btn-reset");

// --- Construction état initial depuis le JSON injecté ---
let initialState = fromPlayableInit(window.FOURCH_INIT);
let state = structuredClone(initialState);

// ===============================================================
//  FONCTION DE RENDU DE LA GRILLE
// ===============================================================
function render() {
    const { width, height } = state.config;

    const cellW = canvas.width / width;
    const cellH = canvas.height / height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // -- grille ---
    ctx.strokeStyle = "white";
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            ctx.strokeRect(x * cellW, y * cellH, cellW, cellH);
        }
    }

    // -- murs ---
    ctx.fillStyle = "gray";
    state.walls.forEach(w => {
        ctx.fillRect(w.x * cellW, w.y * cellH, cellW, cellH);
    });

    // -- fruits ---
    state.fruits.forEach(f => {
        ctx.fillStyle = "magenta";
        ctx.beginPath();
        ctx.arc(
            (f.x + 0.5) * cellW,
            (f.y + 0.5) * cellH,
            Math.min(cellW, cellH) / 3,
            0, Math.PI * 2
        );
        ctx.fill();
    });

    // -- snake(s) ---
    Object.values(state.snakes).forEach(s => {
        ctx.fillStyle = s.color;
        s.body.forEach(seg => {
            ctx.fillRect(seg.x * cellW, seg.y * cellH, cellW, cellH);
        });
    });
}

// Première frame
render();

// ===============================================================
//  IA RANDOM
// ===============================================================
function aiRandomStep() {
    const legal = snakeContract.getLegalMoves(state);
    if (legal.length === 0) return;

    const choice = legal[Math.floor(Math.random() * legal.length)];
    state = snakeContract.applyMove(state, choice);
    render();
}

// ===============================================================
//  IA GREEDY (depth 1)
// ===============================================================
function aiGreedyStep() {
    const legal = snakeContract.getLegalMoves(state);
    if (legal.length === 0) return;

    let best = null;
    let bestScore = -Infinity;

    for (const mv of legal) {
        const next = snakeContract.applyMove(structuredClone(state), mv);
        const score = snakeContract.evaluate(next, state.currentActorId);

        if (score > bestScore) {
            bestScore = score;
            best = mv;
        }
    }

    if (best) {
        state = snakeContract.applyMove(state, best);
    }

    render();
}

// ===============================================================
//  RESET
// ===============================================================
btnReset.addEventListener("click", () => {
    state = structuredClone(initialState);
    render();
});

btnRandom.addEventListener("click", aiRandomStep);
btnGreedy.addEventListener("click", aiGreedyStep);

// ===============================================================
//  MOUVEMENT CLAVIER (facultatif)
// ===============================================================
document.addEventListener("keydown", (e) => {
    const map = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
    };

    if (!map[e.key]) return;
    const dir = map[e.key];

    const moves = snakeContract.getLegalMoves(state);
    const move = moves.find(m => m.direction === dir);

    if (move) {
        state = snakeContract.applyMove(state, move);
        render();
    }
});
