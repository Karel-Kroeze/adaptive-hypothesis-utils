import * as nearley from 'nearley';
import { ParseCriterium } from './ParserCriteria';
import { PresenceCriterium } from './PresenceCriteria';
import { IHypothesis, ICriteriumResult } from '../types/Product';
export declare enum CriteriumErrorReason {
    Syntax = 0,
    Incomplete = 1,
    Criterium = 2,
}
export declare function CreateParseResult(test: string, success: boolean, result: any, reason?: CriteriumErrorReason): ICriteriumResult;
export declare function GetHypothesisString(h: IHypothesis): string;
export declare class HypothesisParser {
    grammar: nearley.Grammar;
    presenceCriteria: PresenceCriterium[];
    parseCriteria: ParseCriterium[];
    debug: boolean;
    constructor(grammar: nearley.Grammar, presenceCriteria: PresenceCriterium[], parseCriteria: ParseCriterium[], debug?: boolean);
    TryParse(hypothesis: IHypothesis): void;
    static MarkFailPosition(hypothesis: string, offset: number): string;
    private DoPresenceCriteria(hypothesis, criteria);
    private DoParseCriteria(hypothesis, criteria);
}
