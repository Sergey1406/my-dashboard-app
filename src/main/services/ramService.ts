import si from 'systeminformation'
import { BrowserWindow } from 'electron'

export class MonitoringService {
    private interval: NodeJS.Timeout | null = null;
    private window: BrowserWindow;

    constructor(window: BrowserWindow) {
        this.window = window;
    }

    private async getStaticData() {
        try {
            const cpu = await si.cpu();
            const memLayout = await si.memLayout();
            return {
                cpuModel: `${cpu.manufacturer} ${cpu.brand}`,
                ramType: memLayout[0]?.type || 'DDR',
                ramClock: memLayout[0]?.clockSpeed || ''
            };
        } catch (e) {
            console.error("Static data error:", e);
            return { cpuModel: 'Unknown CPU', ramType: 'DDR', ramClock: '' };
        }
    }

    async start() {
        const staticData = await this.getStaticData();
        console.log("Service Started. Static data loaded:", staticData.cpuModel);

        this.interval = setInterval(async () => {
            try {
                const [cpuLoad, mem, temp, procs] = await Promise.all([
                    si.currentLoad(),
                    si.mem(),
                    si.cpuTemperature(),
                    si.processes()
                ]);

                const topProcesses = (procs.list || [])
                    .sort((a, b) => b.mem - a.mem)
                    .slice(0, 5)
                    .map(p => ({
                        name: p.name,
                        mem: Number(p.mem.toFixed(1)),
                        memUsage: (p.memRss / 1024).toFixed(1)
                    }));

                const stats = {
                    cpu: Math.round(cpuLoad.currentLoad),
                    cpuTemp: Math.round(temp.main || 0),
                    ram: Math.round((mem.active / mem.total) * 100),
                    usedMem: (mem.active / 1024 / 1024 / 1024).toFixed(1),
                    totalMem: (mem.total / 1024 / 1024 / 1024).toFixed(0),
                    processes: topProcesses,
                    ...staticData
                };

                if (!this.window.isDestroyed()) {
                    this.window.webContents.send('sys-stats', stats);
                }
            } catch (e) {
                console.error('Monitoring Loop Error:', e);
            }
        }, 2000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}