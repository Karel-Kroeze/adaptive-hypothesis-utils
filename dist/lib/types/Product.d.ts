import { Actor, MetadataPart } from "./LogAction";
import { CriteriumErrorReason } from "../parser/CriteriumErrorReason";
export interface IHypothesis {
    approved: boolean;
    tested: boolean;
    elements: IHypothesisElement[];
    confidence: number;
    id?: string;
    state: string;
    showConfidenceMeter: boolean;
    feedback?: ParserFeedback;
    parseResults?: ICodeResult;
    codeResults?: ICodeResult[];
    timestamp?: string;
    reason?: string;
}
export declare type ParserFeedback = any;
export interface ICodeResult {
    coder: string;
    results: ICriteriumResult[];
}
export interface IHypothesisAdaptive extends IHypothesis {
    feedback: ParserFeedback;
    parseResults: ICodeResult;
}
export interface ICriteriumError {
    reason: CriteriumErrorReason;
    message?: string;
}
export interface ICriteriumResult {
    test: string;
    success: boolean;
    error?: ICriteriumError;
    result?: any;
}
export interface IHypothesisUpdate extends IHypothesis {
    timestamp: string;
}
export interface IHypothesisSnapshot extends IHypothesisUpdate {
    reason: string;
    parseResults: ICodeResult;
}
export interface IProduct {
    actor: Actor;
}
export interface IHypothesisStory extends IProduct {
    snapshots: IHypothesisSnapshot[];
    updates: IHypothesisUpdate[];
}
export interface IHypothesisElement {
    text: string;
    type: string;
}
export interface IExperiment extends IProduct {
    experiment: any;
}
export interface IEntry extends IProduct {
}
export interface IExpectation extends IEntry {
    target: string;
    expectation: string;
}
export interface IConclusion extends IEntry {
    conclusion: string;
}
export interface IContentPart extends MetadataPart {
    content: any;
}
