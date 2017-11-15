"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("mz/fs");
const path = require("path");
const mkdirp = require("mkdirp");
const request = require("request-promise");
const progressStream = require("progress-stream");
const ProgressBar = require("progress");
const StreamArray = require('stream-json/utils/StreamArray');
const jsmin = require('jsmin').jsmin;
const LA_URL = "http://golab-dev.collide.info/analytics/log_data";
const encoding = 'utf8';
// make sure outDir exists
function checkOutputDir(location, create = true, file = false) {
    if (file)
        location = path.dirname(location);
    if (create)
        mkdirp.sync(location);
    else
        fs.statSync(location);
}
exports.checkOutputDir = checkOutputDir;
function Write(dir, name, data, ext = "json", prefix = "") {
    let _path = filename(dir, name, ext, prefix);
    dir = path.dirname(_path);
    // make sure dir exists
    return PromiseMkdirp(dir)
        .then((_) => { return (ext === "json") ? JSON.stringify(data, null, 4) : data.toString(); })
        .then(data => { fs.writeFile(_path, data, encoding); return data; })
        .catch(console.error)
        .then((_) => { return data; });
}
exports.Write = Write;
function ReadJsonArray(file) {
    return new Promise(function (resolve, reject) {
        let jsonStream = StreamArray.make();
        let data = [];
        // set up progress bar
        let stat = fs.statSync(file);
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
        str.on('progress', function (progress) {
            bar.tick(progress.delta, { file: file });
        });
        //You'll get json objects here
        jsonStream.output.on('data', (object) => data.push(object.value));
        jsonStream.output.on('end', () => resolve(data));
        // start her up
        fs.createReadStream(file).pipe(str).pipe(jsonStream.input);
    });
}
exports.ReadJsonArray = ReadJsonArray;
function filename(dir, name, ext, prefix = "") {
    // get dir from name if needed
    if (dir === false) {
        dir = path.dirname(name);
        name = path.basename(name);
    }
    // make sure we have the right extension and prefix
    name = prefix + path.basename(name, path.extname(name)) + "." + ext;
    // slap em (back) together
    return path.join(dir, name);
}
exports.filename = filename;
function PromiseMkdirp(dir) {
    return new Promise((resolve, reject) => {
        mkdirp(dir, (err, made) => {
            if (err)
                return reject(err);
            return resolve(made);
        });
    });
}
exports.PromiseMkdirp = PromiseMkdirp;
function getLogs(response) {
    if (typeof response === 'string')
        response = JSON.parse(response);
    return response.logs || response.found || response;
}
;
function Fetch(provider_id, tries = 1, maxTries = 5, returnType) {
    let query = {
        type: "provider_id",
        agentType: "log_data",
        agentName: "log_data",
        providerId: provider_id
    };
    if (returnType)
        query.returnType = returnType;
    let data = request.post(LA_URL, { json: query, timeout: 600000 }) // 10 min timeout
        .then(getLogs)
        .catch(err => {
        // attempt retrying
        console.log(err.cause.code, ": ", query.providerId, ", attempt: ", tries, "/", maxTries);
        if (err.cause.code === 'ECONNRESET') {
            if (tries < maxTries) {
                return Fetch(provider_id, tries + 1);
            }
            else {
                console.log("[ ERROR ]  Failed repeatedly, requesting files on disk.");
                return Fetch(provider_id, tries + 1, maxTries, "file");
            }
        }
        else {
            throw err;
        }
    });
    // Bluebird promise != native promise. 
    // Who thought that was a good idea?
    return Promise.resolve(data);
}
exports.Fetch = Fetch;
;
