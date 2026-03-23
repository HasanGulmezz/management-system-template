const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

// Vercel'de yayınlanan web sitesinin URL'i
const APP_URL = 'http://localhost:5173/'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Yönetim Sistemi',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    // Modern görünüm
    titleBarStyle: 'default',
    backgroundColor: '#0f1729',
    show: false // Yüklenene kadar gösterme
  })

  // Web sitesini yükle
  mainWindow.loadURL(APP_URL)

  // Yüklendiğinde göster (beyaz ekran önleme)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Harici linkleri tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  // DevTools'u kapat (production için)
  // mainWindow.webContents.openDevTools()

  // Menü oluştur
  const menu = Menu.buildFromTemplate([
    {
      label: 'Yönetim Sistemi',
      submenu: [
        { 
          label: 'Yenile', 
          accelerator: 'CmdOrCtrl+R', 
          click: () => mainWindow.reload() 
        },
        { type: 'separator' },
        { 
          label: 'Çıkış', 
          accelerator: 'CmdOrCtrl+Q', 
          click: () => app.quit() 
        }
      ]
    },
    {
      label: 'Düzen',
      submenu: [
        { label: 'Geri Al', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Yinele', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Kes', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopyala', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Yapıştır', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Yakınlaştır', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Uzaklaştır', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Sıfırla', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tam Ekran', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
}

// Uygulama hazır olduğunda pencere oluştur
app.whenReady().then(() => {
  createWindow()

  // macOS: Dock'a tıklandığında pencere yoksa oluştur
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Tüm pencereler kapandığında uygulamayı kapat (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Güvenlik: HTTP isteklerini engelle
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL) && !url.startsWith('https://')) {
      event.preventDefault()
    }
  })
})
