#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docopt = require("docopt");
const fs = require("mz/fs");
const Utils_1 = require("../lib/core/Utils");
const Config_1 = require("../lib/core/Config");
const IO_1 = require("../lib/core/IO");
const LogParser_1 = require("../lib/fetch/LogParser");
const LogType_1 = require("../lib/fetch/LogType");
const encoding = 'utf8';
const DEFAULT_PREFIX = 'by product';
let docstring = `
Usage:
    process [products] [options]
    process cull [options]
    process users [options]
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
    console.log(config);
if (Object.keys(config).length === 0 && config.constructor === Object) {
    console.log("[ ERROR ] datasets.json not found or empty.");
    process.exit(1);
}
// do our thang
if (opts.mode == "users") {
    console.log("Getting users from log file.");
    // make sure output location exists, create if necessary
    IO_1.checkOutputDir(opts.output_dir);
    // set default prefix
    if (opts.prefix === DEFAULT_PREFIX)
        opts.prefix = "users_";
    // set up a promise chain/queue
    let queue = Promise.resolve();
    let processUsers = function (source, target) {
        return IO_1.ReadJsonArray(source)
            .catch(err => Utils_1.FatalError("[ ERROR ] Read failed :: ", err, source))
            .then(LogParser_1.extractUniqueUsers)
            .catch(err => Utils_1.FatalError("[ ERROR ] Exctracting users failed :: ", err))
            .then(users => IO_1.Write(false, target, users))
            .catch(err => Utils_1.FatalError("[ ERROR ] Write failed :: ", err, target));
    };
    // go over all our datasets
    for (let experimentName in config) {
        let experiment = config[experimentName];
        for (let conditionName in experiment) {
            let condition = experiment[conditionName];
            for (let provider of condition.providers) {
                let target = IO_1.filename(opts.output_dir, provider, "json", opts.prefix);
                queue = queue.then((_) => processUsers(condition.data[provider].raw, target))
                    .then((_) => { condition.data[provider].users = target; return true; });
                //  .then( (_) => { console.log( JSON.stringify( config ) ); return true; } )
            }
        }
    }
    // done!
    queue.then((_) => { IO_1.Write(false, opts.config, config); return true; })
        .then((_) => console.log("Extracting users completed. \nYou may want to manually remove test users to remove them from further analyses."));
}
if (opts.mode === "cull") {
    // set up a promise chain/queue
    let queue = Promise.resolve();
    let processCull = function (source) {
        let counts = {};
        return IO_1.ReadJsonArray(source)
            .catch(err => Utils_1.FatalError("[ ERROR ] Read failed ::", err, source))
            .then(data => data.filter((datum) => {
            let type = LogParser_1.LogParser.getLogType(datum);
            if (!counts[type])
                counts[type] = 0;
            counts[type]++;
            return type !== LogType_1.LogType.other;
        }))
            .catch(err => Utils_1.FatalError("[ ERROR ] Culling logs failed :: ", err))
            .then(data => IO_1.Write(false, source, data))
            .catch(err => Utils_1.FatalError("[ ERROR ] Write failed ::", err, source))
            .then((_) => {
            for (let type in counts)
                console.log(`\t\t${LogType_1.LogType[type]}: ${counts[type]}`);
            return _;
        });
    };
    // go over all our datasets
    for (let experimentName in config) {
        let experiment = config[experimentName];
        for (let conditionName in experiment) {
            let condition = experiment[conditionName];
            for (let provider of condition.providers) {
                let target = IO_1.filename(opts.output_dir, provider, "json", opts.prefix);
                queue = queue.then((_) => processCull(condition.data[provider].raw))
                    .then((_) => { condition.data[provider].users = target; return true; });
                //  .then( (_) => { console.log( JSON.stringify( config ) ); return true; } )
            }
        }
    }
}
if (opts.mode === "products") {
    console.log("Getting products (artefacts) from log file.");
    // make sure output location exists, create if necessary
    IO_1.checkOutputDir(opts.output_dir);
    // set up a promise chain/queue
    let queue = Promise.resolve();
    // our payload function
    let processProducts = function (providerId, data) {
        // get users
        if (!data.users) {
            Utils_1.FatalError("[ ERROR ] No users found ::", undefined, providerId);
        }
        // prepare data
        let users = fs.readFile(data.users, encoding)
            .then(JSON.parse)
            .catch(err => { Utils_1.FatalError("[ ERROR ] Failed reading users file ::", err, providerId, data.users); });
        let raw = IO_1.ReadJsonArray(data.raw)
            .catch(err => { Utils_1.FatalError("[ ERROR ] Failed reading logs file ::", err, providerId, data.raw); });
        // filter logs
        let logs = Promise.all([users, raw]).then(data => {
            let users = data[0], logs = data[1];
            return logs.filter(log => users.indexOf(log.actor.displayName) >= 0);
        });
        // do our thing
        let products = logs.then(logs => new LogParser_1.LogParser().processAll(logs));
        products.catch(err => {
            console.log("UNHANDLED EXCEPTION: ", err.stackTrace, err);
        });
        // store it
        products.then(products => {
            for (let type in products) {
                let prefix = (opts.prefix === DEFAULT_PREFIX) ? type + "_" : opts.prefix + "_" + type + "_";
                IO_1.Write(opts.output_dir, providerId, products[type], "json", prefix);
                data[type] = IO_1.filename(opts.output_dir, providerId, "json", prefix);
                IO_1.Write(false, opts.config, config);
            }
            return products;
        });
        // done!
        return products;
    };
    // go over all our datasets
    for (let experimentName in config) {
        let experiment = config[experimentName];
        for (let conditionName in experiment) {
            let condition = experiment[conditionName];
            for (let provider of condition.providers) {
                queue = queue.then((_) => processProducts(provider, condition.data[provider]));
            }
        }
    }
}
