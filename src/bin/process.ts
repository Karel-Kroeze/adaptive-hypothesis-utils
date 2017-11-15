#!/usr/bin/env node
import * as docopt from 'docopt';
import * as fs from 'mz/fs';
import * as path from 'path';
import { FatalError } from '../lib/core/Utils';
import { getDataConfig, DataConfig_Files } from '../lib/core/Config';
import { checkOutputDir, ReadJsonArray, Write, filename } from '../lib/core/IO';
import { LogParser, extractUniqueUsers } from '../lib/fetch/LogParser';
import { LogType } from '../lib/fetch/LogType';
import { LogAction } from '../lib/types/LogAction';

const encoding = 'utf8';
const DEFAULT_PREFIX: string = 'by product';

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
`

// read args
let args = docopt.docopt( docstring, {} );
if (args['--debug']) console.log( args );

// clean up for opts
let opts = {
    mode: args['users'] ? "users" : args['cull'] ? "cull" : "products",
    debug: args['--debug'],
    config: args['--config'],
    output_dir: args['--out'],
    prefix: args['--prefix']
}
if (opts.debug) console.log( opts )

// get data config
let config = getDataConfig( opts.config );
if (opts.debug) console.log( config )
if ( Object.keys(config).length === 0 && config.constructor === Object ){
    console.log( "[ ERROR ] datasets.json not found or empty.");
    process.exit( 1 );
}

// do our thang
if (opts.mode == "users"){
    console.log( "Getting users from log file." );

    // make sure output location exists, create if necessary
    checkOutputDir( opts.output_dir );

    // set default prefix
    if (opts.prefix === DEFAULT_PREFIX)
        opts.prefix = "users_";

    // set up a promise chain/queue
    let queue: Promise<any> = Promise.resolve();

    let processUsers = function( source: string, target: string ): Promise<string[]> {
        return ReadJsonArray( source )
                // .then( data => { console.log( source, data ); return data; })
                .catch( err => FatalError( "[ ERROR ] Read failed :: ", err, source ))
                .then( extractUniqueUsers )
                .catch( err => FatalError( "[ ERROR ] Exctracting users failed :: ", err ))
                // .then( data => { console.log( source, data ); return data; })
                .then( users => Write( false, target, users ) )
                .catch( err => FatalError( "[ ERROR ] Write failed :: ", err, target ) )
    }
    
    // go over all our datasets
    for (let experimentName in config){
        let experiment = config[experimentName];
        for (let conditionName in experiment){
            let condition = experiment[conditionName];
            for (let provider of condition.providers){
                let target = filename( opts.output_dir, provider, "json", opts.prefix );
                queue = queue.then( (_) => processUsers( condition.data[provider].raw, target ) )
                             .then( (_) => { condition.data[provider].users = target; return true; } )
                            //  .then( (_) => { console.log( JSON.stringify( config ) ); return true; } )
            }
        }
    }

    // done!
    queue.then( (_) => { Write( false, opts.config, config ); return true; })
         .then( (_) => console.log( "Extracting users completed. \nYou may want to manually remove test users to remove them from further analyses.") );
}

if (opts.mode === "cull"){
    // set up a promise chain/queue
    let queue: Promise<any> = Promise.resolve();
    
    let processCull = function( source: string ): Promise<string[]> {
        let counts: {[type: number]: number } = {}

        return ReadJsonArray( source )
                // .then( data => { console.log( source, data ); return data; })
                .catch( err => FatalError( "[ ERROR ] Read failed ::", err, source ) )
                .then( data => data.filter( ( datum: LogAction ) => { 
                        let type = LogParser.getLogType( datum );
                        if(!counts[type])
                            counts[type] = 0;
                        counts[type]++;
                        return type !== LogType.other;
                    } ) )
                .catch( err => FatalError( "[ ERROR ] Culling logs failed :: ", err ) )
                .then( data => Write( false, source, data ) )
                .catch( err => FatalError( "[ ERROR ] Write failed ::", err, source ) )
                .then( (_) => {
                    for (let type in counts)
                        console.log( `\t\t${LogType[type]}: ${counts[type]}`)
                    return _;
                } )
    }
    
    // go over all our datasets
    for (let experimentName in config){
        let experiment = config[experimentName];
        for (let conditionName in experiment){
            let condition = experiment[conditionName];
            for (let provider of condition.providers){
                let target = filename( opts.output_dir, provider, "json", opts.prefix );
                queue = queue.then( (_) => processCull( condition.data[provider].raw ) )
                             .then( (_) => { condition.data[provider].users = target; return true; } )
                            //  .then( (_) => { console.log( JSON.stringify( config ) ); return true; } )
            }
        }
    }
}

if (opts.mode === "products"){
    console.log( "Getting products (artefacts) from log file." );

    // make sure output location exists, create if necessary
    checkOutputDir( opts.output_dir );

    // set up a promise chain/queue
    let queue: Promise<any> = Promise.resolve();

    // our payload function
    let processProducts = function( providerId: string, data: DataConfig_Files ){
        // get users
        if (!data.users){
            FatalError( "[ ERROR ] No users found ::", undefined, providerId );
        }

        // prepare data
        let users = fs.readFile( <string>data.users, encoding )
            .then( JSON.parse )
            .catch( err => { FatalError( "[ ERROR ] Failed reading users file ::", err, providerId, data.users )});
        let raw = ReadJsonArray( data.raw )
            .catch( err => { FatalError( "[ ERROR ] Failed reading logs file ::", err, providerId, data.raw )});

        // filter logs
        let logs = Promise.all( [users, raw] ).then( data => {
            let users: string[] = data[0], logs: LogAction[] = data[1];
            return logs.filter( log => users.indexOf( log.actor.displayName ) >= 0 )
        })

        // do our thing
        let products = logs.then( logs => new LogParser().processAll( logs ) );
        products.catch( err => {
            console.log( "UNHANDLED EXCEPTION: ", err.stackTrace, err );
        })

        // store it
        products.then( products => {
            for (let type in products){
                let prefix = (opts.prefix === DEFAULT_PREFIX) ? type + "_" : opts.prefix + "_" + type + "_";
                Write( opts.output_dir, providerId, products[type], "json", prefix );
                data[type] = filename( opts.output_dir, providerId, "json", prefix );
                Write( false, opts.config, config );
            }
            return products;
        })

        // done!
        return products;        
    }

    // go over all our datasets
    for (let experimentName in config){
        let experiment = config[experimentName];
        for (let conditionName in experiment){
            let condition = experiment[conditionName];
            for (let provider of condition.providers){
                queue = queue.then( (_) => processProducts( provider, condition.data[provider] ) );
            }
        }
    }
}