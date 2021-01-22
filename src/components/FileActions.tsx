/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React from 'react';
import { copyTextToClipboard } from '../utils/clipboardUtils';

import Button from './Button';
import DownloadProgressBar from './DownloadProgressBar';
import FileView from './FileView';

const LOCAL_FILE_STATUS = {
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
};

const FileActions = ({
  file,
  isClipboarded,
  encryptedPath,
  updateLocalFileStatus,
  setClipboardedFileId,
  setFullscreenComponent,
  setMimetype,
  localFileStatus,
  aespassword,
}) => {
  const { fileid, sourceurl, locationref, filename, mimetype } = file;

  const openInApp = () => {
    const onDetectMimetype = (detected: string) => {
      if (!mimetype) {
        setMimetype(fileid, detected);
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

  return (
    <div className="fileactions">
      {sourceurl && (
        <div className="copy-to-clipboard">
          <button
            type="button"
            className={isClipboarded ? 'btn btn-success' : 'btn btn-light'}
            tabIndex="-1"
            onClick={() => {
              const copySuccess = copyTextToClipboard(sourceurl);
              if (copySuccess) {
                setClipboardedFileId(fileid);
              }
            }}
          >
            {isClipboarded ? 'Copied' : 'Copy Source URL'}
          </button>
        </div>
      )}
      {actionButton}
    </div>
  );
};

export default FileActions;
