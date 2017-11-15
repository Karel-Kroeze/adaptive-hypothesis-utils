export enum LogType {
    // hypotheses
    hypothesesUpdate,
    hypothesesChange,
    hypothesesFeedback,

    // entry tool, conclusion + expectation
    expectationChange,
    expectationUpdate,
    conclusionChange,
    conclusionUpdate,

    // experiment design tool
    experimentUpdate,
    experimentChange,

    remove,
    other
}