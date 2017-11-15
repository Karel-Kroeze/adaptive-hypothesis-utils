declare module '@golab/adaptive-hypotheses/core/IO' {
	export function checkOutputDir(location: string, create?: boolean, file?: boolean): void;
	export function Write<T>(dir: string | false, name: string, data: T, ext?: "json" | "csv", prefix?: string): Promise<T>;
	export function ReadJsonArray(file: string): Promise<any>;
	export function filename(dir: string | false, name: string, ext: "json" | "csv", prefix?: string): string;
	export function PromiseMkdirp(dir: string): Promise<string>;
	export function Fetch(provider_id: string, tries?: number, maxTries?: number, returnType?: "file" | "preFile"): Promise<LogAction[]>;

}
declare module '@golab/adaptive-hypotheses/core/Constants' {
	export const encoding = "utf8";

}
declare module '@golab/adaptive-hypotheses/core/Config' {
	export function updateDataConfig(name: string, condition: string, provider: string, path: string, config?: DataConfig): DataConfig;
	export function updateDataConfig(name: string, condition: string, providers: string[], paths: string[], config?: DataConfig): DataConfig;
	export function getDataConfig(path?: string): DataConfig;
	export interface DataConfig {
	    [name: string]: DataConfig_Experiment;
	}
	export interface DataConfig_Experiment {
	    [name: string]: DataConfig_Condition;
	}
	export interface DataConfig_Condition {
	    providers: string[];
	    data: {
	        [providerId: string]: DataConfig_Files;
	    };
	}
	export interface DataConfig_Files {
	    raw: string;
	    users?: string;
	    expectations?: string;
	    hypotheses?: string;
	    experiments?: string;
	    conclusions?: string;
	    [key: string]: string | undefined;
	}

}
declare module '@golab/adaptive-hypotheses/core/Hypothesis_Extensions' {
	export function getText(hypothesis: IHypothesis): string;

}
declare module '@golab/adaptive-hypotheses/fetch/DBDumpParser' {
	export function ParseDBDump(file: string, arrayify?: boolean, sort?: boolean): Promise<LogAction[]>;

}
declare module '@golab/adaptive-hypotheses/fetch/HypothesisStory' {
	export class HypothesisStory implements IHypothesisStory {
	    actor: Actor;
	    snapshots: IHypothesisSnapshot[];
	    updates: IHypothesisUpdate[];
	    constructor(hypothesis: IHypothesis, actor: Actor, timestamp?: string);
	    update(hypothesis: IHypothesis, timestamp?: string): void;
	    takeSnapshot(reason: string, timestamp?: string): void;
	    toString(): string;
	    readonly latestUpdate: IHypothesisUpdate | undefined;
	}
	export function getUpdate(hypothesis: IHypothesis, timestamp?: string): IHypothesisUpdate;
	export function getSnapshot(hypothesis: IHypothesis, timestamp?: string, reason?: string): IHypothesisSnapshot;

}
declare module '@golab/adaptive-hypotheses/fetch/LogType' {
	export enum LogType {
	    hypothesesUpdate = 0,
	    hypothesesChange = 1,
	    hypothesesFeedback = 2,
	    expectationChange = 3,
	    expectationUpdate = 4,
	    conclusionChange = 5,
	    conclusionUpdate = 6,
	    experimentUpdate = 7,
	    experimentChange = 8,
	    remove = 9,
	    other = 10,
	}

}
declare module '@golab/adaptive-hypotheses/parser/ParserCriteria' {
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
	export class ParseCriterium {
	    test: string;
	    validator: (hypothesis: NearleyParse) => boolean;
	    feedbackGenerator: (hypothesis: NearleyParse, result: boolean) => string;
	    constructor(test: string, validator: (hypothesis: NearleyParse) => boolean, feedbackGenerator: (hypothesis: NearleyParse, result: boolean) => string);
	    result(result: NearleyParse): ICriteriumResult;
	}
	export class ManipulationCriterium extends ParseCriterium {
	    constructor(languageHandler: LanguageHandler);
	}
	export class CVSCriterium extends ParseCriterium {
	    constructor(languageHandler: LanguageHandler);
	}
	export class InteractionCriterium extends ParseCriterium {
	    constructor(languageHandler: LanguageHandler);
	}
	export class QualificationCriterium extends ParseCriterium {
	    constructor(languageHandler: LanguageHandler);
	}

}
declare module '@golab/adaptive-hypotheses/parser/PresenceCriteria' {
	export class PresenceCriterium {
	    test: string;
	    validator: (hypothesis: IHypothesis) => boolean;
	    feedbackGenerator: (hypothesis: IHypothesis, result: boolean) => string;
	    constructor(test: string, validator: (hypothesis: IHypothesis) => boolean, feedbackGenerator: (hypothesis: IHypothesis, result: boolean) => string);
	    result(hypothesis: IHypothesis): ICriteriumResult;
	}
	export class VariablesPresentCriterium extends PresenceCriterium {
	    constructor(count?: number);
	}
	export class ModifiersPresentCriterium extends PresenceCriterium {
	    constructor(count?: number);
	}
	export function GetElementType(element: IHypothesisElement): string;

}
declare module '@golab/adaptive-hypotheses/parser/Parser' {
	import * as nearley from 'nearley';
	import { ParseCriterium } from '@golab/adaptive-hypotheses/lib/parser/ParserCriteria';
	import { PresenceCriterium } from '@golab/adaptive-hypotheses/lib/parser/PresenceCriteria';
	export function CreateParseResult(test: string, success: boolean, result: any, reason?: CriteriumErrorReason): ICriteriumResult;
	export function GetHypothesisString(h: IHypothesis): string;
	export class HypothesisParser {
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

}
declare module '@golab/adaptive-hypotheses/fetch/LogParser' {
	import { LogType } from '@golab/adaptive-hypotheses/lib/fetch/LogType';
	import { HypothesisStory } from '@golab/adaptive-hypotheses/lib/fetch/HypothesisStory';
	export type products = {
	    [type: string]: any;
	};
	export class LogParser {
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
	export function extractUniqueUsers(logs: LogAction[]): string[];

}
/**
 * Created by SikkenJ on 23-2-2017.
 */

interface Metadata {
    id: string,
    published: string,
    publishedServer?: string,
    actor: Actor,
    target: Target,
    generator: Generator,
    provider: Provider
}

interface MetadataPart {
    id: string,
    objectType: string,
    displayName: string
}

interface Actor extends MetadataPart {

}

interface Target extends MetadataPart {
    forApplication?: string
}

interface Generator extends MetadataPart {
    url: string
}

interface Provider extends MetadataPart {
    url: string,
    inquiryPhase: string,
    inquiryPhaseId: string,
    inquiryPhaseName: string,
    displayName: string
}

type contentVerb = "add" | "remove" | "change" | "clear"
type processVerb = "access" | "start" | "cancel" | "send" | "receive"
type storageVerb = "new" | "open" | "create" | "update" | "delete"
type otherVerb = "application_started" | "phase_changed"
type verb = contentVerb | processVerb | storageVerb | otherVerb

type integer = number
type dataString = string

interface LogAction {
    id: string,
    published: dataString,
    publishedLA?: dataString,
    actor: Actor,
    target: Target,
    generator: Generator,
    provider: Provider,
    verb: verb,
    sequenceNumber?: integer
    object: any
}

interface PackageInfo {
    name: string
    buildMillis: integer
    version: string
}

interface DeviceInfo {
    navigator: {
        appCodeName: string
        appName: string
        appVersion: string
        geoLocation: any
        language: string
        oscpu: string
        platform: string
        product: string
        userAgent: string
    }
    browser: any
    screen: any
    features: {
        mobile: boolean
        desktop: boolean
        touch: boolean
        portrait: boolean
        landscape: boolean
        retina: boolean
        transitions: boolean
        transforms: boolean
        gradients: boolean
        multiplebgs: boolean
        boxshadow: boolean
        borderimage: boolean
        borderradius: boolean
        cssreflections: boolean
        fontface: boolean
        rgba: boolean
    }
}

interface Resource {
    metadata: Metadata,
    content?: any
}

interface ErrorLogAction extends LogAction {
    verb: "send"
    object: {
        objectType: "error"
        content: {
            libsInfo: PackageInfo
            commonsInfo: PackageInfo
            toolInfo: PackageInfo
            errorType: string
            display: string
            message: string
            error: {
                message: string
                string: string
                stack: string
            }
            model?: Resource
            configurationModel?: Resource
            device: DeviceInfo
        }
    }
}
declare module 'progress-stream';
declare module 'jsmin';
declare module 'json2csv';
declare module 'stream-json';
declare module '@golab/hypothesis-grammars';interface IHypothesis {
    approved: boolean,
    tested: boolean,
    elements: IHypothesisElement[],
    confidence: number,
    id?: string,
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
    snapshots: IHypothesis[];
    updates: IHypothesis[];
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
/**
 * Created by SikkenJ on 23-2-2017.
 */

interface LogActionQuery {
    agentType: "log_data"
    agentName: "log_data"
    returnType?: "file" | "preFile"
}

interface ProviderDisplayNameQuery extends LogActionQuery {
    type: "provider_displayName"
    displayName: string
}

interface ProviderIdQuery extends LogActionQuery {
    type: "provider_id"
    providerId: string
}

interface AllActorsQuery extends LogActionQuery {
    type: "all_actors"
    ilsId: string
}

interface ObjectTypeQuery extends LogActionQuery {
    objectType: string
    ilsId?: string
    startTime?: string
    endTime?: string
}

interface TimedQuery extends LogActionQuery {
    startTime: string
    endTime: string
    ilsId: string
    userId?: string
}

interface UserQuery extends LogActionQuery {
    ilsId: string
    userId: string
}

interface IlsQuery extends LogActionQuery {
    ilsId: string
}
