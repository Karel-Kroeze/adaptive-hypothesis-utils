#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docopt = require("docopt");
const fs = require("mz/fs");
const IO_1 = require("../lib/core/IO");
const Config_1 = require("../lib/core/Config");
const Indicators_1 = require("../lib/extract/Indicators");
const ENCODING = 'utf8';
const DEFAULT_PREFIX = '';
let docstring = `
Usage:
    extract [options]
Options:
    -f <file>, -c <file>, --config <file>   location of datasets.json config file [default: ./datasets.json]
    -o <dir>, --out <dir>                   location where output will be stored [default: ./data/clean/]
    -p <string>, --prefix <string>          prefix for output files [default: ${DEFAULT_PREFIX}]
    -h, --help                              show this message
    -d, --debug                             print debug information
`;
// read args
let args = docopt.docopt(docstring, {});
if (args['--debug'])
    console.log(args);
// clean up for opts
let opts = {
    mode: args['users'] ? "users" : args['cull'] ? "cull" : "products",
    debug: args['--debug'],
    config: args['--config'],
    output_dir: args['--out'],
    prefix: args['--prefix']
};
if (opts.debug)
    console.log(opts);
// get data config
let config = Config_1.getDataConfig(opts.config);
if (opts.debug)
    console.log(JSON.stringify(config, null, 2));
if (Object.keys(config).length === 0 && config.constructor === Object) {
    console.log("[ ERROR ] datasets.json not found or empty.");
    process.exit(1);
}
// do our thing
let results = [];
for (let experiment in config) {
    if (opts.debug)
        console.log(experiment);
    for (let condition in config[experiment]) {
        if (opts.debug)
            console.log("\t" + condition);
        for (let provider of config[experiment][condition].providers) {
            if (opts.debug)
                console.log("\t\t" + provider);
            // get data
            if (!config[experiment][condition].data[provider].hypotheses) {
                console.warn("no hypotheses data listed for ", experiment, condition, provider);
                continue;
            }
            let stories = JSON.parse(fs.readFileSync(config[experiment][condition].data[provider].hypotheses, ENCODING));
            for (let story in stories) {
                results.push(...Indicators_1.getIndicatorResults(experiment, condition, story, stories[story], [Indicators_1.score, Indicators_1.couldBeImproved, Indicators_1.feedbackRequested, Indicators_1.wasImproved, Indicators_1.wasChanged]));
            }
        }
    }
}
IO_1.Write(opts.output_dir, "indicators", results, "json", opts.prefix, false);
console.log(results.length);
