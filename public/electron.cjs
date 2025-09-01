const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const os = require('os');

// Disable certificate validation for Riot API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    frame: true,
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true // Hide menu bar but allow access with Alt
  });

  // Set application menu to null for clean look
  Menu.setApplicationMenu(null);

  // Load the built React app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load from built files
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (process.platform === 'darwin') {
      app.dock.show();
    }
    mainWindow.focus();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
};

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC Handlers for Riot API
ipcMain.handle('fetch-tokens', async () => {
  try {
    const lockfilePath = path.join(
      os.homedir(),
      'AppData',
      'Local',
      'Riot Games',
      'Riot Client',
      'Config',
      'lockfile'
    );
    
    if (!fs.existsSync(lockfilePath)) {
      throw new Error('Riot Client lockfile not found. Please make sure Valorant is running.');
    }
    
    const lockfileContent = fs.readFileSync(lockfilePath, 'utf8');
    const [name, pid, port, password, protocol] = lockfileContent.split(':');
    
    const auth = Buffer.from(`riot:${password}`).toString('base64');
    const baseUrl = `${protocol}://127.0.0.1:${port}`;
    
    return new Promise((resolve, reject) => {
      const req = https.request(`${baseUrl}/entitlements/v1/token`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        rejectUnauthorized: false,
        timeout: 10000
      }, (res) => {
        let data = '';
  
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const tokens = JSON.parse(data);
            const puuid = JSON.parse(Buffer.from(tokens.accessToken.split('.')[1] + '===', 'base64')).sub;
            resolve({
              authToken: tokens.accessToken,
              entToken: tokens.token,
              puuid
            });
          } catch (error) {
            reject(new Error('Failed to parse token response'));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`Failed to connect to Riot Client: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request to Riot Client timed out'));
      });
      
      req.end();
    });
  } catch (error) {
    throw new Error(`Failed to fetch tokens: ${error.message}`);
  }
});

ipcMain.handle('make-request', async (event, { url, headers, method = 'GET', body = null }) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        ...headers,
        'Accept': 'application/json'
      },
      rejectUnauthorized: false,
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (!data) {
          return resolve({
            status: res.statusCode,
            data: null,
            headers: res.headers
          });
        }

        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers,
              isRaw: true
            });
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${data}`));
          }
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle app updates and auto-updater (for future implementation)
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('app-quit', () => {
  app.quit();
});

// Set app user model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.valradiant.app');
}