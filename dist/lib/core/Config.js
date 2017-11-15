"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const jsmin = require("jsmin");
const IO_1 = require("./IO");
const Constants_1 = require("./Constants");
function updateDataConfig(name, condition, provider, target, config) {
    config = config || getDataConfig();
    if (!config[name])
        config[name] = {};
    let experiment = config[name];
    if (!experiment[condition])
        experiment[condition] = { providers: [], data: {} };
    let _condition = experiment[condition];
    if (typeof (target) !== typeof (provider))
        throw "target and provider arguments do not match";
    // single dataset
    if (typeof (target) === 'string') {
        _condition.providers.push(provider);
        _condition.providers = [...new Set(_condition.providers)]; // unique id's only.
        if (target)
            _condition.data[provider] = { raw: target }; // keyed by id, will be created or purged
    }
    // multiple new datasets
    if (Array.isArray(target)) {
        if (target.length !== provider.length)
            throw "target and provider arguments do not match";
        let targets = target;
        for (let i = 0; i < target.length; i++) {
            _condition.providers.push(provider[i]);
            if (target[i])
                _condition.data[provider[i]] = { raw: target[i] }; // keyed by id, will be created or purged
        }
        _condition.providers = [...new Set(_condition.providers)]; // unique id's only.
    }
    IO_1.Write("", "datasets.json", config);
    return config;
}
exports.updateDataConfig = updateDataConfig;
function getDataConfig(path = "datasets.json") {
    // try loading
    try {
        // console.log( fs.readFileSync( "datasets.json", encoding ) );
        return JSON.parse(jsmin.jsmin(fs.readFileSync(path, Constants_1.encoding)));
    }
    catch (err) {
        // create new
        if (err.code === "ENOENT")
            return {};
        else
            throw err;
    }
}
exports.getDataConfig = getDataConfig;
