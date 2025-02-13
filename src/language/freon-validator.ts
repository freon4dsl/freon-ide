import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { FreonAstType, Model } from './generated/ast.js';
import type { FreonServices } from './freon-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: FreonServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.FreonValidator;
    const checks: ValidationChecks<FreonAstType> = {
        Model: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class FreonValidator {

    checkPersonStartsWithCapital(model: Model, accept: ValidationAcceptor): void {
        // model.$document.
        // if (model.name) {
        //     const firstChar = model.name.substring(0, 1);
        //     if (firstChar.toUpperCase() !== firstChar) {
        //         accept('warning', 'Model name should start with a capital.', { node: model, property: 'name' });
        //     }
        // }
    }

}
