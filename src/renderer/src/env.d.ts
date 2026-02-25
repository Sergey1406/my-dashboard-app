export interface SystemStats {
    cpu: number;
    ram: number;
}

declare global {
    interface Window {
        electronAPI: {
            onStats: (callback: (stats: SystemStats) => void) => () => void;
        }
    }
}