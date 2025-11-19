import type { ValidationChecks } from 'langium';
import type { FourchLangAstType } from './generated/ast.js';
import type { FourchLangServices } from './fourch-lang-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: FourchLangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.FourchLangValidator;
    const checks: ValidationChecks<FourchLangAstType> = {
        // TODO: Declare validators for your properties
        // See doc : https://langium.org/docs/learn/workflow/create_validations/
        /*
        Element: validator.checkElement
        */
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
}
