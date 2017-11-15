/**
 * Created by SikkenJ on 23-2-2017.
 */

interface Metadata {
    id: string,
    published: string,
    publishedServer?: string,
    actor: Actor,
    target: Target,
    generator: Generator,
    provider: Provider
}

interface MetadataPart {
    id: string,
    objectType: string,
    displayName: string
}

interface Actor extends MetadataPart {

}

interface Target extends MetadataPart {
    forApplication?: string
}

interface Generator extends MetadataPart {
    url: string
}

interface Provider extends MetadataPart {
    url: string,
    inquiryPhase: string,
    inquiryPhaseId: string,
    inquiryPhaseName: string,
    displayName: string
}

type contentVerb = "add" | "remove" | "change" | "clear"
type processVerb = "access" | "start" | "cancel" | "send" | "receive"
type storageVerb = "new" | "open" | "create" | "update" | "delete"
type otherVerb = "application_started" | "phase_changed"
type verb = contentVerb | processVerb | storageVerb | otherVerb

type integer = number
type dataString = string

interface LogAction {
    id: string,
    published: dataString,
    publishedLA?: dataString,
    actor: Actor,
    target: Target,
    generator: Generator,
    provider: Provider,
    verb: verb,
    sequenceNumber?: integer
    object: any
}

interface PackageInfo {
    name: string
    buildMillis: integer
    version: string
}

interface DeviceInfo {
    navigator: {
        appCodeName: string
        appName: string
        appVersion: string
        geoLocation: any
        language: string
        oscpu: string
        platform: string
        product: string
        userAgent: string
    }
    browser: any
    screen: any
    features: {
        mobile: boolean
        desktop: boolean
        touch: boolean
        portrait: boolean
        landscape: boolean
        retina: boolean
        transitions: boolean
        transforms: boolean
        gradients: boolean
        multiplebgs: boolean
        boxshadow: boolean
        borderimage: boolean
        borderradius: boolean
        cssreflections: boolean
        fontface: boolean
        rgba: boolean
    }
}

interface Resource {
    metadata: Metadata,
    content?: any
}

interface ErrorLogAction extends LogAction {
    verb: "send"
    object: {
        objectType: "error"
        content: {
            libsInfo: PackageInfo
            commonsInfo: PackageInfo
            toolInfo: PackageInfo
            errorType: string
            display: string
            message: string
            error: {
                message: string
                string: string
                stack: string
            }
            model?: Resource
            configurationModel?: Resource
            device: DeviceInfo
        }
    }
}
