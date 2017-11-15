// index.js
const indexer = require('create-index');
const path = require('path');
const basePath = path.join( __dirname, "../dist/lib" );
const dirs = [
    "core",
    "fetch",
    "parser",
    "."
].map( dir => path.join( basePath, dir ));

indexer.writeIndex( dirs )

// index.d.ts
const packageName = '@golab/adaptive-hypotheses'
function sanitizeModuleId( params ){
    return packageName + "/" + params.currentModuleId.replace( `lib/`, "" );
}

require('dts-generator').default({
    name: packageName,
    project: path.join( __dirname, ".."),
    out: path.join( __dirname, "../dist/lib/index.d.ts"),
    resolveModuleId: sanitizeModuleId
});