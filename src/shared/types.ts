export interface RamStatus {
    total: number;
    free: number;
    used: number;
    percentage: number;
}

export interface SystemInfoApi {
    getRamStatus: () => Promise<RamStatus>;
    onRamUpdate: (callback: (data: RamStatus) => void) => () => void;
}