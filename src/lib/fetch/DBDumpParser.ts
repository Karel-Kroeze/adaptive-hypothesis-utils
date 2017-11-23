import * as fs from "mz/fs";
import * as IO from "../core/IO";
import { LogAction } from "../types/LogAction";
import * as lineReader from 'line-by-line';

const encoding = 'utf-8';

export function ParseDBDump(file: string, arrayify: boolean = true, sort: boolean = true): Promise<LogAction[]> {
    return new Promise( (resolve, reject) => {
        const lr = new lineReader( file );
        const data: LogAction[] = [];
        
        lr.on( "error", (err) => reject( err ) );
        lr.on( "line", (line: string ) => {
            try {
                // parse to json, remove trailing comma if needed
                let datum = JSON.parse( line.replace( /,$/, "" ) );
                
                // properly attach date
                datum.publishedLA = datum.publishedLA.$date;
    
                // add to data
                data.push( datum );
            } catch (err) {
                console.error( `Could not parse "${line}"; ${err}`);
            }
        })
        lr.on( "end", () => {
            if (sort) {
                data.sort((a: LogAction, b: LogAction) => { // sort by date
                    let DateA = new Date( a.publishedLA || '0' );
                    let DateB = new Date( b.publishedLA || '0' );
                    return DateA.getTime() - DateB.getTime();
                })
            }
            return resolve( data );
        })
    })
}