/* eslint-disable import/prefer-default-export */
/* eslint-disable no-console */
import { ipcMain } from 'electron';
import { File } from './entity/File';

export const handleDownload = (mainWindow, library, gdriveClient) => {
  ipcMain.removeHandler('download');
  ipcMain.handle('download', async (_event, file: File) => {
    const { fileid, storageservice, locationref, size, encryptedPath } = file;
    const respond = (percentage: number, isInitial = false) => {
      const payload = { fileid, percentage, isInitial };
      mainWindow?.webContents.send('downloadProgress', payload);
      mainWindow?.webContents.send(`download${fileid}`, payload);
    };

    console.log(`Download event received: ${fileid}`);
    switch (storageservice) {
      case 'gdrive': {
        respond(0, true);
        console.log(`Download started: ${fileid}`);
        const callback = ({ downloadedBytes }) => {
          const percentage = Math.floor((downloadedBytes * 100) / size);
          respond(percentage);
          if (percentage === 100) {
            console.log(`Download finished: ${fileid}`);
          }
        };

        const downloadPath = library.getDownloadPath(fileid);
        return gdriveClient
          .downloadFileAsync(locationref, encryptedPath, downloadPath, callback)
          .then(() => respond(100))
          .catch(console.log);
      }
      default: {
        throw new Error(`Unsupported storageservice: ${storageservice}`);
      }
    }
  });
};
