import { IHypothesisStory } from "../index";
export declare type SnapshotIndicator = (story: IHypothesisStory, index: number) => ISnapshotIndicatorResult;
export interface ISnapshotIndicatorResults {
    experiment: string;
    condition: string;
    actor: string;
    story: string;
    snapshot: string;
    [indicator: string]: any;
}
export interface ISnapshotIndicatorResult {
    title: string;
    result: boolean | number | undefined;
}
export declare function getIndicatorResults(experiment: string, condition: string, storyId: string, story: IHypothesisStory, indicators: SnapshotIndicator[]): ISnapshotIndicatorResults[];
export declare function feedbackRequested(story: IHypothesisStory, index: number): {
    title: string;
    result: boolean;
};
export declare function score(story: IHypothesisStory, index: number): {
    title: string;
    result: number;
};
export declare function maxScore(story: IHypothesisStory, index: number): {
    title: string;
    result: number;
};
export declare function couldBeImproved(story: IHypothesisStory, index: number): {
    title: string;
    result: boolean;
};
export declare function wasImproved(story: IHypothesisStory, index: number): {
    title: string;
    result: boolean;
};
export declare function wasChanged(story: IHypothesisStory, index: number): {
    title: string;
    result: boolean;
};
