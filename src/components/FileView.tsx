/* eslint-disable react/react-in-jsx-scope */
import { ipcRenderer } from 'electron';
import { createWriteStream, createReadStream, existsSync } from 'fs';
import React from 'react';
import { copyTextToClipboard } from '../utils/clipboardUtils';

import { decryptAes256Cbc } from '../utils/cryptoUtils';
import {
  getExtnameFromFile,
  isSupportedInAppFileType,
} from '../utils/fileUtils';
import Button from './Button';

const LOCAL_FILE_STATUS = {
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  DECRYPTING: 'decrypting',
  DECRYPTED: 'decrypted',
};

const FileView = ({
  file,
  isClipboarded,
  encryptedPath,
  defaultExtname,
  updateLocalFileStatus,
  setClipboardedFileId,
  localFileStatus,
}) => {
  const { fileid, sourceurl, filename, locationref } = file;

  const decrypt = (streamIn, streamOut) => {
    updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTING);
    return (
      decryptAes256Cbc(streamIn, streamOut, library.config.local.aes.password)
        // eslint-disable-next-line promise/always-return
        .then(() => {
          updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTED);
        })
    );
  };

  const onOpenInApp = () => {
    const streamIn = createReadStream(encryptedPath);
    const streamOut = createWriteStream();

    const ext = getExtnameFromFile(filename, defaultExtname);
    if (isSupportedInAppFileType(ext)) {
      // TODO open in app
      throw new Error('Not Implemented');
    }
    throw new Error('Unsupported file type');
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
    actionButton = <Button disabled>Downloading...</Button>;
  } else if (existsSync(encryptedPath)) {
    switch (localFileStatus) {
      case LOCAL_FILE_STATUS.DECRYPTING:
        actionButton = <Button disabled>Opening...</Button>;
        break;
      default:
        actionButton = <Button onClick={onOpenInApp}>Open</Button>;
        break;
    }
  } else if (locationref) {
    actionButton = <Button onClick={downloadViaIpc}>Download</Button>;
  }

  return (
    <div className="fileview">
      {sourceurl && (
        <div className="copy-to-clipboard">
          <button
            type="button"
            className={isClipboarded ? 'btn btn-success' : 'btn btn-light'}
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

export default FileView;
