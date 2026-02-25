import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    onStats: (callback) => {
        const subscription = (_event, value) => callback(value)
        ipcRenderer.on('sys-stats', subscription)
        return () => {
            ipcRenderer.removeListener('sys-stats', subscription)
        }
    },

    close: () => ipcRenderer.send('window-close'),
    minimize: () => ipcRenderer.send('window-minimize')
})