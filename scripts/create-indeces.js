// index.d.ts
const path = require('path');
const packageName = '@golab/adaptive-hypotheses'
function sanitizeModuleId( params, log = true ){
    let module = params.currentModuleId;
    let sanitized = packageName + "/" + module.replace( `lib/`, "" );
    if (log) console.log( params, sanitized );
    return sanitized;
}
function sanitizeImportId( params ){
    let sanitized = path.posix.join( sanitizeModuleId( params, false ), params.importedModuleId )
    console.log( params, sanitized );
    return sanitized;
}

require('dts-generator').default({
    name: packageName,
    project: path.join( __dirname, ".."),
    out: path.join( __dirname, "../dist/lib/index.d.ts"),
    resolveModuleId: sanitizeModuleId,
    resolveModuleImport: sanitizeImportId,
});