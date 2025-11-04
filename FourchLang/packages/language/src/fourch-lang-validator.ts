import type { ValidationChecks, ValidationAcceptor } from 'langium';
import type { FourchLangAstType, Grid, Model, FruitConfiguration, Player, Enemy } from './generated/ast.js';
import type { FourchLangServices } from './fourch-lang-module.js';
import { isEnemy } from './generated/ast.js';

/*
/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: FourchLangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.FourchLangValidator;
    
    const checks: ValidationChecks<FourchLangAstType> = {
        // TODO: Declare validators for your properties
        // See doc : 
        Model: [
            validator.checkNumberOfPlayers,
            validator.checkGameOverConditions,
            validator.checkPositionValues,
            validator.checkNoOverlap
        ],
        Grid: [
            validator.checkGridSize
        ],
        Player: [
            validator.checkEntitySpeed,
            validator.checkEntitySize,
            validator.checkSnakeContinuity
        ],
        Enemy: [
            validator.checkEntitySpeed,
            validator.checkEntitySize,
            validator.checkEnemiesContinuity
        ],
        FruitConfiguration: [
            validator.checkFruitConfiguration
        ]

    };

    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class FourchLangValidator {

    // TODO: Add logic here for validation checks of properties
    // See doc : https://langium.org/docs/learn/workflow/create_validations/

    // Vérifie qu'il y a exactement un joueur défini dans le modèle.
    checkNumberOfPlayers(model: Model, accept: ValidationAcceptor): void {
        const playerCount = model.player?.length ?? 0;

        if (playerCount === 0) {
            accept('error', 'Exactly one player must be defined (none found).', { node: model });
        } else if (playerCount > 1) {
            accept('error', `Exactly one player must be defined (${playerCount} found).`, { node: model });
        }
    }
    
    // No negative numbers for coordinates and coordinates inside the map
    checkPositionValues(model: Model, accept: ValidationAcceptor): void {
        // Only one grid defined
        const grid: Grid | undefined = model.grid?.[0];
        const maxX = grid ? parseInt(grid.x, 10) : undefined;
        const maxY = grid ? parseInt(grid.y, 10) : undefined;

        // Element with coordinates list
        const elementsWithCoords = [
            ...(model.player ?? []),
            ...(model.enemies ?? []),
            ...(model.fruits ?? []),
            ...(model.walls ?? []),
            ...(model.snakeBodies ?? []),
            ...(model.enemyBodies ?? [])
        ];

        for (const element of elementsWithCoords) {
            const x = parseInt((element as any).x, 10);
            const y = parseInt((element as any).y, 10);

            // Verify negatives value
            if (x < 0 || y < 0) {
                accept('error', `Negative coordinates are not allowed (x=${x}, y=${y}).`, { node: element });
            }

            // Verify grid limit
            if (maxX !== undefined && maxY !== undefined) {
                if (x >= maxX || y >= maxY) {
                    accept(
                        'error',
                        `Coordinates (x=${x}, y=${y}) are outside the grid boundaries (${maxX}x${maxY}).`,
                        { node: element }
                    );
                }
            }
        }
    }

    checkGridSize(grid:Grid, accept: ValidationAcceptor): void { // Grid size must be >= 2x2
        if (Number(grid.x) < 2 || Number(grid.y) < 2) {
            accept('error', 'The size of the grid must be at least 2x2.', { node: grid });
        }
    }
    // Snake segments must be continuous (watch out for borders) (watch out the body should have only one parent and one descendant max)
    checkSnakeContinuity(player: Player, accept: ValidationAcceptor): void {
        // Recherche les SnakeBody dont le parent est ce player
        // Suppose que player.name existe pour l’identification
        const allSnakeBodies = player.$container.snakeBodies ?? [];
        // Filtre les SnakeBodies qui suivent ce Player
        const children = allSnakeBodies.filter(sb => sb.parent && sb.parent.ref === player);

        for (const body of children) {
            const x = Number(body.x);
            const y = Number(body.y);
            const parentX = Number(player.x);
            const parentY = Number(player.y);

            // Vérifie l’adjacence
            if ((Math.abs(x - parentX) + Math.abs(y - parentY)) !== 1) {
                accept('error', 'Snake body must be adjacent to the player.', { node: body });
            }
        }
        // Si le serpent est plus long (chaîne de SnakeBodies), rajoute une boucle pour chaque segment parent/enfant
    }
 
    // Enemy segments must be continuous (watch out for borders) (watch out the body should have only one parent and one descendant max)
    checkEnemiesContinuity(enemy: Enemy, accept: ValidationAcceptor): void {
        // Recherche les EnemyBody qui suivent cet enemy
        const allEnemyBodies = enemy.$container.enemyBodies ?? [];
        const children = allEnemyBodies.filter(eb => eb.parent && eb.parent.ref === enemy);

        for (const body of children) {
            const x = Number(body.x);
            const y = Number(body.y);
            const parentX = Number(enemy.x);
            const parentY = Number(enemy.y);

            if ((Math.abs(x - parentX) + Math.abs(y - parentY)) !== 1) {
                accept('error', 'Enemy body must be adjacent to its parent enemy.', { node: body });
            }
        }
        // Rajoute une vérification pour chaque segment parent/enfant si EnemyBody forme une chaîne
    }
 
    
    // No overlapping entities, maximum one entity per tile
    checkNoOverlap(model: Model, accept: ValidationAcceptor): void {
        // Récupère toutes les entités avec des coordonnées
        const entities = [
            ...(model.player ?? []),
            ...(model.enemies ?? []),
            ...(model.snakeBodies ?? []),
            ...(model.enemyBodies ?? []),
            ...(model.walls ?? []),
            ...(model.fruits ?? [])
        ];
        
        // Map des positions occupées
        const positions = new Map<string, string>();

        for (const entity of entities) {
            // Vérifie que x et y existent et sont des nombres entiers
            if (typeof entity.x === 'number' && typeof entity.y === 'number') {
                const key = `${entity.x},${entity.y}`;
                if (positions.has(key)) {
                    // Génère une erreur : case déjà occupée
                    accept('error', `Overlap detected: more than one entity at (${key}).`, { node: entity });
                } else {
                    // Enregistre qui occupe cette case
                    positions.set(key, entity.$type ?? 'entity');
                }
            }
        }
    }

    // At least one game over condition must be defined
    checkGameOverConditions(model: Model, accept: ValidationAcceptor): void {
        const conditions = model.game_over_conditions ?? [];

        if (conditions.length === 0) {
            accept(
                'error',
                'At least one game over condition must be defined (e.g. hitting border, enemy, or snake body).',
                { node: model }
            );
        }
    } 
    
    // Fruits must have a valid configuration for the spawning behavior
    checkFruitConfiguration(config: FruitConfiguration, accept: ValidationAcceptor): void {
        const growthLength = config.growthLength ? parseInt(config.growthLength, 10) : undefined;
        const seconds = config.seconds ? parseInt(config.seconds, 10) : undefined;

        // Cas 1 : reappear = true → seconds doit exister et être positif
        if (config.reappear) {
            if (seconds === undefined || isNaN(seconds) || seconds <= 0) {
                accept(
                    'error',
                    'When "reappear" is true, "seconds" must be a positive number.',
                    { node: config, property: 'seconds' }
                );
            }
        } 
        // Cas 2 : reappear = false → seconds ne doit pas être défini
        else if (seconds !== undefined) {
            accept(
                'warning',
                'When "reappear" is false, "seconds" should not be defined.',
                { node: config, property: 'seconds' }
            );
        }

        // Cas 3 : growthLength doit être positif s’il est défini
        if (growthLength !== undefined && (isNaN(growthLength) || growthLength <= 0)) {
            accept(
                'error',
                '"growthLength" must be a positive integer if defined.',
                { node: config, property: 'growthLength' }
            );
        }
    }
    
    // Speed values must be positive integers
    checkEntitySpeed(node: Player | Enemy, accept: ValidationAcceptor): void {
        // Vérifie si la propriété speed est définie
        const speedStr = (node as Player | Enemy).speed;

        if (speedStr === undefined) {
            // Optionnel : décommente si tu veux rendre la vitesse obligatoire
            // const who = isEnemy(node) ? 'Enemy' : 'Player';
            // accept('error', `${who} speed must be defined.`, { node });
            return;
        }

        const speedValue = parseInt(speedStr, 10);

        if (isNaN(speedValue) || speedValue <= 0) {
            const who = isEnemy(node) ? 'Enemy' : 'Player';
            accept('error', `${who} speed must be a positive integer.`, { node, property: 'speed' });
        }
    }

    // Size values must be positive integers
    checkEntitySize(node: Player | Enemy, accept: ValidationAcceptor): void {
        // Les deux types ont une propriété optionnelle "len" (string)
        const lenStr = (node as Player | Enemy).len;
        if (lenStr !== undefined) {
            const sizeValue = parseInt(lenStr, 10);
            if (isNaN(sizeValue) || sizeValue <= 0) {
                const who = isEnemy(node) ? 'Enemy' : 'Player';
                accept('error', `${who} size must be a positive integer.`, { node, property: 'len' });
                return;
            }

            // Récupère la grille via le container du nœud
            const model = node.$container; // type: Model
            const grid: Grid | undefined = model.grid?.[0];
            if (grid) {
                const gridX = parseInt(grid.x, 10);
                const gridY = parseInt(grid.y, 10);
                if (!isNaN(gridX) && !isNaN(gridY) && gridX > 0 && gridY > 0) {
                    const maxGridSize = gridX * gridY;
                    if (sizeValue > maxGridSize) {
                        const who = isEnemy(node) ? 'Enemy' : 'Player';
                        accept(
                            'error',
                            `${who} size (${sizeValue}) cannot exceed grid size (${maxGridSize}).`,
                            { node, property: 'len' }
                        );
                    }
                }
            }
        }
    }
}
