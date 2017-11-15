"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const encoding = 'utf-8';
function ParseDBDump(file, arrayify = true, sort = true) {
    // first, read and parse the dump -> json -> array
    return fs.readFile(file, encoding)
        .then(datastring => {
        if (arrayify) {
            let data = datastring.split("\n"); // split into lines
            return "[\n" + data.join(",\n") + "\n]"; // add commas between lines, and wrap in []
        }
        else {
            return datastring;
        }
    })
        .then(JSON.parse) // we now should have valid JSON, parse it to get an array of LogActions.
        .then(data => data.map((datum) => { datum.publishedLA = datum.publishedLA.$date; })) // assign published date
        .then(data => {
        if (sort) {
            return data.sort((a, b) => {
                let DateA = new Date(a.publishedLA || '0');
                let DateB = new Date(b.publishedLA || '0');
                return DateA.getTime() - DateB.getTime();
            });
        }
        else {
            return data;
        }
    });
}
exports.ParseDBDump = ParseDBDump;
