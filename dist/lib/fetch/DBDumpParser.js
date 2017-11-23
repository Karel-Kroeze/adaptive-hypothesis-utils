"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lineReader = require("line-by-line");
const encoding = 'utf-8';
function ParseDBDump(file, arrayify = true, sort = true) {
    return new Promise((resolve, reject) => {
        const lr = new lineReader(file);
        const data = [];
        lr.on("error", (err) => reject(err));
        lr.on("line", (line) => {
            try {
                // parse to json, remove trailing comma if needed
                let datum = JSON.parse(line.replace(/,$/, ""));
                // properly attach date
                datum.publishedLA = datum.publishedLA.$date;
                // add to data
                data.push(datum);
            }
            catch (err) {
                console.error(`Could not parse "${line}"; ${err}`);
            }
        });
        lr.on("end", () => {
            if (sort) {
                data.sort((a, b) => {
                    let DateA = new Date(a.publishedLA || '0');
                    let DateB = new Date(b.publishedLA || '0');
                    return DateA.getTime() - DateB.getTime();
                });
            }
            return resolve(data);
        });
    });
}
exports.ParseDBDump = ParseDBDump;
