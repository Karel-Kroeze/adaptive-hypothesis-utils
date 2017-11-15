import { Actor, MetadataPart } from "./LogAction";

export interface IHypothesis {
    approved: boolean,
    tested: boolean,
    elements: IHypothesisElement[],
    confidence: number,
    id?: string,
    state: string,
    showConfidenceMeter: boolean

    // parsed
    feedback?: ParserFeedback;
    parseResults?: ICodeResult

    // coded
    codeResults?: ICodeResult[]

    // snapshots
    timestamp?: string
    reason?: string
}

export type ParserFeedback = any;

export interface ICodeResult {
    coder: string
    results: ICriteriumResult[]
}

export interface IHypothesisAdaptive extends IHypothesis {
    feedback: ParserFeedback,
    parseResults: ICodeResult
}

export interface ICriteriumError {
    reason: CriteriumErrorReason
    message?: string
}

export interface ICriteriumResult {
    test: string,
    success: boolean,
    error?: ICriteriumError,
    result?: any
}

export interface IHypothesisUpdate extends IHypothesis {
    timestamp: string
}

export interface IHypothesisSnapshot extends IHypothesisUpdate {
    reason: string
}

export interface IProduct {
    actor: Actor
}

export interface IHypothesisStory extends IProduct {
    snapshots: IHypothesis[];
    updates: IHypothesis[];
}

export interface IHypothesisElement {
    text: string,
    type: string
}

export interface IExperiment extends IProduct  {
    experiment: any
}

export interface IEntry extends IProduct {

}

export interface IExpectation extends IEntry  {
    target: string
    expectation: string
}

export interface IConclusion extends IEntry {
    conclusion: string
}

export interface IContentPart extends MetadataPart {
    content: any;
}
