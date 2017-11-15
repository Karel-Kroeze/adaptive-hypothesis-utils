import * as nearley from 'nearley';
import {ParseCriterium, NearleyParse} from './ParserCriteria'; 
import {PresenceCriterium} from './PresenceCriteria';

export function CreateParseResult( test: string, success: boolean, result: any, reason: CriteriumErrorReason = CriteriumErrorReason.Criterium ): ICriteriumResult {
    if (success)
        return {
            test: test,
            success: true,
            result: result
        }

    return {
        test: test,
        success: false,
        error: {
            reason: reason,
            message: result
        }
    }
}

export function GetHypothesisString(h: IHypothesis): string {
    return h.elements
        .map(element => element.text)
        .join(" ")
        .replace(/(\r\n|\n|\r)/gm, "")
        .toLowerCase();
}
 
export class HypothesisParser {
    public constructor(
        public grammar: nearley.Grammar,
        public presenceCriteria: PresenceCriterium[],
        public parseCriteria: ParseCriterium[],
        public debug: boolean = false
    ) {}

    public TryParse( hypothesis: IHypothesis ): void {
        hypothesis.parseResults = [
            ... this.DoPresenceCriteria( hypothesis, this.presenceCriteria ),
            ... this.DoParseCriteria( hypothesis, this.parseCriteria )
        ];

        // console feedback
        if (this.debug) {
            console.log( "\n" + GetHypothesisString( hypothesis ) )
            for (let result of hypothesis.parseResults) {
                if (result.success) {
                    console.log( "\t[ OK   ]\t" + result.test );
                } else {
                    console.log( "\t[ FAIL ]\t" + result.test + " :: " + typeof result.error !== undefined ? (<ICriteriumError>result.error).message : "undefined" );
                }
            }
        }
    }

    public static MarkFailPosition(hypothesis: string, offset: number): string {
        // get the indeces of the left and right word boundaries.
        let start = hypothesis.lastIndexOf(" ", offset) + 1;
        let end = hypothesis.indexOf(" ", offset);

        // if left/right are < 0 there was nothing found. In these cases, set them to the min/max indeces.
        if (start < 0) {
            start = 0;
        }
        if (end < 0) {
            end = hypothesis.length;
        }

        return hypothesis.substring(0, start) +
            "<span class='error'>" +
            hypothesis.substring(start, end) +
            "</span>" +
            hypothesis.substring(end);
    }

    private DoPresenceCriteria(hypothesis: IHypothesis, criteria: PresenceCriterium[] ): ICriteriumResult[] {
        return criteria.map( criterium => criterium.result( hypothesis ) );
    }
    
    private DoParseCriteria(hypothesis: IHypothesis, criteria: ParseCriterium[] ): ICriteriumResult[] {
        let parser = new nearley.Parser( this.grammar );
        let h = GetHypothesisString(hypothesis);

        try {
            parser.feed(h);
            let results = <NearleyParse[]>parser.finish();
            if (results.length) {
                if ( this.debug ) {
                    console.log( JSON.stringify( results, null, 4 ) );
                }
                // finished. Syntax OK, check criteria.
                return criteria.map( criterium => criterium.result( results[0] ) );
            } else {
                // finish without result or running out of options
                return [ CreateParseResult( "Syntax", false, h, CriteriumErrorReason.Incomplete ) ];
            }
        } catch (err) {
            // error: ran out of options
            
            return [ CreateParseResult( "Syntax", false, HypothesisParser.MarkFailPosition(h, err.offset), CriteriumErrorReason.Syntax ) ];
        }
    }
}
