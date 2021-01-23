/* eslint-disable no-console */
import { ipcMain } from 'electron';
import { createReadStream, createWriteStream } from 'fs';
import { decryptAes256Cbc } from './utils/cryptoUtils';

export const handleDownload = (mainWindow, library, gdriveClient) => {
  ipcMain.removeHandler('download');
  ipcMain.handle(
    'download',
    async (_event, { fileid, storageservice, locationref, size }) => {
      console.log(`Download event received: ${fileid}`);
      const localPath = library.getEncryptedPath(fileid);
      switch (storageservice) {
        case 'gdrive': {
          mainWindow?.webContents.send('downloadProgress', {
            fileid,
            percentage: 0,
            isInitial: true,
          });
          console.log(`Download started: ${fileid}`);
          const callback = ({ downloadedBytes }) => {
            const percentage = Math.floor((downloadedBytes * 100) / size);
            mainWindow?.webContents.send('downloadProgress', {
              fileid,
              percentage,
            });
            if (percentage === 100) {
              console.log(`Download finished: ${fileid}`);
            }
          };

          gdriveClient.downloadFileAsync(locationref, localPath, callback);
          break;
        }
        default: {
          throw new Error(`Unsupported storageservice: ${storageservice}`);
        }
      }
    }
  );
};

export const handleDecrypt = () => {
  ipcMain.removeHandler('decrypt');
  ipcMain.handle(
    'decrypt',
    async (_event, { encryptedPath, decryptedPath, aespassword }) => {
      const streamIn = createReadStream(encryptedPath);
      const streamOut = createWriteStream(decryptedPath);
      return decryptAes256Cbc(streamIn, streamOut, aespassword).then(() => {
        streamIn.close();
        streamOut.close();
        return null;
      });
    }
  );
};
