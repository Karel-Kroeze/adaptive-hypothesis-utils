/**
 * Created by SikkenJ on 23-2-2017.
 */
export interface LogActionQuery {
    agentType: "log_data";
    agentName: "log_data";
    returnType?: "file" | "preFile";
}
export interface ProviderDisplayNameQuery extends LogActionQuery {
    type: "provider_displayName";
    displayName: string;
}
export interface ProviderIdQuery extends LogActionQuery {
    type: "provider_id";
    providerId: string;
}
export interface AllActorsQuery extends LogActionQuery {
    type: "all_actors";
    ilsId: string;
}
export interface ObjectTypeQuery extends LogActionQuery {
    objectType: string;
    ilsId?: string;
    startTime?: string;
    endTime?: string;
}
export interface TimedQuery extends LogActionQuery {
    startTime: string;
    endTime: string;
    ilsId: string;
    userId?: string;
}
export interface UserQuery extends LogActionQuery {
    ilsId: string;
    userId: string;
}
export interface IlsQuery extends LogActionQuery {
    ilsId: string;
}
