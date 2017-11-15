import { LogType } from './LogType';
import { HypothesisStory } from './HypothesisStory';
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
    processAll(logs: LogAction[]): products;
    summarize(): void;
    finalize(): products;
    store(dir: string, name: string): void;
    process(log: LogAction): void;
    private updateHypothesis(hypothesis, actor, timestamp);
    private parser;
    private addParseResultsIfMissing(hypothesis, force?);
    private updateExperiment(log);
    private updateConclusion(log);
    private updateExpectation(log);
    private snapshotHypothesis(id, reason, time?);
    getHypothesesCsvString(coder?: string): any;
    private getCodeStatus(codes, name);
    static getLogType(log: LogAction): LogType;
}
export declare function extractUniqueUsers(logs: LogAction[]): string[];