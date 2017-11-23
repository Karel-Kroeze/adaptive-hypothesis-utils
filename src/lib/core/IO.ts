import * as fs from 'mz/fs'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import * as request from 'request-promise'
import * as progressStream from 'progress-stream'
import * as ProgressBar from 'progress'
import { LogAction } from '../types/LogAction';
import { ProviderIdQuery } from '../types/Query';

const StreamArray = require('stream-json/utils/StreamArray');
const JSONStream = require('JSONStream');
const jsmin = require('jsmin').jsmin 

const LA_URL = "http://golab-dev.collide.info/analytics/log_data";
const encoding = 'utf8';

// make sure outDir exists
export function checkOutputDir( location: string, create: boolean = true, file: boolean = false): void {
    if (file)
        location = path.dirname( location );
    if (create)
        mkdirp.sync( location );
    else
        fs.statSync( location );
}

export function Write( dir: string | false, name: string, data: any, ext: "json"|"csv" = "json", prefix: string = "", largeFile = false ): Promise<any> {
    let _path = filename( dir, name, ext, prefix );
    dir = path.dirname( _path );

    // make sure dir exists
    return PromiseMkdirp( dir )
        // parse to json if needed
        .then( (_) => {
            if (ext === "csv") {
                fs.writeFile( _path, data.toString(), encoding );
            } else {
                if ( largeFile ){
                    JSONWriteStream( _path, data );
                } else {
                    fs.writeFile( _path, JSON.stringify( data, null, 4 ));
                }
            }
        })
        .catch( console.error )
        .then( (_: any) => { return data; } )
}

function JSONWriteStream<T>( path: string, data: T[] | { [key: string]: T } ) {
    if (Array.isArray( data )) {
        JSONWriteStreamArray( path, data );
    } else {
        JSONWriteStreamObject( path, data );
    }
}

function JSONWriteStreamArray<T>( path: string, data: T[] ) {
    const stringify = JSONStream.stringify();
    const write = fs.createWriteStream( path );
    stringify.pipe( write );
    stringify.on( "error", report );
    write.on( "error", report );

    for ( const obj of data ){
        console.log( obj )
        stringify.write( obj );
    }
    stringify.end()
} 

function JSONWriteStreamObject<T>( path: string, data: { [key: string]: T } ) {
    const stringify = JSONStream.stringifyObject();
    const write = fs.createWriteStream( path );
    stringify.pipe( write );
    stringify.on( "error", report );
    write.on( "error", report );
    for ( const key in data ){
        console.log( key );
        stringify.write( [key, data[key]] );
    }
    stringify.end()
} 

function report( err: Error ){
    console.error( err );
    throw err;
}

export function ReadJsonArray( file: string ): Promise<any> {
    return new Promise(function(resolve, reject) {
        let jsonStream = StreamArray.make();
        let data: any[] = [];

        // set up progress bar
        let stat = fs.statSync( file );  
        var bar = new ProgressBar('\t:file [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: stat.size
        });
        var str = progressStream({
            length: stat.size,
            time: 100 /* ms */
        });        
        
        str.on('progress', function(progress: any) {
            bar.tick( progress.delta, { file: file } );
        });

        //You'll get json objects here
        jsonStream.output.on('data', (object: { index: number, value: any }) => data.push( object.value ) );
        jsonStream.output.on('end', () => resolve( data ) );

        // start her up
        fs.createReadStream(file).pipe(str).pipe(jsonStream.input);
    })
}

export function filename( dir: string | false, name: string, ext: "json"|"csv", prefix: string = "" ): string {
    // get dir from name if needed
    if (dir === false){ 
        dir = path.dirname( name );
        name = path.basename( name );
    }

    // make sure we have the right extension and prefix
    name = prefix + path.basename( name, path.extname( name ) ) + "." + ext;

    // slap em (back) together
    return path.join( dir, name )
}

export function PromiseMkdirp( dir: string ): Promise<string>{
    return new Promise( ( resolve, reject ) => {
        mkdirp( dir, ( err, made ) => {
            if (err) return reject( err )
            return resolve( made );
        })
    })
}

function getLogs( response: string | any ): LogAction[] {
    if (typeof response === 'string')
        response = JSON.parse(response);
    return response.logs || response.found || response;
};

export function Fetch( provider_id: string, tries: number = 1, maxTries = 5, returnType?: "file"|"preFile" ): Promise<LogAction[]> {

    let query: ProviderIdQuery = {
        type: "provider_id",
        agentType: "log_data",
        agentName: "log_data",
        providerId: provider_id
    };

    if ( returnType )
        query.returnType = returnType;

    let data = request.post( LA_URL, { json: query, timeout: 600000 } ) // 10 min timeout
        .then( getLogs )
        .catch( err => {
            // attempt retrying
            console.log( err.cause.code, ": ", query.providerId, ", attempt: ", tries, "/", maxTries );
            if (err.cause.code === 'ECONNRESET' ) {
                if ( tries < maxTries ){
                    return Fetch( provider_id, tries + 1 );
                } else {
                    console.log( "[ ERROR ]  Failed repeatedly, requesting files on disk.")
                    return Fetch( provider_id, tries + 1, maxTries, "file" )
                }
            } else {
                throw err;
            }
        });
    
    // Bluebird promise != native promise. 
    // Who thought that was a good idea?
    return Promise.resolve<LogAction[]>(data);
};