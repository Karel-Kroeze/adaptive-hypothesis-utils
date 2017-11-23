import * as fs from 'mz/fs';
import * as jsmin from 'jsmin';
import {Write} from './IO';
import {encoding} from './Constants';

export function updateDataConfig( name: string, condition: string, provider: string, path: string, source?: dataSource, config?: DataConfig ): DataConfig
export function updateDataConfig( name: string, condition: string, providers: string[], paths: string[], source?: dataSource, config?: DataConfig ): DataConfig
export function updateDataConfig( name: string, condition: string, provider: string | string[], target: string | string[], source: dataSource = "la", config?: DataConfig ): DataConfig {
    config = config || getDataConfig();
    if (!config[name])
        config[name] = {};
    let experiment = config[name];
    if (!experiment[condition])
        experiment[condition] = { providers: [], data: {} }
    let _condition = experiment[condition];

    if (typeof( target ) !== typeof( provider ))
        throw "target and provider arguments do not match";
        
    // single dataset
    if (typeof( target ) === 'string'){
        _condition.providers.push( <string>provider )
        _condition.providers = [ ... new Set( _condition.providers ) ] // unique id's only.
        if (target)
            _condition.data[<string>provider] = { raw: target, source: source } // keyed by id, will be created or purged
    }

    // multiple new datasets
    if (Array.isArray( target )){
        if (target.length !== provider.length )
            throw "target and provider arguments do not match";

        let targets = target;
        for ( let i = 0; i < target.length; i++ ){
            _condition.providers.push( <string>provider[i] )
            if (target[i])
                _condition.data[provider[i]] = { raw: target[i], source: source } // keyed by id, will be created or purged
        }
        _condition.providers = [ ... new Set( _condition.providers ) ] // unique id's only.
    }


    Write( "", "datasets.json", config );
    return config;
}

export function getDataConfig( path: string = "datasets.json" ): DataConfig {
    // try loading
    try {
        // console.log( fs.readFileSync( "datasets.json", encoding ) );
        return JSON.parse( jsmin.jsmin( fs.readFileSync( path, encoding ) ) );
    } catch (err) {
        // create new
        if (err.code === "ENOENT")
            return {}
        else throw err;
    }
}

export interface DataConfig {
    [name: string]: DataConfig_Experiment
}

export interface DataConfig_Experiment {
    [name: string]: DataConfig_Condition
}

export interface DataConfig_Condition {
    providers: string[]
    data: {
        [providerId: string]: DataConfig_Files
    }
}

export type dataSource = "la" | "raw";
export interface DataConfig_Files {
    raw: string
    source: dataSource
    users?: string
    expectations?: string
    hypotheses?: string
    experiments?: string
    conclusions?: string

    // stop TS complaining
    [key: string]: string|undefined
}