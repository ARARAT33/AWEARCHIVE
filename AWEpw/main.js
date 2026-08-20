const { app, BrowserWindow, BrowserView, ipcMain, session, shell } = require('electron');
const path = require('path');

let win;
const tabs = new Map();
let activeId = 0;
let nextId = 1;
const DEFAULT_URL = 'https://www.google.com/';

function normalUrl(value) {
  const v = String(value || '').trim();
  if (!v) return DEFAULT_URL;
  try { return new URL(v).toString(); } catch {}
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return `https://${v}`;
  return `https://www.google.com/search?q=${encodeURIComponent(v)}`;
}

function createTab(url = DEFAULT_URL) {
  const id = nextId++;
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });
  const ses = session.fromPartition('persist:awepw');
  view.webContents.session = ses;
  // Keep Chromium's normal UA. Do not spoof a site-specific identity.
  view.webContents.setWindowOpenHandler(({ url: target }) => {
    createTab(target);
    return { action: 'deny' };
  });
  view.webContents.on('page-title-updated', () => sendState());
  view.webContents.on('did-navigate', () => sendState());
  view.webContents.on('did-navigate-in-page', () => sendState());
  view.webContents.on('did-start-loading', () => sendState());
  view.webContents.on('did-stop-loading', () => sendState());
  view.webContents.on('will-download', (_e, item) => {
    item.setSaveDialogOptions({});
  });
  view.webContents.on('render-process-gone', () => sendState());
  tabs.set(id, view);
  activateTab(id);
  view.webContents.loadURL(normalUrl(url));
  return id;
}

function activateTab(id) {
  if (!tabs.has(id)) return;
  if (win.getBrowserView()) win.removeBrowserView(win.getBrowserView());
  activeId = id;
  const view = tabs.get(id);
  win.setBrowserView(view);
  resizeView();
  sendState();
}

function closeTab(id) {
  const view = tabs.get(id);
  if (!view) return;
  tabs.delete(id);
  view.webContents.destroy();
  if (!tabs.size) createTab();
  else if (activeId === id) activateTab([...tabs.keys()][tabs.size - 1]);
  else sendState();
}

function resizeView() {
  if (!win || !tabs.has(activeId)) return;
  const view = tabs.get(activeId);
  const [w, h] = win.getContentSize();
  view.setBounds({ x: 0, y: 76, width: w, height: Math.max(0, h - 76) });
  view.setAutoResize({ width: true, height: true });
}

function state() {
  const list = [...tabs.entries()].map(([id, view]) => ({
    id,
    title: view.webContents.getTitle() || 'New tab',
    url: view.webContents.getURL() || '',
    loading: view.webContents.isLoading(),
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward()
  }));
  return { activeId, tabs: list };
}

function sendState() {
  if (win && !win.isDestroyed()) win.webContents.send('awepw:state', state());
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'AWEpw Browser',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  win.loadFile('chrome.html');
  win.on('resize', resizeView);
  win.on('closed', () => { win = null; });
  createTab();
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    // Explicitly allow only common browser permissions after a page request.
    callback(['notifications', 'fullscreen'].includes(permission));
  });
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('awepw:new-tab', (_e, url) => createTab(url));
ipcMain.handle('awepw:activate', (_e, id) => activateTab(Number(id)));
ipcMain.handle('awepw:close', (_e, id) => closeTab(Number(id)));
ipcMain.handle('awepw:navigate', (_e, url) => tabs.get(activeId)?.webContents.loadURL(normalUrl(url)));
ipcMain.handle('awepw:back', () => tabs.get(activeId)?.webContents.goBack());
ipcMain.handle('awepw:forward', () => tabs.get(activeId)?.webContents.goForward());
ipcMain.handle('awepw:reload', () => tabs.get(activeId)?.webContents.reload());
ipcMain.handle('awepw:devtools', () => tabs.get(activeId)?.webContents.openDevTools({ mode: 'detach' }));
ipcMain.handle('awepw:external', (_e, url) => shell.openExternal(normalUrl(url)));
