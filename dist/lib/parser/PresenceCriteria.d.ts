import { IHypothesis, ICriteriumResult, IHypothesisElement } from "../types/Product";
export declare class PresenceCriterium {
    test: string;
    validator: (hypothesis: IHypothesis) => boolean;
    feedbackGenerator: (hypothesis: IHypothesis, result: boolean) => string;
    constructor(test: string, validator: (hypothesis: IHypothesis) => boolean, feedbackGenerator: (hypothesis: IHypothesis, result: boolean) => string);
    result(hypothesis: IHypothesis): ICriteriumResult;
}
export declare class VariablesPresentCriterium extends PresenceCriterium {
    constructor(count?: number);
}
export declare class ModifiersPresentCriterium extends PresenceCriterium {
    constructor(count?: number);
}
export declare function GetElementType(element: IHypothesisElement): string;
