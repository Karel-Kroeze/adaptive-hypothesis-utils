"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
function getIndicatorResults(experiment, condition, storyId, story, indicators) {
    let results = [];
    for (let i = 0; i < story.snapshots.length; i++) {
        let result = {
            experiment: experiment,
            condition: condition,
            actor: story.actor.displayName,
            story: storyId,
            snapshot: index_1.GetHypothesisString(story.snapshots[i]),
            attempt: i + 1
        };
        if (!story.snapshots[i].parseResults.results) {
            story.snapshots[i].parseResults.results = story.snapshots[i].parseResults;
        }
        for (let code of story.snapshots[i].parseResults.results) {
            result["c_" + code.test] = code.success;
        }
        for (let indicator of indicators) {
            let indicatorResult = indicator(story, i);
            result[indicatorResult.title] = indicatorResult.result;
        }
        result.reason = story.snapshots[i].reason;
        results.push(result);
    }
    return results;
}
exports.getIndicatorResults = getIndicatorResults;
function feedbackRequested(story, index) {
    return {
        title: "feedback",
        result: story.snapshots.length - 1 > index
    };
}
exports.feedbackRequested = feedbackRequested;
function score(story, index) {
    return {
        title: "score",
        result: story.snapshots[index].parseResults.results.filter(code => code.success).length
    };
}
exports.score = score;
function maxScore(story, index) {
    return {
        title: "maxScore",
        result: story.snapshots[index].parseResults.results.length
    };
}
exports.maxScore = maxScore;
function couldBeImproved(story, index) {
    let title = "couldBeImproved";
    let result;
    if (index == 0)
        result = false;
    else {
        result = score(story, index - 1).result < maxScore(story, index).result;
    }
    return {
        title: title,
        result: result
    };
}
exports.couldBeImproved = couldBeImproved;
function wasImproved(story, index) {
    let title = "wasImproved";
    let result;
    if (index == 0)
        result = false;
    else {
        result = score(story, index).result > score(story, index - 1).result;
    }
    return {
        title: title,
        result: result
    };
}
exports.wasImproved = wasImproved;
function wasChanged(story, index) {
    let title = "wasChanged";
    let result;
    if (index == 0)
        result = false;
    else {
        result = index_1.GetHypothesisString(story.snapshots[index]) != index_1.GetHypothesisString(story.snapshots[index - 1]);
    }
    return { title, result };
}
exports.wasChanged = wasChanged;
