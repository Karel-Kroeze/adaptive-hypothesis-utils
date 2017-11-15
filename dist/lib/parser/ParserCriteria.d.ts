import { ICriteriumResult } from '../types/Product';
export interface NearleyParse {
    dependent: NearleyParseAction[];
    independent: NearleyParseAction[];
    qualified?: string;
}
export interface LanguageHandler {
    getMessage: (template: string, ...pars: string[]) => string;
}
export interface NearleyParseAction extends NearleyParseVariable {
    change?: string;
    variables: NearleyParseVariable[];
    interaction?: string;
    operator?: string;
}
export interface NearleyParseVariable {
    variable: string;
    qualified?: string;
    properties?: string[];
    descriptives?: string[];
}
export declare class ParseCriterium {
    test: string;
    validator: (hypothesis: NearleyParse) => boolean;
    feedbackGenerator: (hypothesis: NearleyParse, result: boolean) => string;
    constructor(test: string, validator: (hypothesis: NearleyParse) => boolean, feedbackGenerator: (hypothesis: NearleyParse, result: boolean) => string);
    result(result: NearleyParse): ICriteriumResult;
}
export declare class ManipulationCriterium extends ParseCriterium {
    constructor(languageHandler: LanguageHandler);
}
export declare class CVSCriterium extends ParseCriterium {
    constructor(languageHandler: LanguageHandler);
}
export declare class InteractionCriterium extends ParseCriterium {
    constructor(languageHandler: LanguageHandler);
}
export declare class QualificationCriterium extends ParseCriterium {
    constructor(languageHandler: LanguageHandler);
}
