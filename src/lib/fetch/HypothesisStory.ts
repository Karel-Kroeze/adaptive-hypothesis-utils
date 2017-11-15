import * as _ from "lodash";

export class HypothesisStory implements IHypothesisStory {
    actor: Actor;
    snapshots: IHypothesisSnapshot[];
    updates: IHypothesisUpdate[];

    constructor( 
        hypothesis: IHypothesis,
        actor: Actor,
        timestamp?: string
    ){
        this.updates = [];
        this.snapshots = [];
        this.actor = actor;

        this.update( hypothesis, timestamp )
    }

    update( hypothesis: IHypothesis, timestamp?: string ){
        this.updates.push( getUpdate( hypothesis, timestamp ) );
    }

    takeSnapshot( reason: string, timestamp?: string ){
        if (!this.latestUpdate)
            console.error( "Taking a snapshot before any hypothesis was created!" )
        else 
            this.snapshots.push( getSnapshot( this.latestUpdate, timestamp, reason ) );
    }

    toString(): string {
        if (this.latestUpdate)
            return this.latestUpdate.elements.map( el => el.text ).join( " " ).trim().toLowerCase();

        // otherwise something is wrong.
        console.error( "Taking a snapshot before any hypothesis was created!" )
        return "";
    }

    get latestUpdate(){
        return _.last( this.updates );
    }
}

export function getUpdate( hypothesis: IHypothesis, timestamp?: string ): IHypothesisUpdate {
    (<IHypothesisUpdate>hypothesis).timestamp = timestamp || "";
    return <IHypothesisUpdate>hypothesis;
}

export function getSnapshot( hypothesis: IHypothesis, timestamp?: string, reason?: string ): IHypothesisSnapshot {
    hypothesis = getUpdate( hypothesis, timestamp );
    (<IHypothesisSnapshot>hypothesis).reason = reason || "";
    return <IHypothesisSnapshot>hypothesis;
}