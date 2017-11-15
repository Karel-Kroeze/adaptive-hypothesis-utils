"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LogType;
(function (LogType) {
    // hypotheses
    LogType[LogType["hypothesesUpdate"] = 0] = "hypothesesUpdate";
    LogType[LogType["hypothesesChange"] = 1] = "hypothesesChange";
    LogType[LogType["hypothesesFeedback"] = 2] = "hypothesesFeedback";
    // entry tool, conclusion + expectation
    LogType[LogType["expectationChange"] = 3] = "expectationChange";
    LogType[LogType["expectationUpdate"] = 4] = "expectationUpdate";
    LogType[LogType["conclusionChange"] = 5] = "conclusionChange";
    LogType[LogType["conclusionUpdate"] = 6] = "conclusionUpdate";
    // experiment design tool
    LogType[LogType["experimentUpdate"] = 7] = "experimentUpdate";
    LogType[LogType["experimentChange"] = 8] = "experimentChange";
    LogType[LogType["remove"] = 9] = "remove";
    LogType[LogType["other"] = 10] = "other";
})(LogType = exports.LogType || (exports.LogType = {}));
