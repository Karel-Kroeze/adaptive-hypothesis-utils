"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function FatalError(message, error, ...params) {
    console.error(message, ...params, error || "");
    process.exit(1);
    // just so that typescript understands this function cannot possibly return.
    throw new Error(message);
}
exports.FatalError = FatalError;
