"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const coreindexts = require("./core/index");
const fetchindexts = require("./fetch/index");
const parserindexts = require("./parser/index");
const typesindexts = require("./types/index");
exports.core = {
    index: coreindexts,
};
exports.fetch = {
    index: fetchindexts,
};
exports.parser = {
    index: parserindexts,
};
exports.types = {
    index: typesindexts,
};
