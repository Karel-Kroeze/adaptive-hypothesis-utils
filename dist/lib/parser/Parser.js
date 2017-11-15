"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nearley = require("nearley");
function CreateParseResult(test, success, result, reason = CriteriumErrorReason.Criterium) {
    if (success)
        return {
            test: test,
            success: true,
            result: result
        };
    return {
        test: test,
        success: false,
        error: {
            reason: reason,
            message: result
        }
    };
}
exports.CreateParseResult = CreateParseResult;
function GetHypothesisString(h) {
    return h.elements
        .map(element => element.text)
        .join(" ")
        .replace(/(\r\n|\n|\r)/gm, "")
        .toLowerCase();
}
exports.GetHypothesisString = GetHypothesisString;
class HypothesisParser {
    constructor(grammar, presenceCriteria, parseCriteria, debug = false) {
        this.grammar = grammar;
        this.presenceCriteria = presenceCriteria;
        this.parseCriteria = parseCriteria;
        this.debug = debug;
    }
    TryParse(hypothesis) {
        hypothesis.parseResults = [
            ...this.DoPresenceCriteria(hypothesis, this.presenceCriteria),
            ...this.DoParseCriteria(hypothesis, this.parseCriteria)
        ];
        // console feedback
        if (this.debug) {
            console.log("\n" + GetHypothesisString(hypothesis));
            for (let result of hypothesis.parseResults) {
                if (result.success) {
                    console.log("\t[ OK   ]\t" + result.test);
                }
                else {
                    console.log("\t[ FAIL ]\t" + result.test + " :: " + typeof result.error !== undefined ? result.error.message : "undefined");
                }
            }
        }
    }
    static MarkFailPosition(hypothesis, offset) {
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
    DoPresenceCriteria(hypothesis, criteria) {
        return criteria.map(criterium => criterium.result(hypothesis));
    }
    DoParseCriteria(hypothesis, criteria) {
        let parser = new nearley.Parser(this.grammar);
        let h = GetHypothesisString(hypothesis);
        try {
            parser.feed(h);
            let results = parser.finish();
            if (results.length) {
                if (this.debug) {
                    console.log(JSON.stringify(results, null, 4));
                }
                // finished. Syntax OK, check criteria.
                return criteria.map(criterium => criterium.result(results[0]));
            }
            else {
                // finish without result or running out of options
                return [CreateParseResult("Syntax", false, h, CriteriumErrorReason.Incomplete)];
            }
        }
        catch (err) {
            // error: ran out of options
            return [CreateParseResult("Syntax", false, HypothesisParser.MarkFailPosition(h, err.offset), CriteriumErrorReason.Syntax)];
        }
    }
}
exports.HypothesisParser = HypothesisParser;
