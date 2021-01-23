/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React from 'react';

import Button from './Button';
import DownloadProgressBar from './DownloadProgressBar';
import FileView from './FileView';

const LOCAL_FILE_STATUS = {
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
};

const FileActions = ({
  file,
  encryptedPath,
  updateLocalFileStatus,
  setFullscreenComponent,
  updateFile,
  localFileStatus,
  aespassword,
}) => {
  const { fileid, locationref, filename, mimetype } = file;

  const openInApp = () => {
    const onDetectMimetype = (detected: string) => {
      if (!mimetype) {
        updateFile(fileid, { mimetype: detected });
      }
    };

    setFullscreenComponent({
      title: filename,
      body: (
        <FileView
          encryptedPath={encryptedPath}
          aespassword={aespassword}
          onDetectMimetype={onDetectMimetype}
        />
      ),
    });
  };

  function downloadViaIpc() {
    updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DOWNLOADING);
    ipcRenderer
      .invoke('download', file)
      // eslint-disable-next-line promise/always-return
      .then(() => {
        updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DOWNLOADED);
      })
      .catch((error) => {
        // eslint-disable-next-line no-alert
        alert(error);
        updateLocalFileStatus(fileid, null);
      });
  }

  let actionButton = null;
  if (localFileStatus === LOCAL_FILE_STATUS.DOWNLOADING) {
    actionButton = <DownloadProgressBar fileid={fileid} />;
  } else if (existsSync(encryptedPath)) {
    actionButton = <Button onClick={openInApp}>Open</Button>;
  } else if (locationref) {
    actionButton = <Button onClick={downloadViaIpc}>Download</Button>;
  }

  return <div className="fileactions">{actionButton}</div>;
};

export default FileActions;
