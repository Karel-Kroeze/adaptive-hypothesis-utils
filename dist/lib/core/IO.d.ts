import { LogAction } from '../types/LogAction';
export declare function checkOutputDir(location: string, create?: boolean, file?: boolean): void;
export declare function Write(dir: string | false, name: string, data: any, ext?: "json" | "csv", prefix?: string, largeFile?: boolean): Promise<any>;
export declare function ReadJsonArray(file: string): Promise<any>;
export declare function filename(dir: string | false, name: string, ext: "json" | "csv", prefix?: string): string;
export declare function PromiseMkdirp(dir: string): Promise<string>;
export declare function Fetch(provider_id: string, tries?: number, maxTries?: number, returnType?: "file" | "preFile"): Promise<LogAction[]>;
