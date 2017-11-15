export function FatalError( message: string, error?: Error, ...params: any[] ): never {
    console.error( message, ...params, error || "" )
    process.exit( 1 );

    // just so that typescript understands this function cannot possibly return.
    throw new Error( message );
}