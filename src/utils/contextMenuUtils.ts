import os from 'os';
import { exec } from 'child_process';
import { existsSync, unlink } from 'fs';
import { copyTextToClipboard } from './clipboardUtils';

export const getLocalActions = (
  { fileid },
  library,
  rerenderRowData,
  showAlert
) => {
  const localActions = [];

  const encryptedPath = library.getEncryptedPath(fileid);
  if (existsSync(encryptedPath)) {
    localActions.push({
      label: 'Reveal',
      onClick: () => {
        switch (os.platform()) {
          case 'win32':
            exec(`explorer /select,"${encryptedPath}"`);
            break;
          default:
            throw new Error('Not Implemented');
        }
      },
    });
    localActions.push({
      label: 'Delete Local File',
      onClick: () =>
        unlink(encryptedPath, (error) => {
          if (error) {
            showAlert('The file could not be deleted');
            return;
          }
          rerenderRowData();
          showAlert('The local file has been deleted');
        }),
    });
  }

  if (localActions.length > 0) localActions.push(null);
  return localActions;
};

export const getRemoteActions = (
  { fileid, sourceurl, storageservice },
  updateFile,
  rerenderRowData,
  showAlert
) => {
  const remoetActions = [];
  if (sourceurl)
    remoetActions.push({
      label: 'Copy Source URL',
      onClick: () =>
        copyTextToClipboard(sourceurl)
          .then(rerenderRowData)
          .then(showAlert('Copied to clipboard')),
    });
  if (storageservice !== 'None')
    remoetActions.push({
      label: 'Delete Remote File',
      onClick: () => updateFile(fileid, { storageservice: 'None' }),
    });
  if (remoetActions.length > 0) remoetActions.push(null);
  return remoetActions;
};
