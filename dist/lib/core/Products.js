"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mz_1 = require("mz");
const Constants_1 = require("./Constants");
function getResource(data, resource) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data[resource]) {
            return [];
        }
        return mz_1.fs.readFile(data[resource], Constants_1.encoding)
            .then(JSON.parse)
            .then(data => {
            if (Array.isArray(data)) {
                return data;
            }
            else if (data && typeof data === "object") {
                return values(data);
            }
            else if (data) {
                return [data];
            }
            else {
                return [];
            }
        });
    });
}
exports.getResource = getResource;
function values(object) {
    let arr = [];
    for (let key in object) {
        arr.push(object[key]);
    }
    return arr;
}
