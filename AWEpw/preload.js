const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('awepw', {
  state: cb => ipcRenderer.on('awepw:state', (_e, data) => cb(data)),
  newTab: url => ipcRenderer.invoke('awepw:new-tab', url),
  activate: id => ipcRenderer.invoke('awepw:activate', id),
  close: id => ipcRenderer.invoke('awepw:close', id),
  navigate: url => ipcRenderer.invoke('awepw:navigate', url),
  back: () => ipcRenderer.invoke('awepw:back'),
  forward: () => ipcRenderer.invoke('awepw:forward'),
  reload: () => ipcRenderer.invoke('awepw:reload'),
  devtools: () => ipcRenderer.invoke('awepw:devtools'),
  external: url => ipcRenderer.invoke('awepw:external', url)
});
