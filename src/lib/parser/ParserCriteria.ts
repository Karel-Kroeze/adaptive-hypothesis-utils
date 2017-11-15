import * as _ from 'lodash';
import { CreateParseResult } from "./Parser";
import { ICriteriumResult } from '../types/Product';

export interface NearleyParse {
        dependent: NearleyParseAction[]
        independent: NearleyParseAction[]
        qualified?: string
    }

export interface LanguageHandler {
    getMessage: ( template: string, ...pars: string[] ) => string
}

export interface NearleyParseAction extends NearleyParseVariable {
    // single variable
    change?: string

    // interaction between two variables
    variables: NearleyParseVariable[]
    interaction?: string
    operator?: string
}

export interface NearleyParseVariable {
    variable: string
    qualified?: string
    properties?: string[]
    descriptives?: string[]
}

function GetVariableStringFromActions( actions: NearleyParseAction[] ) {
    let variables = _.flatMap( actions, GetVariableStringFromAction );

    let out = "";
    let n = variables.length;

    for ( let i = 0; i < n; i++) {
        out += variables[i];

        // early part of list, use comma
        if ( i + 2 < n ) {
            out += ", ";

        // final element coming up, use 'and'
        } else if ( i + 1 < n ) {
            out += " en ";
        }
    }

    return out;
}

function GetVariableStringFromAction( action: NearleyParseAction ): string[] {
    if ( IsInteraction( action ) ) {
        return action.variables.map( GetVariableStringFromVariable )
    } else {
        return [ GetVariableStringFromVariable( action ) ];
    }
}

function GetVariableStringFromVariable( variable: NearleyParseVariable ): string {
    let result = variable.variable;
    if ( variable.properties ) {
        for (let property of variable.properties ) {
            result = `${property} ${result}`;
        }
    }
    if ( variable.descriptives ) {
        for (let descriptive of variable.descriptives ) {
            result = `${descriptive} ${result}`;
        }
    }
    return result;
}

function GetQualifier(result: NearleyParse ): string | false {
    // todo; check if qualifier makes some amount of sense
    // 'qualified' object can occur on top level hypothesis, action and/or variable level.
    // top level
    if ( result.qualified ) {
        return result.qualified;
    }

    // in variable
    // todo; we now return the first qualifier we find, but having multiple qualifiers is probably an error we should check for.
    if ( result.independent && result.independent.length ) {
        let qualified = _.find( result.independent, IsQualified );
        if ( qualified ) {
            return <string>_getQualifier( qualified );
        }
    }
    if ( result.dependent && result.dependent.length ) {
        let qualifier = _.find( result.dependent, IsQualified );
        if ( qualifier ) {
            return <string>_getQualifier( qualifier );
        }
    }

    return false;
}

function IsChange( action: NearleyParseAction, allowInteractions: boolean = true ) {
    return action && ( action.change || ( allowInteractions && IsInteraction( action ) ));
}

function  IsInteraction( action: NearleyParseAction ): boolean {
    return !!action && !!action.interaction;
}

function IsQualified( action: NearleyParseAction ) {
    if ( IsInteraction( action ) ) {
        return action.variables.some( VariableIsQualified );
    } else {
        return VariableIsQualified( action );
    }
}

/**
 * Assumes that the action is indeed qualified!
 * @param action
 * @returns {string}
 * @constructor
 */
function _getQualifier( action: NearleyParseAction ) {
    if ( IsInteraction( action ) ) {
        return (<NearleyParseVariable>_.find( action.variables, VariableIsQualified ) ).qualified;
    } else {
        return action.qualified;
    }
}

function VariableIsQualified( variable: NearleyParseVariable ) {
    return !!variable.qualified;
}

export class ParseCriterium {
    constructor( 
        public test: string,
        public validator: (hypothesis: NearleyParse) => boolean,
        public feedbackGenerator: (hypothesis: NearleyParse, result: boolean) => string
    ){}

    result( result: NearleyParse ): ICriteriumResult {
        let success = this.validator( result );
        let feedback = this.feedbackGenerator( result, success );
        return CreateParseResult( this.test, success, feedback );
    }
}

export class ManipulationCriterium extends ParseCriterium {
    constructor( languageHandler: LanguageHandler ) {
        let validator = (result: NearleyParse) => {
            // has to have at least one independent variable, and at least one independent variable has to have change, or have an interaction
            return result && result.independent && _.some( result.independent, ind => IsChange( ind ) );
        };
        let feedback = (result: NearleyParse) => {
            let ok = validator( result );
            if ( ok ) {
                return languageHandler.getMessage( "hypothesisAdaptive.feedback.manipulation.OK",
                    GetVariableStringFromActions( result.independent.filter( ind => IsChange( ind ) ) ),
                    GetVariableStringFromActions( result.dependent ) );
            } else {
                return languageHandler.getMessage( "hypothesisAdaptive.feedback.manipulation.fail",
                    GetVariableStringFromActions( result.independent.filter( ind => !IsChange( ind ) ) ),
                    GetVariableStringFromActions( result.dependent ) );
            }
        };
        super( "manipulation", validator, feedback );
    }
}

export class CVSCriterium extends ParseCriterium {
    constructor(languageHandler: LanguageHandler ) {
        let validator = (result: NearleyParse) => {
            // has to have at least one independent variable, and exactly one independent variable should have change
            return result && result.independent && _.filter( result.independent, ind => IsChange( ind ) ).length === 1;
        };
        let feedback = (result: NearleyParse): string => {
            let ok = validator( result );

            if ( ok ) {
                return languageHandler.getMessage( "hypothesisAdaptive.feedback.CVS.OK",
                    GetVariableStringFromActions( result.independent.filter( ind => IsChange( ind ) ) ),
                    GetVariableStringFromActions( result.dependent ) );
            } else {
                // too much change
                if (result && result.independent && _.filter( result.independent, ind => IsChange( ind ) ).length > 1 ) {
                    return languageHandler.getMessage("hypothesisAdaptive.feedback.CVS.fail",
                        GetVariableStringFromActions( result.independent.filter( ind => IsChange( ind ) ) ),
                        GetVariableStringFromActions( result.dependent ) );
                } else {
                    // no change, can't give meaningful feedback
                    return "";
                }
            }
        };
        super( "CVS", validator, feedback );
    }
}

export class InteractionCriterium extends ParseCriterium {
    constructor(languageHandler: LanguageHandler) {
        let validator = (result: NearleyParse) => {
            // has to have at least one independent variable, and at least one variable should have an interaction (x > y, x < y, etc.)
            // todo; and that interaction should make some measure of sense
            return result && result.independent && _.some( result.independent, IsInteraction );
        };
        let feedback = (result: NearleyParse) => {
            let ok = validator( result );

            if ( ok ) {
                // ok, so we know that there _is_ an interaction - safe to cast?
                let interactor: NearleyParseAction = <NearleyParseAction>result.independent.find( IsInteraction );
                return languageHandler.getMessage( "hypothesisAdaptive.feedback.interaction.OK",
                    interactor.variables[0].variable,
                    interactor.variables[1].variable );
            } else {
                return languageHandler.getMessage("hypothesisAdaptive.feedback.interaction.fail",
                    GetVariableStringFromActions(result.independent.filter( ind => IsChange( ind ) )));
            }
        };
        super( "interaction", validator, feedback );
    }
}

export class QualificationCriterium extends ParseCriterium {
    constructor(languageHandler: LanguageHandler) {
        let validator = (result: NearleyParse) => { return !!GetQualifier( result ); };
        let feedback = (result: NearleyParse) => {
            if ( validator( result ) ) {
                return languageHandler.getMessage( "hypothesisAdaptive.feedback.qualified.OK", <string>GetQualifier( result ) );
            } else {
                return languageHandler.getMessage( "hypothesisAdaptive.feedback.qualified.fail" );
            }
        };
        super( "qualified", validator, feedback );
    }
}
