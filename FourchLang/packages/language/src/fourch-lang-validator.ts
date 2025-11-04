import type { ValidationChecks } from 'langium';
import type { FourchLangAstType } from './generated/ast.js'; //, Model
import type { FourchLangServices } from './fourch-lang-module.js';
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
        // Model : validator.checkNumberOfPlayers,
        // Grid : validator.checkGridSize,
        // Enemy : validator.checkEnemiesContinuity,

    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class FourchLangValidator {

    // TODO: Add logic here for validation checks of properties
    // See doc : https://langium.org/docs/learn/workflow/create_validations/
    /*
    checkElement(element: Element, accept: ValidationAcceptor): void {
        // Always accepts
    }
    */
    // checkNumberOfPlayers(model: Model, accept: ValidationAcceptor): void {
    //     if (!model.player || model.player.length === 0) {
    //         accept('error', 'At least one player must be defined.', { node: model });
    //     }
    // } // One player must be defined
    // checkPositionValues(): void {} // No negative numbers for coordinates and coordinates inside the map
    // checkGridSize(): void {} // Grid size must be > 2x2
    // checkSnakeContinuity(): void {} // Snake segments must be continuous (watch out for borders)
    // checkEnemiesContinuity(): void {} // Enemy segments must be continuous (watch out for borders)
    // checkNoOverlap(): void {} // No overlapping entities, maximum one entity per tile
    // checkGameOverConditions(): void {} // At least one game over condition must be defined
    // checkFruitConfiguration(): void {} // Fruits must have a valid configuration for the spawning behavior
    // checkEntitySpeed(): void {} // Speed values must be positive integers
    // checkEntitySize(): void {} // Size values must be positive integers
}
