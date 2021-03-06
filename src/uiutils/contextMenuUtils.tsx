import React from 'react';
import os from 'os';
import { exec } from 'child_process';
import { unlink } from 'fs';
import { copyTextToClipboard } from './clipboardUtils';
import { File } from '../entity/File';
import { ContextMenuOption } from '../entity/props';

export const getLocalActions = (
  { encryptedPath }: File,
  rerenderRowData: Function,
  showAlert: Function,
  localFiles: string[]
): ContextMenuOption[] => {
  const localActions: ContextMenuOption[] = [];

  if (localFiles.includes(encryptedPath)) {
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
      label: 'Delete Local File (E)',
      onClick: () =>
        unlink(encryptedPath, (error) => {
          if (error) {
            showAlert('The file could not be deleted');
            return;
          }
          const iToDelete = localFiles.indexOf(encryptedPath);
          localFiles.splice(iToDelete, 1);
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
  file: File,
  updateFile: (f: File) => Promise<File>,
  rerenderRowData: Function,
  showAlert: Function,
  openScrapePanel: Function
): ContextMenuOption[] => {
  const { sourceurl, storageservice } = file;
  const remoetActions: ContextMenuOption[] = [];
  if (sourceurl) {
    const sanitizedSourceurl = `https://${sourceurl
      .split('://')
      .slice(-1)
      .pop()}`;
    remoetActions.push(
      {
        label: 'Copy Source URL',
        onClick: () =>
          copyTextToClipboard(sanitizedSourceurl)
            .then(rerenderRowData)
            .then(showAlert('Copied to clipboard')),
      },
      {
        label: 'Scrape (S)',
        onClick: () => {
          openScrapePanel(sanitizedSourceurl);
        },
        hotkey: 's',
      }
    );
  }
  if (storageservice !== 'None')
    remoetActions.push({
      label: 'Delete Remote File',
      onClick: () => updateFile({ ...file, storageservice: 'None' }),
    });
  if (remoetActions.length > 0) remoetActions.push(null);
  return remoetActions;
};

export const getCommonActions = (
  file: File,
  setFullscreenComponent: Function,
  toggleFav: Function,
  deleteFile: Function
): ContextMenuOption[] => {
  return [
    {
      label: 'Toggle Favourite (W)',
      onClick: () => toggleFav(file),
      hotkey: 'w',
    },
    {
      label: 'Show Metadata (I)',
      onClick: () => {
        setFullscreenComponent({
          title: file.filename,
          body: <pre>{JSON.stringify(file, null, 2)}</pre>,
        });
      },
      hotkey: 'i',
    },
    {
      label: 'Delete',
      onClick: () => deleteFile(file.fileid),
    },
  ];
};
