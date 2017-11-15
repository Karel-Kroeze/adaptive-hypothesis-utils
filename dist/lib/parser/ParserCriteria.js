"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Parser_1 = require("./Parser");
function GetVariableStringFromActions(actions) {
    let variables = _.flatMap(actions, GetVariableStringFromAction);
    let out = "";
    let n = variables.length;
    for (let i = 0; i < n; i++) {
        out += variables[i];
        // early part of list, use comma
        if (i + 2 < n) {
            out += ", ";
            // final element coming up, use 'and'
        }
        else if (i + 1 < n) {
            out += " en ";
        }
    }
    return out;
}
function GetVariableStringFromAction(action) {
    if (IsInteraction(action)) {
        return action.variables.map(GetVariableStringFromVariable);
    }
    else {
        return [GetVariableStringFromVariable(action)];
    }
}
function GetVariableStringFromVariable(variable) {
    let result = variable.variable;
    if (variable.properties) {
        for (let property of variable.properties) {
            result = `${property} ${result}`;
        }
    }
    if (variable.descriptives) {
        for (let descriptive of variable.descriptives) {
            result = `${descriptive} ${result}`;
        }
    }
    return result;
}
function GetQualifier(result) {
    // todo; check if qualifier makes some amount of sense
    // 'qualified' object can occur on top level hypothesis, action and/or variable level.
    // top level
    if (result.qualified) {
        return result.qualified;
    }
    // in variable
    // todo; we now return the first qualifier we find, but having multiple qualifiers is probably an error we should check for.
    if (result.independent && result.independent.length) {
        let qualified = _.find(result.independent, IsQualified);
        if (qualified) {
            return _getQualifier(qualified);
        }
    }
    if (result.dependent && result.dependent.length) {
        let qualifier = _.find(result.dependent, IsQualified);
        if (qualifier) {
            return _getQualifier(qualifier);
        }
    }
    return false;
}
function IsChange(action, allowInteractions = true) {
    return action && (action.change || (allowInteractions && IsInteraction(action)));
}
function IsInteraction(action) {
    return !!action && !!action.interaction;
}
function IsQualified(action) {
    if (IsInteraction(action)) {
        return action.variables.some(VariableIsQualified);
    }
    else {
        return VariableIsQualified(action);
    }
}
/**
 * Assumes that the action is indeed qualified!
 * @param action
 * @returns {string}
 * @constructor
 */
function _getQualifier(action) {
    if (IsInteraction(action)) {
        return _.find(action.variables, VariableIsQualified).qualified;
    }
    else {
        return action.qualified;
    }
}
function VariableIsQualified(variable) {
    return !!variable.qualified;
}
class ParseCriterium {
    constructor(test, validator, feedbackGenerator) {
        this.test = test;
        this.validator = validator;
        this.feedbackGenerator = feedbackGenerator;
    }
    result(result) {
        let success = this.validator(result);
        let feedback = this.feedbackGenerator(result, success);
        return Parser_1.CreateParseResult(this.test, success, feedback);
    }
}
exports.ParseCriterium = ParseCriterium;
class ManipulationCriterium extends ParseCriterium {
    constructor(languageHandler) {
        let validator = (result) => {
            // has to have at least one independent variable, and at least one independent variable has to have change, or have an interaction
            return result && result.independent && _.some(result.independent, ind => IsChange(ind));
        };
        let feedback = (result) => {
            let ok = validator(result);
            if (ok) {
                return languageHandler.getMessage("hypothesisAdaptive.feedback.manipulation.OK", GetVariableStringFromActions(result.independent.filter(ind => IsChange(ind))), GetVariableStringFromActions(result.dependent));
            }
            else {
                return languageHandler.getMessage("hypothesisAdaptive.feedback.manipulation.fail", GetVariableStringFromActions(result.independent.filter(ind => !IsChange(ind))), GetVariableStringFromActions(result.dependent));
            }
        };
        super("manipulation", validator, feedback);
    }
}
exports.ManipulationCriterium = ManipulationCriterium;
class CVSCriterium extends ParseCriterium {
    constructor(languageHandler) {
        let validator = (result) => {
            // has to have at least one independent variable, and exactly one independent variable should have change
            return result && result.independent && _.filter(result.independent, ind => IsChange(ind)).length === 1;
        };
        let feedback = (result) => {
            let ok = validator(result);
            if (ok) {
                return languageHandler.getMessage("hypothesisAdaptive.feedback.CVS.OK", GetVariableStringFromActions(result.independent.filter(ind => IsChange(ind))), GetVariableStringFromActions(result.dependent));
            }
            else {
                // too much change
                if (result && result.independent && _.filter(result.independent, ind => IsChange(ind)).length > 1) {
                    return languageHandler.getMessage("hypothesisAdaptive.feedback.CVS.fail", GetVariableStringFromActions(result.independent.filter(ind => IsChange(ind))), GetVariableStringFromActions(result.dependent));
                }
                else {
                    // no change, can't give meaningful feedback
                    return "";
                }
            }
        };
        super("CVS", validator, feedback);
    }
}
exports.CVSCriterium = CVSCriterium;
class InteractionCriterium extends ParseCriterium {
    constructor(languageHandler) {
        let validator = (result) => {
            // has to have at least one independent variable, and at least one variable should have an interaction (x > y, x < y, etc.)
            // todo; and that interaction should make some measure of sense
            return result && result.independent && _.some(result.independent, IsInteraction);
        };
        let feedback = (result) => {
            let ok = validator(result);
            if (ok) {
                // ok, so we know that there _is_ an interaction - safe to cast?
                let interactor = result.independent.find(IsInteraction);
                return languageHandler.getMessage("hypothesisAdaptive.feedback.interaction.OK", interactor.variables[0].variable, interactor.variables[1].variable);
            }
            else {
                return languageHandler.getMessage("hypothesisAdaptive.feedback.interaction.fail", GetVariableStringFromActions(result.independent.filter(ind => IsChange(ind))));
            }
        };
        super("interaction", validator, feedback);
    }
}
exports.InteractionCriterium = InteractionCriterium;
class QualificationCriterium extends ParseCriterium {
    constructor(languageHandler) {
        let validator = (result) => { return !!GetQualifier(result); };
        let feedback = (result) => {
            if (validator(result)) {
                return languageHandler.getMessage("hypothesisAdaptive.feedback.qualified.OK", GetQualifier(result));
            }
            else {
                return languageHandler.getMessage("hypothesisAdaptive.feedback.qualified.fail");
            }
        };
        super("qualified", validator, feedback);
    }
}
exports.QualificationCriterium = QualificationCriterium;
