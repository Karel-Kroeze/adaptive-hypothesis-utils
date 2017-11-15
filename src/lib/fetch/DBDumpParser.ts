import * as fs from "mz/fs";
import * as IO from "../core/IO";

const encoding = 'utf-8';

export function ParseDBDump(file: string, arrayify: boolean = true, sort: boolean = true): Promise<LogAction[]> {
    // first, read and parse the dump -> json -> array
    return fs.readFile(file, encoding)

        // (conditionally) add array notation
        .then(datastring => {
            if (arrayify) {
                let data = datastring.split("\n") // split into lines
                return "[\n" + data.join(",\n") + "\n]" // add commas between lines, and wrap in []

            } else {
                return datastring
            }
        })

        // parse as JSON, correct the timestamps
        .then(JSON.parse) // we now should have valid JSON, parse it to get an array of LogActions.
        .then(data => data.map((datum: any) => { datum.publishedLA = datum.publishedLA.$date })) // assign published date

        // sort
        .then(data => {
            if (sort) {
                return data.sort((a: LogAction, b: LogAction) => { // sort by name -> date
                    let DateA = new Date( a.publishedLA || '0' );
                    let DateB = new Date( b.publishedLA || '0' );
                    return DateA.getTime() - DateB.getTime();
                })
            }
            else {
                return data;
            }
        });
}