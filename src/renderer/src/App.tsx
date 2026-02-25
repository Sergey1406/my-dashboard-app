import { useEffect, useState } from 'react'
import {
    ResponsiveContainer, AreaChart, Area
} from 'recharts'

declare global {
    interface Window {
        electronAPI: {
            onStats: (callback: (data: any) => void) => () => void;
            minimize: () => void;
            close: () => void;
        }
    }
}

interface ProcessInfo {
    name: string;
    mem: number;
    memUsage: string;
}


interface ChartData {
    time: string;
    cpu: number;
    ram: number;
    cpuTemp?: number;
    cpuModel?: string;
    ramType?: string;
    ramClock?: string;
    usedMem?: string;
    totalMem?: string;
    processes?: ProcessInfo[];
}


const getStatusColor = (value: number) => {
    if (value > 90) return '#ef4444';
    if (value > 70) return '#f59e0b';
    return '#10b981';
};

function App() {
    const [data, setData] = useState<ChartData[]>([]);

    const current = data.length > 0 ? data[data.length - 1] : {
        time: '',
        cpu: 0,
        ram: 0,
        cpuTemp: 0,
        usedMem: '0',
        totalMem: '0',
        cpuModel: '',
        ramType: '',
        ramClock: '',
        processes: []
    };


    useEffect(() => {
        const unsubscribe = window.electronAPI.onStats((stats) => {
            console.log('React получил:', stats)
            setData((prev) => {
                const timestamp = new Date().toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });


                const newDataPoint = {
                    time: timestamp,
                    ...stats
                };

                return [...prev, newDataPoint].slice(-30);
            });
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);
    return (
        <div style={styles.container}>
            <div style={styles.dragRegion}>
                <span style={styles.dragTitle}>SYSTEM MONITOR</span>
                <div style={{ WebkitAppRegion: 'no-drag', display: 'flex', gap: '8px' }}>
                    <button
                        style={styles.controlButton}
                        onClick={() => window.electronAPI.minimize()}
                    >
                        ─
                    </button>
                    <button
                        style={{...styles.controlButton, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)'}}
                        onClick={() => window.electronAPI.close()}
                    >
                        ✕
                    </button>
                </div>
            </div>

            <header style={styles.header}>
                <h1 style={styles.title}>Dashboard</h1>
                <div style={styles.statusGroup}>
                    <div style={styles.statusBadge} />
                    <span style={styles.statusText}>Live System Feed</span>
                </div>
            </header>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.label}>CPU LOAD</span>
                        {current.cpuModel && <span style={styles.badge}>{current.cpuModel}</span>}
                    </div>
                    <div style={{ ...styles.value, color: getStatusColor(current.cpu) }}>
                        {current.cpu}<span style={styles.unit}>%</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Temperature</span>
                        <span style={{
                            ...styles.infoValue,
                            color: (current.cpuTemp || 0) > 70 ? '#ef4444' : '#f4f4f5'
                        }}>
                        {current.cpuTemp && current.cpuTemp > 0 ? `${current.cpuTemp}°C` : 'N/A'}
                    </span>
                    </div>
                    <div style={styles.miniGraph}>
                        <ResponsiveContainer width="100%" height={60}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={getStatusColor(current.cpu)} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={getStatusColor(current.cpu)} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="cpu"
                                    stroke={getStatusColor(current.cpu)}
                                    fill="url(#cpuGrad)"
                                    strokeWidth={2}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>


                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.label}>RAM USAGE</span>
                        {current.ramType && <span style={styles.badge}>{current.ramType}</span>}
                    </div>
                    <div style={{ ...styles.value, color: getStatusColor(current.ram) }}>
                        {current.ram}<span style={styles.unit}>%</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Memory Used</span>
                        <span style={styles.infoValue}>{current.usedMem || '0'} / {current.totalMem || '0'} GB</span>
                    </div>
                    <div style={styles.miniGraph}>
                        <ResponsiveContainer width="100%" height={60}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={getStatusColor(current.ram)} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={getStatusColor(current.ram)} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="ram"
                                    stroke={getStatusColor(current.ram)}
                                    fill="url(#ramGrad)"
                                    strokeWidth={2}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={styles.processContainer}>
                <div style={styles.processHeader}>
                    <h3 style={styles.chartTitle}>Top Memory Consumers</h3>
                    <span style={styles.processCount}>{current.processes?.length || 0} active</span>
                </div>

                <div style={styles.processList}>
                    {current.processes && current.processes.length > 0 ? (
                        current.processes.map((proc, idx) => (
                            <div key={idx} style={styles.processItem}>
                                <div style={styles.procIcon}>
                                    {proc.name.charAt(0).toUpperCase()}
                                </div>

                                <div style={styles.procMainInfo}>
                                    <div style={styles.procNameRow}>
                                        <span style={styles.procName}>{proc.name}</span>
                                        <span style={styles.procValueText}>{proc.memUsage} MB</span>
                                    </div>

                                    <div style={styles.procBarWrapper}>
                                        <div style={{
                                            ...styles.procBarFill,
                                            width: `${Math.min(proc.mem * 10, 100)}%`,
                                            background: `linear-gradient(90deg, #3b82f6 0%, ${getStatusColor(proc.mem * 10)} 100%)`
                                        }} />
                                    </div>
                                </div>

                                <div style={styles.procPercentBadge}>
                                    {proc.mem}%
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.loadingText}>Gathering process intelligence...</div>
                    )}
                </div>
            </div>
        </div>
    );

}

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '30px',
        background: '#0a0a0a',
        color: '#f4f4f5',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '700',
        letterSpacing: '-0.5px',
        margin: 0,
    },
    statusBadge: {
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px',
    },
    card: {
        background: '#141414',
        border: '1px solid #262626',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
    },
    label: {
        color: '#71717a',
        fontSize: '14px',
        fontWeight: '500',
    },
    value: {
        fontSize: '38px',
        fontWeight: '800',
        margin: '10px 0',
        transition: 'color 0.3s ease',
    },
    miniGraph: {
        marginTop: 'auto',
    },
    mainChartContainer: {
        background: '#141414',
        border: '1px solid #262626',
        borderRadius: '16px',
        padding: '20px',
    },
    chartTitle: {
        fontSize: '16px',
        marginBottom: '20px',
        color: '#a1a1aa',
    },

    processContainer: {
            background: 'rgba(23, 23, 23, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            padding: '24px',
            marginTop: '24px',
        },
    processHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
        },
    processCount: {
            fontSize: '11px',
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: '#1a1a1a',
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px solid #262626',
        },
    processList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
        },
    processItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '8px',
            borderRadius: '12px',
            transition: 'background 0.2s ease',
            cursor: 'default',
        },
    procIcon: {
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)',
            border: '1px solid #3f3f46',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#3b82f6',
        },
    procMainInfo: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
    procNameRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
        },
    procName: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#f4f4f5',
            maxWidth: '150px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
    procValueText: {
            fontSize: '12px',
            color: '#71717a',
            fontFamily: 'JetBrains Mono, monospace',
        },
    procBarWrapper: {
            height: '4px', // Делаем полоску тоньше и элегантнее
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '2px',
            overflow: 'hidden',
        },
    procBarFill: {
            height: '100%',
            borderRadius: '2px',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        },
    procPercentBadge: {
            fontSize: '11px',
            fontWeight: '600',
            color: '#a1a1aa',
            background: '#18181b',
            padding: '4px 8px',
            borderRadius: '6px',
            minWidth: '35px',
            textAlign: 'center',
        },
    loadingText: {
            textAlign: 'center',
            color: '#52525b',
            fontSize: '13px',
            padding: '20px',
        },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '10px',
    },
    badge: {
        fontSize: '10px',
        color: '#71717a',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '2px 8px',
        borderRadius: '4px',
    }

}

export default App;
