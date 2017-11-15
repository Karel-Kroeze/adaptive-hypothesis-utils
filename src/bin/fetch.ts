#!/usr/bin/env node
import * as docopt from 'docopt';
import * as bluebird from 'bluebird';
import * as fs from 'mz/fs';
import { updateDataConfig, getDataConfig, filename, ParseDBDump, Write, Fetch } from './index';

const Promise = bluebird.Promise;
const docstring = `
Log fetcher.

Usage: 
    fetch [<output_dir>] [<prefix>] [-d]
    fetch --scaffold [<name> <condition>] [-d]
    fetch --id <name> <condition> <provider_id> <provider_id>... [-d]
    fetch --db <name> <condition> <provider_id> <input_file> [<output_file> -d]

Modes:
    (default)   fetch logs given in datasets.json, store in <output_dir>, optionally with <prefix>
    --scaffold  scaffold a datasets.json file
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
let mode: "file" | "db" | "ids" | "scaffold" = "file";
if (opts['--db']) mode = "db";
if (opts['--id']) mode = "ids";
if (opts['--scaffold']) mode = "scaffold";

// process input
let input: string | string[];
let db_dump: string = "";
switch (mode) {
    case "db":
        db_dump = opts['<input_file>'];
        input = opts['<provider_id>'];
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
if ( ( mode === "db" || mode === "ids" ) && ( !input || !input.length ) ) {
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
                        .then( (_) => { updateDataConfig( experimentName, conditionName, provider, file, config ); },
                                (err) => { console.log( "[ WARNING ] Couldn't find raw dataset", provider ) } )
                    }
                }
            }            
        }
        break;

    case "db":
        // parse a db dump as json, and update datasets.json
        console.log( "Parsing", db_dump, ", storing in", target);
        ParseDBDump( db_dump, false, true ).then( logs => Write( false, target, logs, "json", prefix ) );        
        updateDataConfig( name, condition, <string>input, target );
        break;

    case "ids":
        // download logs for provider id's given, and add metadata to datasets.json
        Promise.all( (<string[]>input).map( 
            ( id: string ) => Fetch( id )
                .then( logs => Write( target, id, logs, "json", prefix ) )
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
                    // print message
                    queue = queue.then( (_) => { process.stdout.write( `Fetching ${experiment}/${condition}/${provider_id}...` ); return true; } )

                        // get logs
                        .then( (_) => Fetch( provider_id, 1, 3 ) )
                    
                        // write logs
                        .then( logs => Write( target, provider_id, logs, "json", prefix ) )

                        // update config
                        .then( (_) => updateDataConfig( experiment, condition, provider_id, filename( target, provider_id, "json", prefix ), config ) )

                        // notify
                        .then( (_) => console.log( "\t [ DONE ]" ) )
                }
            }
        }
        
    default:
        break;
}


