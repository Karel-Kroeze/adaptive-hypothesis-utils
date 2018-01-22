"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parser_1 = require("./Parser");
class PresenceCriterium {
    constructor(test, validator, feedbackGenerator) {
        this.test = test;
        this.validator = validator;
        this.feedbackGenerator = feedbackGenerator;
    }
    result(hypothesis) {
        let success = this.validator(hypothesis);
        let feedback = this.feedbackGenerator(hypothesis, success);
        return Parser_1.CreateParseResult(this.test, success, feedback);
    }
}
exports.PresenceCriterium = PresenceCriterium;
class VariablesPresentCriterium extends PresenceCriterium {
    constructor(count = 1) {
        let validator = (hypothesis) => {
            // for ( let element of hypothesis.elements ) {
            //     console.log( element, GetElementType( element ) );
            // }
            return hypothesis.elements.filter(element => GetElementType(element) === "variable").length >= count;
        };
        let feedbackGenerator = (hypothesis, result) => {
            if (result)
                return `You have correctly used at least ${count} variable(s).`;
            return `You should use at least ${count} variable(s).`;
        };
        super("VariablesPresent", validator, feedbackGenerator);
    }
}
exports.VariablesPresentCriterium = VariablesPresentCriterium;
class ModifiersPresentCriterium extends PresenceCriterium {
    constructor(count = 1) {
        let validator = (hypothesis) => {
            return hypothesis.elements.filter(element => GetElementType(element) === "modifier").length >= count;
        };
        let feedbackGenerator = (hypothesis, result) => {
            if (result)
                return `You have correctly used at least ${count} modifier(s).`;
            return `You should use at least ${count} variable(s).`;
        };
        super("ModifiersPresent", validator, feedbackGenerator);
    }
}
exports.ModifiersPresentCriterium = ModifiersPresentCriterium;
// TODO; This is a rather horrid and short-sighted hack, but it's simple and quick and does the job.
// Manually sets the element type of modifier keywords so that we can properly apply the presence check criterium.
// Note; this requires manually assuring that the dictionaries of the grammar and this method match.
const modifierDictionary = [
    "stijgt",
    "daalt",
    "hetzelfde",
    "increases",
    "decreases",
    "remains the same"
];
function GetElementType(element) {
    if (modifierDictionary.some(modifier => modifier === element.text[0])) {
        return "modifier";
    }
    return element.type[0];
}
exports.GetElementType = GetElementType;
