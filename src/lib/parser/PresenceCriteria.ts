import { CreateParseResult } from "./Parser";
import { IHypothesis, ICriteriumError, ICriteriumResult, IHypothesisElement } from "../types/Product";

export class PresenceCriterium {
    constructor( 
        public test: string,
        public validator: (hypothesis: IHypothesis) => boolean,
        public feedbackGenerator: (hypothesis: IHypothesis, result: boolean) => string
    ){}

    result( hypothesis: IHypothesis ): ICriteriumResult {
        let success = this.validator( hypothesis );
        let feedback = this.feedbackGenerator( hypothesis, success );
        return CreateParseResult( this.test, success, feedback );
    }
}

export class VariablesPresentCriterium extends PresenceCriterium {
    constructor( count: number = 1 ){
        let validator = ( hypothesis: IHypothesis ) => {
            // for ( let element of hypothesis.elements ) {
            //     console.log( element, GetElementType( element ) );
            // }
            return hypothesis.elements.filter( element => GetElementType( element ) === "variable" ).length >= count;
        }
        let feedbackGenerator = ( hypothesis: IHypothesis, result: boolean ) => {
            if ( result )
                return `You have correctly used at least ${count} variable(s).`
            return `You should use at least ${count} variable(s).`
        }
        super( "VariablesPresent", validator, feedbackGenerator )
    }
}

export class ModifiersPresentCriterium extends PresenceCriterium {
    constructor( count: number = 1 ){
        let validator = ( hypothesis: IHypothesis ) => {
            return hypothesis.elements.filter( element => GetElementType( element ) === "modifier" ).length >= count;
        }
        let feedbackGenerator = ( hypothesis: IHypothesis, result: boolean ) => {
            if ( result )
                return `You have correctly used at least ${count} modifier(s).`
            return `You should use at least ${count} variable(s).`
        }
        super( "ModifiersPresent", validator, feedbackGenerator )
    }
}

// TODO; This is a rather horrid and short-sighted hack, but it's simple and quick and does the job.
// Manually sets the element type of modifier keywords so that we can properly apply the presence check criterium.
// Note; this requires manually assuring that the dictionaries of the grammar and this method match.
const modifierDictionary: string[] = [
    "stijgt",
    "daalt",
    "hetzelfde",
    "increases",
    "decreases",
    "remains the same"
];

export function GetElementType( element: IHypothesisElement ): string {
    let text = Array.isArray( element.text ) ? element.text[0] : element.text;
    let type = Array.isArray( element.type ) ? element.type[0] : element.type;
    // TODO: investigate why element.text and element.type have become arrays in some datasets.
    // console.log( text, type )
    if ( modifierDictionary.some( modifier => modifier === text ) ) {
        return "modifier";
    }
    return type;
}
