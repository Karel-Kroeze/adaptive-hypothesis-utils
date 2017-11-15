import * as fs from "mz/fs";
import * as path from "path";
import * as json2csv from "json2csv";
import * as mkdirp from 'mkdirp';
import {LogType} from './LogType';
import {HypothesisStory} from './HypothesisStory';
import {Write} from '../core/IO';
import { HypothesisParser } from "../parser/Parser";
import { LanguageHandler, ManipulationCriterium, CVSCriterium, QualificationCriterium } from "../parser/ParserCriteria";
import { VariablesPresentCriterium, ModifiersPresentCriterium } from "../parser/PresenceCriteria";
import { getText } from "../core/Hypothesis_Extensions";
import { LogAction, Actor } from "../types/LogAction";
import { ICriteriumResult, IHypothesis, IHypothesisAdaptive, IExpectation, IExperiment, IConclusion } from "../types/Product";

const grammar: nearley.Grammar = require("@golab/hypothesis-grammars")['circuits-nl'];
const encoding = "utf8";

export type products = { [type:string]: any };

export class LogParser {
    constructor( 
        public expectations: { [id: string]: IExpectation } = {},
        public hypotheses: { [id: string]: HypothesisStory } = {},
        public experiments: { [id: string]: IExperiment } = {},
        public conclusions: { [id: string]: IConclusion } = {}
    ){}

    processAll( logs: LogAction[] ): products{
        for ( let log of logs )
            this.process( log );
        this.finalize();
        this.summarize();
        return { experiments: this.experiments, hypotheses: this.hypotheses, conclusions: this.conclusions, expectations: this.expectations };
    }

    summarize(): void {
        console.log(`
\tProducts:
\t\tExpectations:\t ${Object.keys(this.expectations).length}
\t\tHypotheses:\t ${Object.keys(this.hypotheses).length}
\t\tExperiments:\t ${Object.keys(this.experiments).length}
\t\tConclusions:\t ${Object.keys(this.conclusions).length}
        `)
    }

    finalize(): products{
        for ( let id in this.hypotheses )
            this.hypotheses[id].takeSnapshot( 'final' );
        return { experiments: this.experiments, hypotheses: this.hypotheses, conclusions: this.conclusions, expectations: this.expectations };
    }

    store( dir: string, name: string ): void {
        // write JSON versions of everything        
        for ( let product in this )
            Write( dir, product + "-" + name, this[product] )
                .catch( console.error );

        // write CSV version of hypotheses
        let csvString = this.getHypothesesCsvString();
        Write( dir, "hypotheses-" + name, csvString, "csv" );
    }

    process( log: LogAction ){
        switch ( LogParser.getLogType(log) ) {
            case LogType.hypothesesUpdate:
                log.object.content.content.forEach( ( hypothesis: IHypothesis ) => this.updateHypothesis( hypothesis, log.actor, log.published ) );
                break;
            case LogType.hypothesesChange:
                this.updateHypothesis( log.object.content, log.actor, log.published );
                break;
            case LogType.hypothesesFeedback:
                this.snapshotHypothesis( log.object.id, 'feedback', log.published );
                break;
            case LogType.conclusionChange:
            case LogType.conclusionUpdate:
                this.updateConclusion( log );
                break;
            case LogType.expectationChange:
            case LogType.expectationUpdate:
                this.updateExpectation( log );
                break;
            case LogType.experimentChange:
            case LogType.experimentUpdate:
                this.updateExperiment( log );
                break;        
            default:
                break;
        }
    }

    private updateHypothesis( hypothesis: IHypothesis, actor: Actor, timestamp: string ){
        this.addParseResultsIfMissing( hypothesis, true )        
        let id: string = <string>hypothesis.id;
        if (!this.hypotheses.hasOwnProperty( id )){
            this.hypotheses[id] = new HypothesisStory( hypothesis, actor, timestamp );
        } else {
            this.hypotheses[id].update( hypothesis, timestamp )
        }
    }

    private parser: HypothesisParser;
    private addParseResultsIfMissing( hypothesis: IHypothesis, force: boolean = false ){
        if (!force && (<IHypothesisAdaptive>hypothesis).parseResults)
            return;

        grammar.start = "HYPOTHESIS";
        let languageHandler: LanguageHandler = {
            "getMessage": ( template: string, ...pars: string[] ) => {
                return `template: ${template}\npars:\n\t${pars.join( "\n\t" )}`
            }
        }
        let presenceCriteria = [
            new VariablesPresentCriterium( 2 ),
            new ModifiersPresentCriterium( 1 )
        ]
        let parserCriteria = [
            new ManipulationCriterium( languageHandler ),
            new CVSCriterium( languageHandler ),
            new QualificationCriterium( languageHandler )
        ]
        let parser = new HypothesisParser( grammar, presenceCriteria, parserCriteria, false )
        parser.TryParse( hypothesis );
    }

    private updateExperiment( log: LogAction ){
        let id: string = log.actor.id + "_" + log.target.id;
        this.experiments[id] = { experiment: log.object.content.design, actor: log.actor };
    }

    private updateConclusion( log: LogAction ){
        let id: string = log.actor.id + "_" + log.target.id;
        this.conclusions[id] = { conclusion: log.object.content.text, actor: log.actor };
    }

    private updateExpectation( log: LogAction ){
        let id: string = log.actor.id + "_" + log.generator.id;
        this.expectations[id] = { expectation: log.object.content.text, target: log.generator.id, actor: log.actor };
    }

    private snapshotHypothesis( id: string, reason: string, time?: string ){
        if (!this.hypotheses.hasOwnProperty( id ) || !this.hypotheses[id] ){
            // NOTE: The feedbackAccess log does not contain the hypothesis itself, so we cannot reconstruct it on the fly.
            console.error( `WARNING: Taking snapshot of non-existant (empty) hypothesis (id; ${id})...` );
        } else {
            this.hypotheses[id].takeSnapshot( reason, time );            
        }
    }

    getHypothesesCsvString( coder: string = 'Parser' ){
        let fields = ['name', 'id', 'time', 'hypothesis', 'presence', 'syntax', 'manipulation', 'CVS', 'qualified', 'reason'];
        let csv = [];
        for ( let id in this.hypotheses ) {
            let story: HypothesisStory = this.hypotheses[id];
            let name: string = this.hypotheses[id].actor.displayName;
            for ( let h of story.snapshots ){
                let results: ICriteriumResult[] | undefined;
                if (h.codeResults){
                    let code = h.codeResults.find( code => code.coder === coder )
                    if (code)
                        results = code.results;
                }
                if (!results && h.parseResults)
                    results = h.parseResults.results;
                if (!results){
                    console.error( `No results for ${id} (${getText(h)})`)
                    continue;                    
                }

                csv.push({
                    name: name,
                    id: id,
                    time: h.timestamp,
                    hypothesis: getText(h),
                    presence: this.getCodeStatus( results, "PresenceCheck" ),
                    syntax: this.getCodeStatus( results, "Syntax" ),
                    manipulation: this.getCodeStatus( results, "manipulation" ),
                    CVS: this.getCodeStatus( results, "CVS" ),
                    qualified: this.getCodeStatus( results, "qualified" ),
                    reason: h.reason
                })
            }
        }

        try {
            return json2csv({ data: csv, fields: fields });
        } catch (err) {
            console.error(err);
        }
    }

    private getCodeStatus( codes: ICriteriumResult[], name: string ): boolean | undefined {
        if (!codes) return undefined;
        let code = codes.find( code => code.test === name )
        return code ? code.success : undefined;
    }

    public static getLogType( log: LogAction ): LogType {
        if ( log.verb === "update" ){
            if ( log.target.objectType === "hypotheses" )
                return LogType.hypothesesUpdate;      
            if ( log.target.objectType === "experiment_designs" )
                return LogType.experimentUpdate     
            if ( log.target.objectType === "entry" ){
                if ( log.provider.inquiryPhase === "Conclusion" )
                    return LogType.conclusionUpdate
                if ( log.provider.inquiryPhase === "Conceptualisation" )
                    return LogType.expectationUpdate
            }
        }
    
        if ( log.verb === "change" ) {
            if ( log.target.objectType === "hypotheses" && log.object.objectType === "hypothesis" )
                return LogType.hypothesesChange;
            if ( log.target.objectType === "experiment_designs" )
                return LogType.experimentChange
            if ( log.target.objectType === "entry" ){
                if ( log.provider.inquiryPhase === "Conclusion" )
                    return LogType.conclusionChange
                if ( log.provider.inquiryPhase === "Conceptualisation" )
                    return LogType.expectationChange
            }
        }
            
        if ( log.verb === "access" ){
            if ( log.object.objectType === "feedbackAccess" )
                return LogType.hypothesesFeedback;
        }
        
        // otherwise
        return LogType.other;
    }
}

export function extractUniqueUsers( logs: LogAction[] ): string[]{
    return [... new Set( logs.map( log => log.actor.displayName ) ) ]
}