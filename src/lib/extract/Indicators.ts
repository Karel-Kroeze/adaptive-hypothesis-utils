import { IHypothesisStory, IHypothesisSnapshot, GetHypothesisString } from "../index";

export type SnapshotIndicator = ( story: IHypothesisStory, index: number ) => ISnapshotIndicatorResult

export interface ISnapshotIndicatorResults {
    experiment: string
    condition: string
    actor: string,

    story: string,

    snapshot: string,

    [indicator: string]: any
}

export interface ISnapshotIndicatorResult {
    title: string,

    result: boolean | number | undefined
}

export function getIndicatorResults( experiment: string, condition: string, storyId: string, story: IHypothesisStory, indicators: SnapshotIndicator[] ): ISnapshotIndicatorResults[] {
    let results = [];
    for ( let i = 0; i < story.snapshots.length; i++ ){
        let result: ISnapshotIndicatorResults = {
            experiment: experiment,
            condition: condition,
            actor: story.actor.displayName,
            story: storyId,
            snapshot: GetHypothesisString( story.snapshots[i] ),
            attempt: i + 1
        }
        if (!story.snapshots[i].parseResults.results ) {
            story.snapshots[i].parseResults.results = <any>story.snapshots[i].parseResults;
        }
        for( let code of story.snapshots[i].parseResults.results ){
            result["c_" + code.test] = code.success;
        }
        for( let indicator of indicators ){
            let indicatorResult = indicator( story, i );
            result[indicatorResult.title] = indicatorResult.result;
        }
        result.reason = story.snapshots[i].reason;
        results.push( result );
    }
    return results;
}

export function feedbackRequested( story: IHypothesisStory, index: number ): { title: string, result: boolean } {
    return { 
        title: "feedback",
        result: story.snapshots.length - 1 > index
    };
}

export function score( story: IHypothesisStory, index: number ): { title: string, result: number }{
    return {
        title: "score",
        result: story.snapshots[index].parseResults.results.filter( code => code.success ).length
    }
}

export function maxScore( story: IHypothesisStory, index: number ): { title: string, result: number }{
    return {
        title: "maxScore", 
        result: story.snapshots[index].parseResults.results.length
    }
}

export function couldBeImproved( story: IHypothesisStory, index: number ): {title: string, result: boolean }{
    let title = "couldBeImproved";
    let result: boolean;
    if (index == 0 )
        result = false;
    else {
        result = score( story, index - 1 ).result < maxScore( story, index ).result;
    }
    return {
        title: title, 
        result: result
    }
}

export function wasImproved( story: IHypothesisStory, index: number ): {title: string, result: boolean}{
    let title = "wasImproved";
    let result: boolean;
    if (index == 0 )
        result = false;
    else {
        result = score( story, index ).result > score( story, index - 1 ).result;
    }
    return {
        title: title, 
        result: result
    }
}

export function wasChanged( story: IHypothesisStory, index: number): {title: string, result: boolean}{
    let title = "wasChanged";
    let result: boolean;
    if (index == 0 )
        result = false;
    else { 
        result = GetHypothesisString( story.snapshots[index] ) != GetHypothesisString( story.snapshots[index - 1] );
    }
    return {title, result};
}