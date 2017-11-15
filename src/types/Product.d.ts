interface IHypothesis {
    approved: boolean,
    tested: boolean,
    elements: IHypothesisElement[],
    confidence: number,
    id: string,
    state: string,
    showConfidenceMeter: boolean

    // parsed
    feedback?: ParserFeedback;
    parseResults?: ICriteriumResult[]

    // coded
    codeResults?: ICodeResult[]

    // snapshots
    timestamp?: string
    reason?: string
}

type ParserFeedback = any;

interface ICodeResult {
    coder: string
    results: ICriteriumResult[]
}

interface IHypothesisAdaptive extends IHypothesis {
    feedback: ParserFeedback,
    parseResults: ICriteriumResult[]
}

declare enum CriteriumErrorReason {
    Syntax,
    Incomplete,
    Criterium
}

interface ICriteriumError {
    reason: CriteriumErrorReason
    message?: string
}

interface ICriteriumResult {
    test: string,
    success: boolean,
    error?: ICriteriumError,
    result?: any
}

interface IHypothesisUpdate extends IHypothesis {
    timestamp: string
}

interface IHypothesisSnapshot extends IHypothesisUpdate {
    reason: string
}

interface IProduct {
    actor: Actor
}

interface IHypothesisStory extends IProduct {
    snapshots: IHypothesisSnapshot[];
    updates: IHypothesisUpdate[];
}

interface IHypothesisElement {
    text: string,
    type: string
}

interface IExperiment extends IProduct  {
    experiment: any
}

interface IEntry extends IProduct {

}

interface IExpectation extends IEntry  {
    target: string
    expectation: string
}

interface IConclusion extends IEntry {
    conclusion: string
}

interface IContentPart extends MetadataPart {
    content: any;
}
