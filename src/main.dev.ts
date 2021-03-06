/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { existsSync } from 'fs';
import MenuBuilder from './menu';
import GdriveClient from './client/gdrive';
import Library from './entity/Library';
import { removeTmpFiles } from './utils/fsUtils';
import { handleDownload, handleUpload } from './main.dev.handlers';

const DEFAULT_WINDOW_SIZE = { width: 1150, height: 670 };

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let secondaryWindow: BrowserWindow | null = null;

let library: Library | null = null;
let gdriveClient: GdriveClient | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const appQuitWrapper = () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
};

const openExternal = (url: string) => {
  if (!secondaryWindow || secondaryWindow.isDestroyed())
    secondaryWindow = new BrowserWindow({
      ...DEFAULT_WINDOW_SIZE,
      show: false,
    });

  secondaryWindow.loadURL(url);
  secondaryWindow.show();
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(__dirname, '../resources');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    ...DEFAULT_WINDOW_SIZE,
    show: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  const tmpPath = library?.getTmpPath();
  if (!library || !existsSync(tmpPath)) {
    appQuitWrapper();
    return;
  }

  removeTmpFiles(tmpPath)
    .then((results) => results.forEach((result) => console.log(result)))
    .catch(console.log)
    .finally(appQuitWrapper);
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on('changeLibraryConfig', (_event, libraryConfig) => {
  library = new Library(libraryConfig);
  gdriveClient = new GdriveClient(library.config.storageservice.gdrive);

  handleDownload(mainWindow, library, gdriveClient);
  handleUpload(gdriveClient);
});

ipcMain.handle('openUrl', (_event, url: string) => openExternal(url));

ipcMain.handle(
  'getUrl',
  async () =>
    new Promise((resolve) => {
      if (secondaryWindow && !secondaryWindow.isDestroyed()) {
        resolve(secondaryWindow.webContents.getURL());
      }
      resolve(null);
    })
);

ipcMain.handle('openAnyFile', () => {
  const properties = ['openFile', 'multiSelections'];
  return dialog
    .showOpenDialog({ properties })
    .then((result) => !result.canceled && result.filePaths);
});
