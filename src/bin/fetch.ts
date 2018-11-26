#!/usr/bin/env node
import * as docopt from 'docopt';
import * as bluebird from 'bluebird';
import * as fs from 'mz/fs';
import {updateDataConfig, getDataConfig} from '../lib/core/Config';
import {filename, Fetch, Write} from '../lib/core/IO';
import {ParseDBDump} from '../lib/fetch/DBDumpParser';
import { ReadJsonArray } from '../lib/index';

const Promise = bluebird.Promise;
const docstring = `
Log fetcher.

Usage: 
    fetch [<output_dir>] [<prefix>] [-d]
    fetch --scaffold [<name> <condition>] [-d]
    fetch --id <name> <condition> <provider_id> <provider_id>... [-d]
    fetch --db <name> <condition> <provider_id> <input_file> [<output_file> -d]
    fetch --raw <name> <condition> <provider_id> <input_file> [<output_file> -d]

Modes:
    (default)   fetch logs given in datasets.json, store in <output_dir>, optionally with <prefix>
    --scaffold  scaffold a datasets.json file
    --raw       add raw log files
    --db        parse and store as json a given mongodb dump file (JSON-like, but not quite)
    --id        fetch the logs for specified provider ids
    
Options:
    -h, --help       show help
    -d, --debug      print debug output
    <provider_id>    list of ids to get logs for, space separated
    <output_file>    path to where the json version of a mongodb dump should be placed.
    <output_dir>     path to a directory where output should be placed. Filenames will be output_dir/{prefix}{providerID}.json.           
`
const opts = docopt.docopt( docstring, {} )

// preprocess inputs.
let debug = opts['--debug'];

// determine mode
let mode: "file" | "raw" | "db" | "ids" | "scaffold" = "file";
if (opts['--db']) mode = "db";
if (opts['--id']) mode = "ids";
if (opts['--scaffold']) mode = "scaffold";
if (opts['--raw']) mode = "raw";

// process input
let input: string | string[];
let db_dump: string = "";
let raw_file: string = "";
switch (mode) {
    case "db":
        db_dump = opts['<input_file>'];
        input = opts['<provider_id>'][0];
        break;
    case "raw":
        raw_file = opts['<input_file>'];
        input = opts['<provider_id>'][0];
        break;
    case "ids":
        input = opts['<provider_id>'];
        break;
    default:
        input = "";
        break;
}

// debug!
if (debug) console.log( opts, mode, input );

// stop on no input, echo docstring
if ( ( mode === "db" || mode === "ids" || mode === "raw" ) && ( !input || !input.length ) ) {
    console.error( "no input given" )
    console.log( docstring );
    process.exit( -1 );
}

// get options
let target: string;
let prefix: string = opts['--prefix'] || "";
let name: string = opts['<name>'];
let condition: string = opts['<condition>'];
switch (mode) {
    case "db":
    case "raw":
        target = opts['<output_file>'] || input;
        break;
    case "ids":
        target = opts['<output_dir>'] || "";
        break;
    case "file":
    default:
        target = opts['<output_dir>'] || "data/raw";
        break;
}


// do our thing
switch (mode) {
    case "scaffold":
        // create fields in datastes.json, create datasets.json if needed.
        console.log( "Scaffolding datasets.json" );
        if ( name && condition )
            updateDataConfig( name, condition, ["provider_id_1", "provider_id_2"], ["", ""] );
        else if ( ( name && !condition ) || ( !name && condition ) )
            throw "scaffold takes exactly 0 or 2 arguments"
        else {
            // add raw dataset locations
            let config = getDataConfig();

            // go over all our datasets
            for (let experimentName in config){
                let experiment = config[experimentName];
                for (let conditionName in experiment){
                    let condition = experiment[conditionName];
                    for (let provider of condition.providers){
                        let file = filename( "./data/raw", provider, "json" )
                        fs.stat( file )
                        .then( (_) => { updateDataConfig( experimentName, conditionName, provider, file, "la", config ); },
                                (err) => { console.log( "[ WARNING ] Couldn't find raw dataset", provider ) } )
                    }
                }
            }            
        }
        break;

    case "db":
        // parse a db dump as json, and update datasets.json
        console.log( "Parsing", db_dump, ", storing in", target);
        ParseDBDump( db_dump, false, true )
            .then( logs => { console.log( logs.length ); return logs })
            .then( logs => Write( "./data/raw", target, logs, "json", prefix, true ) )
            .then( logs => updateDataConfig( name, condition, <string>input, filename( "./data/raw", target, "json" ), "raw" ) )
            .catch( console.error );        
        break;

    case "raw":
        // move json, and update datasets.json
        console.log( "Adding", raw_file, ", storing in ", target );
        ReadJsonArray( raw_file )
            .then( logs => { console.log( logs.length ); return logs } )
            .then( logs => Write( "./data/raw", target, logs, "json", prefix, true ) )
            .then( logs => updateDataConfig( name, condition, <string>input, filename( "./data/raw", target, "json" ), "raw" ) )
            .catch( console.error );
        break;

    case "ids":
        // download logs for provider id's given, and add metadata to datasets.json
        Promise.all( (<string[]>input).map( 
            ( id: string ) => Fetch( id )
                .then( logs => Write( target, id, logs, "json", prefix, true ) )
        ) ).then( (_) => updateDataConfig( name, condition, <string[]>input, (<string[]>input).map( id => filename( target, id, "json", prefix ))  ) )
        break;
    case "file":
        // download logs for provider ids in datasets.json
        let config = getDataConfig();

        // download and update config per experiment & condition
        let queue = Promise.resolve();
        for ( let experiment in config ){
            for ( let condition in config[experiment] ){
                for ( let provider_id of config[experiment][condition].providers ){
                    // skip 'raw' data sets
                    let data_config = config[experiment][condition].data[provider_id];
                    if ( data_config && data_config.source === "raw" ){
                        queue.then( (_) => { process.stdout.write( `Skipping ${experiment}/${condition}/${provider_id}...` ); return true; } )
                        continue;
                    }

                    // print message
                    queue = queue.then( (_) => { process.stdout.write( `Fetching ${experiment}/${condition}/${provider_id}...` ); return true; } )

                        // get logs
                        .then( (_) => Fetch( provider_id, 1, 3 ) )
                    
                        // write logs
                        .then( logs => Write( target, provider_id, logs, "json", prefix, true ) )

                        // update config
                        .then( (_) => updateDataConfig( experiment, condition, provider_id, filename( target, provider_id, "json", prefix ), "la", config ) )

                        // notify
                        .then( (_) => console.log( "\t [ DONE ]" ) )
                }
            }
        }
        
    default:
        break;
}


