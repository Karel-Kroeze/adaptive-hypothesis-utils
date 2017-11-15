import { IHypothesisStory, IHypothesisSnapshot, IHypothesisUpdate, IHypothesis } from "../types/Product";
import { Actor } from "../types/LogAction";
export declare class HypothesisStory implements IHypothesisStory {
    actor: Actor;
    snapshots: IHypothesisSnapshot[];
    updates: IHypothesisUpdate[];
    constructor(hypothesis: IHypothesis, actor: Actor, timestamp?: string);
    update(hypothesis: IHypothesis, timestamp?: string): void;
    takeSnapshot(reason: string, timestamp?: string): void;
    toString(): string;
    readonly latestUpdate: IHypothesisUpdate | undefined;
}
export declare function getUpdate(hypothesis: IHypothesis, timestamp?: string): IHypothesisUpdate;
export declare function getSnapshot(hypothesis: IHypothesis, timestamp?: string, reason?: string): IHypothesisSnapshot;
