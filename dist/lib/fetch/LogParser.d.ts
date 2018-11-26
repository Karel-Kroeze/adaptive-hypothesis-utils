import { LogType } from './LogType';
import { HypothesisStory } from './HypothesisStory';
import { LogAction } from "../types/LogAction";
import { IHypothesis, IExpectation, IExperiment, IConclusion } from "../types/Product";
export declare type products = {
    [type: string]: any;
};
export declare class LogParser {
    expectations: {
        [id: string]: IExpectation;
    };
    hypotheses: {
        [id: string]: HypothesisStory;
    };
    experiments: {
        [id: string]: IExperiment;
    };
    conclusions: {
        [id: string]: IConclusion;
    };
    constructor(expectations?: {
        [id: string]: IExpectation;
    }, hypotheses?: {
        [id: string]: HypothesisStory;
    }, experiments?: {
        [id: string]: IExperiment;
    }, conclusions?: {
        [id: string]: IConclusion;
    });
    processAll(logs: LogAction[], forceParseResultsUpdate?: boolean): products;
    summarize(): void;
    finalize(): products;
    store(dir: string, name: string): void;
    process(log: LogAction, forceParseResultsUpdate?: boolean): void;
    private updateHypothesis(hypothesis, actor, timestamp, forceParseResultsUpdate?);
    private parser;
    static addParseResultsIfMissing(hypothesis: IHypothesis, force?: boolean): void;
    private updateExperiment(log);
    private updateConclusion(log);
    private updateExpectation(log);
    private snapshotHypothesis(id, reason, time?);
    getHypothesesCsvString(coder?: string): any;
    private getCodeStatus(codes, name);
    static getLogType(log: LogAction): LogType;
}
export declare function extractUniqueUsers(logs: LogAction[]): string[];
