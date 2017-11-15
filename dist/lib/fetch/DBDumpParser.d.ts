import { LogAction } from "../types/LogAction";
export declare function ParseDBDump(file: string, arrayify?: boolean, sort?: boolean): Promise<LogAction[]>;
