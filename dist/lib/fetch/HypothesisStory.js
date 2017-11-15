"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class HypothesisStory {
    constructor(hypothesis, actor, timestamp) {
        this.updates = [];
        this.snapshots = [];
        this.actor = actor;
        this.update(hypothesis, timestamp);
    }
    update(hypothesis, timestamp) {
        this.updates.push(getUpdate(hypothesis, timestamp));
    }
    takeSnapshot(reason, timestamp) {
        if (!this.latestUpdate)
            console.error("Taking a snapshot before any hypothesis was created!");
        else
            this.snapshots.push(getSnapshot(this.latestUpdate, timestamp, reason));
    }
    toString() {
        if (this.latestUpdate)
            return this.latestUpdate.elements.map(el => el.text).join(" ").trim().toLowerCase();
        // otherwise something is wrong.
        console.error("Taking a snapshot before any hypothesis was created!");
        return "";
    }
    get latestUpdate() {
        return _.last(this.updates);
    }
}
exports.HypothesisStory = HypothesisStory;
function getUpdate(hypothesis, timestamp) {
    hypothesis.timestamp = timestamp || "";
    return hypothesis;
}
exports.getUpdate = getUpdate;
function getSnapshot(hypothesis, timestamp, reason) {
    hypothesis = getUpdate(hypothesis, timestamp);
    hypothesis.reason = reason || "";
    return hypothesis;
}
exports.getSnapshot = getSnapshot;
