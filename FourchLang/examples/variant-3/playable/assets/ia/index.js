window.FourchIA = {
    random: {
        compute: (grid, enemy, ctx) => {
            const dirs = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ];
            return dirs[Math.floor(Math.random() * dirs.length)];
        }
    },

    // IA simple : va vers le joueur
    greedy: {
        compute: (grid, enemy, ctx) => {
            const dx = Math.sign(ctx.player.x - enemy.x);
            const dy = Math.sign(ctx.player.y - enemy.y);
            if (Math.abs(ctx.player.x - enemy.x) > Math.abs(ctx.player.y - enemy.y)) {
                return { x: dx, y: 0 };
            } else {
                return { x: 0, y: dy };
            }
        }
    }
};
