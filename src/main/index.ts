import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { MonitoringService } from './services/RamService'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

function createTray() {
    const icon = nativeImage.createEmpty()
    tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ])

    tray.setToolTip('System Monitor')
    tray.setContextMenu(contextMenu)
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        backgroundColor: '#0a0a0a',
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false
        }
    })

    const monitor = new MonitoringService(mainWindow)

    ipcMain.on('window-minimize', () => {
        if (mainWindow) mainWindow.minimize()
    })

    ipcMain.on('window-close', () => {
        if (mainWindow) {
            mainWindow.close();
            app.quit();

        }
    })


    mainWindow.on('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show()
            monitor.start()
        }
    })

    mainWindow.on('closed', () => {
        monitor.stop()
        ipcMain.removeAllListeners('window-minimize')
        ipcMain.removeAllListeners('window-close')
        mainWindow = null
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    createWindow()
    createTray()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
