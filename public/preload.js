const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchTokens: () => ipcRenderer.invoke('fetch-tokens'),
  makeRequest: (options) => ipcRenderer.invoke('make-request', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  appQuit: () => ipcRenderer.invoke('app-quit')
});