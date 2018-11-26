"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json2csv = require("json2csv");
const nearley_1 = require("nearley");
const LogType_1 = require("./LogType");
const HypothesisStory_1 = require("./HypothesisStory");
const IO_1 = require("../core/IO");
const Parser_1 = require("../parser/Parser");
const ParserCriteria_1 = require("../parser/ParserCriteria");
const PresenceCriteria_1 = require("../parser/PresenceCriteria");
const Hypothesis_Extensions_1 = require("../core/Hypothesis_Extensions");
const grammar = nearley_1.Grammar.fromCompiled(require("@golab/hypothesis-grammars")['circuits-nl']);
grammar.start = "HYPOTHESIS";
const encoding = "utf8";
class LogParser {
    constructor(expectations = {}, hypotheses = {}, experiments = {}, conclusions = {}) {
        this.expectations = expectations;
        this.hypotheses = hypotheses;
        this.experiments = experiments;
        this.conclusions = conclusions;
    }
    processAll(logs, forceParseResultsUpdate = false) {
        for (let log of logs)
            this.process(log, forceParseResultsUpdate);
        this.finalize();
        this.summarize();
        if (forceParseResultsUpdate) {
            let codesCorrect = {};
            for (let hypothesis in this.hypotheses) {
                for (let snapshot of this.hypotheses[hypothesis].snapshots) {
                    if (snapshot.parseResults) {
                        for (let result of snapshot.parseResults.results) {
                            if (!codesCorrect[result.test]) {
                                codesCorrect[result.test] = 0;
                            }
                            if (result.success) {
                                codesCorrect[result.test]++;
                            }
                        }
                    }
                }
            }
            console.log(codesCorrect);
        }
        return { experiments: this.experiments, hypotheses: this.hypotheses, conclusions: this.conclusions, expectations: this.expectations };
    }
    summarize() {
        console.log(`
\tProducts:
\t\tExpectations:\t ${Object.keys(this.expectations).length}
\t\tHypotheses:\t ${Object.keys(this.hypotheses).length}
\t\tExperiments:\t ${Object.keys(this.experiments).length}
\t\tConclusions:\t ${Object.keys(this.conclusions).length}
        `);
    }
    finalize() {
        for (let id in this.hypotheses)
            this.hypotheses[id].takeSnapshot('final');
        return { experiments: this.experiments, hypotheses: this.hypotheses, conclusions: this.conclusions, expectations: this.expectations };
    }
    store(dir, name) {
        // write JSON versions of everything        
        for (let product in this)
            IO_1.Write(dir, product + "-" + name, this[product])
                .catch(console.error);
        // write CSV version of hypotheses
        let csvString = this.getHypothesesCsvString();
        IO_1.Write(dir, "hypotheses-" + name, csvString, "csv");
    }
    process(log, forceParseResultsUpdate = false) {
        switch (LogParser.getLogType(log)) {
            case LogType_1.LogType.hypothesesUpdate:
                log.object.content.content.forEach((hypothesis) => this.updateHypothesis(hypothesis, log.actor, log.published, forceParseResultsUpdate));
                break;
            case LogType_1.LogType.hypothesesChange:
                this.updateHypothesis(log.object.content, log.actor, log.published, forceParseResultsUpdate);
                break;
            case LogType_1.LogType.hypothesesFeedback:
                this.snapshotHypothesis(log.object.id, 'feedback', log.published);
                break;
            case LogType_1.LogType.conclusionChange:
            case LogType_1.LogType.conclusionUpdate:
                this.updateConclusion(log);
                break;
            case LogType_1.LogType.expectationChange:
            case LogType_1.LogType.expectationUpdate:
                this.updateExpectation(log);
                break;
            case LogType_1.LogType.experimentChange:
            case LogType_1.LogType.experimentUpdate:
                this.updateExperiment(log);
                break;
            default:
                break;
        }
    }
    updateHypothesis(hypothesis, actor, timestamp, forceParseResultsUpdate = false) {
        LogParser.addParseResultsIfMissing(hypothesis, forceParseResultsUpdate);
        let id = hypothesis.id;
        if (!this.hypotheses.hasOwnProperty(id)) {
            this.hypotheses[id] = new HypothesisStory_1.HypothesisStory(hypothesis, actor, timestamp);
        }
        else {
            this.hypotheses[id].update(hypothesis, timestamp);
        }
    }
    static addParseResultsIfMissing(hypothesis, force = false) {
        if (!force && hypothesis.parseResults)
            return;
        let languageHandler = {
            "getMessage": (template, ...pars) => {
                return `template: ${template}\npars:\n\t${pars.join("\n\t")}`;
            }
        };
        let presenceCriteria = [
            new PresenceCriteria_1.VariablesPresentCriterium(2),
            new PresenceCriteria_1.ModifiersPresentCriterium(1)
        ];
        let parserCriteria = [
            new ParserCriteria_1.ManipulationCriterium(languageHandler),
            new ParserCriteria_1.CVSCriterium(languageHandler),
            new ParserCriteria_1.QualificationCriterium(languageHandler)
        ];
        let parser = new Parser_1.HypothesisParser(grammar, presenceCriteria, parserCriteria, false);
        parser.TryParse(hypothesis);
    }
    updateExperiment(log) {
        let id = log.actor.id + "_" + log.target.id;
        this.experiments[id] = { experiment: log.object.content.design, actor: log.actor };
    }
    updateConclusion(log) {
        let id = log.actor.id + "_" + log.target.id;
        this.conclusions[id] = { conclusion: log.object.content.text, actor: log.actor };
    }
    updateExpectation(log) {
        let id = log.actor.id + "_" + log.generator.id;
        this.expectations[id] = { expectation: log.object.content.text, target: log.generator.id, actor: log.actor };
    }
    snapshotHypothesis(id, reason, time) {
        if (!this.hypotheses.hasOwnProperty(id) || !this.hypotheses[id]) {
            // NOTE: The feedbackAccess log does not contain the hypothesis itself, so we cannot reconstruct it on the fly.
            console.error(`WARNING: Taking snapshot of non-existant (empty) hypothesis (id; ${id})...`);
        }
        else {
            this.hypotheses[id].takeSnapshot(reason, time);
        }
    }
    getHypothesesCsvString(coder = 'Parser') {
        let fields = ['name', 'id', 'time', 'hypothesis', 'presence', 'syntax', 'manipulation', 'CVS', 'qualified', 'reason'];
        let csv = [];
        for (let id in this.hypotheses) {
            let story = this.hypotheses[id];
            let name = this.hypotheses[id].actor.displayName;
            for (let h of story.snapshots) {
                let results;
                if (h.codeResults) {
                    let code = h.codeResults.find(code => code.coder === coder);
                    if (code)
                        results = code.results;
                }
                if (!results && h.parseResults)
                    results = h.parseResults.results;
                if (!results) {
                    console.error(`No results for ${id} (${Hypothesis_Extensions_1.getText(h)})`);
                    continue;
                }
                csv.push({
                    name: name,
                    id: id,
                    time: h.timestamp,
                    hypothesis: Hypothesis_Extensions_1.getText(h),
                    presence: this.getCodeStatus(results, "PresenceCheck"),
                    syntax: this.getCodeStatus(results, "Syntax"),
                    manipulation: this.getCodeStatus(results, "manipulation"),
                    CVS: this.getCodeStatus(results, "CVS"),
                    qualified: this.getCodeStatus(results, "qualified"),
                    reason: h.reason
                });
            }
        }
        try {
            return json2csv({ data: csv, fields: fields });
        }
        catch (err) {
            console.error(err);
        }
    }
    getCodeStatus(codes, name) {
        if (!codes)
            return undefined;
        let code = codes.find(code => code.test === name);
        return code ? code.success : undefined;
    }
    static getLogType(log) {
        if (log.verb === "update") {
            if (log.target.objectType === "hypotheses")
                return LogType_1.LogType.hypothesesUpdate;
            if (log.target.objectType === "experiment_designs")
                return LogType_1.LogType.experimentUpdate;
            if (log.target.objectType === "entry") {
                if (log.provider.inquiryPhase === "Conclusion")
                    return LogType_1.LogType.conclusionUpdate;
                if (log.provider.inquiryPhase === "Conceptualisation")
                    return LogType_1.LogType.expectationUpdate;
            }
        }
        if (log.verb === "change") {
            if (log.target.objectType === "hypotheses" && log.object.objectType === "hypothesis")
                return LogType_1.LogType.hypothesesChange;
            if (log.target.objectType === "experiment_designs")
                return LogType_1.LogType.experimentChange;
            if (log.target.objectType === "entry") {
                if (log.provider.inquiryPhase === "Conclusion")
                    return LogType_1.LogType.conclusionChange;
                if (log.provider.inquiryPhase === "Conceptualisation")
                    return LogType_1.LogType.expectationChange;
            }
        }
        if (log.verb === "access") {
            if (log.object.objectType === "feedbackAccess")
                return LogType_1.LogType.hypothesesFeedback;
        }
        // otherwise
        return LogType_1.LogType.other;
    }
}
exports.LogParser = LogParser;
function extractUniqueUsers(logs) {
    return [...new Set(logs.map(log => log.actor.displayName))];
}
exports.extractUniqueUsers = extractUniqueUsers;
