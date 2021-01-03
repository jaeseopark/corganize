/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { createWriteStream, createReadStream, existsSync } from 'fs';
import React from 'react';
import { copyTextToClipboard } from '../utils/clipboardUtils';

import { decryptAes256Cbc } from '../utils/cryptoUtils';
import {
  getExtnameWithoutDot,
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
  aespassword,
}) => {
  const { fileid, sourceurl, filename, locationref } = file;
  const ext = getExtnameWithoutDot(filename, defaultExtname);

  const openInApp = () => {
    if (isSupportedInAppFileType(ext)) {
      return fileid;
    }
    throw new Error('Unsupported file type');
  };

  const onOpenInApp = async () => {
    const decryptedPath = `${encryptedPath}.${ext}`;
    if (
      existsSync(decryptedPath) ||
      localFileStatus === LOCAL_FILE_STATUS.DECRYPTED
    ) {
      openInApp();
    } else if (localFileStatus === LOCAL_FILE_STATUS.DOWNLOADED) {
      const streamIn = createReadStream(encryptedPath);
      const streamOut = createWriteStream(decryptedPath); // TODO: replace with a buffer

      updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTING);
      // eslint-disable-next-line promise/catch-or-return
      decryptAes256Cbc(streamIn, streamOut, aespassword)
        // eslint-disable-next-line promise/always-return
        .then(() => {
          updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTED);
        })
        .then(openInApp)
        .catch((error) => {
          alert(error);
          updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DOWNLOADED);
        })
        .finally(() => {
          streamIn.close();
          streamOut.close();
        });
    }
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
        actionButton = <Button disabled>Decrypting...</Button>;
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
