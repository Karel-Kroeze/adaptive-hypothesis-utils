import { DataConfig_Files } from "./Config";
import { fs } from "mz";
import { encoding } from "./Constants";

export async function getResource<T>( data: DataConfig_Files, resource: string ): Promise<T[]> {
    if (!data[resource]) {
        return [];
    }
    return fs.readFile( <string>data[resource], encoding )
             .then( JSON.parse )
             .then( data => {
                if ( Array.isArray( data ) ){
                    return data;
                } else if ( data && typeof data === "object" ) {
                    return values( data );
                } else if ( data ) {
                    return [data];
                } else {
                    return [];
                }
             } );
}

function values( object: {[key:string]: any} ): any[] {
    let arr = [];
    for ( let key in object ){
        arr.push( object[key] )
    }
    return arr;
}