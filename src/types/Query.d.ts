/**
 * Created by SikkenJ on 23-2-2017.
 */

interface LogActionQuery {
    agentType: "log_data"
    agentName: "log_data"
    returnType?: "file" | "preFile"
}

interface ProviderDisplayNameQuery extends LogActionQuery {
    type: "provider_displayName"
    displayName: string
}

interface ProviderIdQuery extends LogActionQuery {
    type: "provider_id"
    providerId: string
}

interface AllActorsQuery extends LogActionQuery {
    type: "all_actors"
    ilsId: string
}

interface ObjectTypeQuery extends LogActionQuery {
    objectType: string
    ilsId?: string
    startTime?: string
    endTime?: string
}

interface TimedQuery extends LogActionQuery {
    startTime: string
    endTime: string
    ilsId: string
    userId?: string
}

interface UserQuery extends LogActionQuery {
    ilsId: string
    userId: string
}

interface IlsQuery extends LogActionQuery {
    ilsId: string
}
