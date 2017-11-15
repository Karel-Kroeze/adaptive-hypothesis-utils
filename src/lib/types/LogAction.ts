/**
 * Created by SikkenJ on 23-2-2017.
 */

export interface Metadata {
    id: string,
    published: string,
    publishedServer?: string,
    actor: Actor,
    target: Target,
    generator: Generator,
    provider: Provider
}

export interface MetadataPart {
    id: string,
    objectType: string,
    displayName: string
}

export interface Actor extends MetadataPart {

}

export interface Target extends MetadataPart {
    forApplication?: string
}

export interface Generator extends MetadataPart {
    url: string
}

export interface Provider extends MetadataPart {
    url: string,
    inquiryPhase: string,
    inquiryPhaseId: string,
    inquiryPhaseName: string,
    displayName: string
}

export type contentVerb = "add" | "remove" | "change" | "clear"
export type processVerb = "access" | "start" | "cancel" | "send" | "receive"
export type storageVerb = "new" | "open" | "create" | "update" | "delete"
export type otherVerb = "application_started" | "phase_changed"
export type verb = contentVerb | processVerb | storageVerb | otherVerb

export type integer = number

export interface LogAction {
    id: string,
    published: string,
    publishedLA?: string,
    actor: Actor,
    target: Target,
    generator: Generator,
    provider: Provider,
    verb: verb,
    sequenceNumber?: integer
    object: any
}

export interface PackageInfo {
    name: string
    buildMillis: integer
    version: string
}

export interface DeviceInfo {
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

export interface Resource {
    metadata: Metadata,
    content?: any
}

export interface ErrorLogAction extends LogAction {
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
