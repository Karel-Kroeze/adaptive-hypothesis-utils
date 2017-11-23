export declare function updateDataConfig(name: string, condition: string, provider: string, path: string, source?: dataSource, config?: DataConfig): DataConfig;
export declare function updateDataConfig(name: string, condition: string, providers: string[], paths: string[], source?: dataSource, config?: DataConfig): DataConfig;
export declare function getDataConfig(path?: string): DataConfig;
export interface DataConfig {
    [name: string]: DataConfig_Experiment;
}
export interface DataConfig_Experiment {
    [name: string]: DataConfig_Condition;
}
export interface DataConfig_Condition {
    providers: string[];
    data: {
        [providerId: string]: DataConfig_Files;
    };
}
export declare type dataSource = "la" | "raw";
export interface DataConfig_Files {
    raw: string;
    source: dataSource;
    users?: string;
    expectations?: string;
    hypotheses?: string;
    experiments?: string;
    conclusions?: string;
    [key: string]: string | undefined;
}
