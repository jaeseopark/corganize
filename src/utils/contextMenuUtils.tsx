import React from 'react';
import os from 'os';
import { exec } from 'child_process';
import { existsSync, unlink } from 'fs';
import { copyTextToClipboard } from './clipboardUtils';
import { File } from '../entity/File';
import { ContextMenuOption } from '../entity/props';

export const getLocalActions = (
  { encryptedPath }: File,
  rerenderRowData,
  showAlert
): ContextMenuOption[] => {
  const localActions: ContextMenuOption[] = [];

  if (existsSync(encryptedPath)) {
    localActions.push({
      label: 'Reveal (R)',
      onClick: () => {
        switch (os.platform()) {
          case 'win32':
            exec(`explorer /select,"${encryptedPath}"`);
            break;
          default:
            throw new Error('Not Implemented');
        }
      },
      hotkey: 'r',
    });
    localActions.push({
      label: 'Delete Local File (E)',
      onClick: () =>
        unlink(encryptedPath, (error) => {
          if (error) {
            showAlert('The file could not be deleted');
            return;
          }
          rerenderRowData();
          showAlert('The local file has been deleted');
        }),
      hotkey: 'e',
    });
  }

  if (localActions.length > 0) localActions.push(null);
  return localActions;
};

export const getRemoteActions = (
  { fileid, sourceurl, storageservice }: File,
  updateFile,
  rerenderRowData,
  showAlert
): ContextMenuOption[] => {
  const remoetActions: ContextMenuOption[] = [];
  if (sourceurl)
    remoetActions.push({
      label: 'Copy Source URL',
      onClick: () =>
        copyTextToClipboard(sourceurl.split('://').slice(-1).pop())
          .then(rerenderRowData)
          .then(showAlert('Copied to clipboard')),
    });
  if (storageservice !== 'None')
    remoetActions.push({
      label: 'Delete Remote File (D)',
      onClick: () => updateFile(fileid, { storageservice: 'None' }),
      hotkey: 'd',
    });
  if (remoetActions.length > 0) remoetActions.push(null);
  return remoetActions;
};

export const getCommonActions = (
  file: File,
  setFullscreenComponent,
  toggleFav,
  deleteFile
): ContextMenuOption[] => {
  return [
    {
      label: 'Toggle Favourite (A)',
      onClick: () => toggleFav(file),
      hotkey: 'a',
    },
    {
      label: 'Show Metadata',
      onClick: () => {
        setFullscreenComponent({
          title: file.filename,
          body: <pre>{JSON.stringify(file, null, 2)}</pre>,
        });
      },
    },
    {
      label: 'Delete',
      onClick: () => deleteFile(file.fileid),
    },
  ];
};
