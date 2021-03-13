/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React, { useEffect, useState } from 'react';

import Button from './Button';
import ContextMenuWrapper from './ContextMenuWrapper';
import FileView from './FileView';

const FileActions = ({
  file,
  aespassword,
  setFullscreenComponent,
  showAlert,
  updateFile,
  getConextMenuOptions,
}) => {
  const {
    fileid,
    locationref,
    storageservice,
    filename,
    mimetype,
    encryptedPath,
    decryptedPath,
  } = file;
  const [download] = useState({ percentage: null });
  const [, setRerenderTimestamp] = useState(null);

  const rerender = () => setRerenderTimestamp(Date.now());

  useEffect(() => {
    const channel = `download${fileid}`;
    const downloadListener = (_event, { percentage, isInitial }) => {
      if (isInitial || percentage > download.percentage) {
        download.percentage = percentage;
        if (percentage !== 100) {
          rerender();
        } else {
          // If the file is small, the component must have been re-rendering very rapidly.
          // Give it a little break to ensure the final render happens properly.
          setTimeout(() => {
            rerender();
          }, 100);
        }
      }
    };
    ipcRenderer.on(channel, downloadListener);
    return () => {
      ipcRenderer.removeListener(channel, downloadListener);
    };
  });

  const openInApp = () => {
    const onDetectMimetype = (detected: string) => {
      if (!mimetype) {
        updateFile(fileid, { mimetype: detected });
      }
    };

    const contextMenuOptions = getConextMenuOptions(file);

    setFullscreenComponent({
      title: (
        <ContextMenuWrapper
          id="fileview-title"
          component={<span>{filename}</span>}
          options={contextMenuOptions}
        />
      ),
      body: (
        <FileView
          encryptedPath={encryptedPath}
          decryptedPath={decryptedPath}
          aespassword={aespassword}
          onDetectMimetype={onDetectMimetype}
          contextMenuOptions={contextMenuOptions}
        />
      ),
    });
  };

  let actionButton = null;
  if (existsSync(encryptedPath)) {
    actionButton = <Button onClick={openInApp}>Open</Button>;
  } else if (download.percentage !== null) {
    actionButton = <Button disabled>{download.percentage}%</Button>;
  } else if (storageservice && storageservice !== 'None' && locationref) {
    actionButton = (
      <Button
        onClick={() => {
          if (fileid.length <= 128) {
            ipcRenderer.invoke('download', file);
          } else {
            showAlert('fileid too long');
          }
        }}
      >
        DL
      </Button>
    );
  }

  return <div className="fileactions">{actionButton}</div>;
};

export default FileActions;
