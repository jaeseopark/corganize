/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React from 'react';
import { copyTextToClipboard } from '../utils/clipboardUtils';

import {
  getExtnameWithoutDotOrDefault,
  isSupportedInAppFileType,
} from '../utils/fileUtils';
import Button from './Button';
import FileViewModal from './FileViewModal';

const LOCAL_FILE_STATUS = {
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  DECRYPTING: 'decrypting',
  DECRYPTED: 'decrypted',
};

const FileActions = ({
  file,
  isClipboarded,
  encryptedPath,
  defaultExtname,
  updateLocalFileStatus,
  setClipboardedFileId,
  setFileViewModal,
  localFileStatus,
  aespassword,
}) => {
  const { fileid, sourceurl, filename, locationref } = file;
  const ext = getExtnameWithoutDotOrDefault(filename, defaultExtname);
  const decryptedPath = `${encryptedPath}.${ext}`;

  const openInApp = () => {
    if (!isSupportedInAppFileType(ext)) {
      throw new Error(`Unsupported ext: ${ext}`);
    }

    setFileViewModal(
      <FileViewModal
        file={file}
        ext={ext}
        onClose={() => setFileViewModal(null)}
        encryptedPath={encryptedPath}
        decryptedPath={decryptedPath}
        mediamStream={null}
      />
    );
  };

  const onOpenInApp = async () => {
    if (
      existsSync(decryptedPath) ||
      localFileStatus === LOCAL_FILE_STATUS.DECRYPTED
    ) {
      openInApp();
    } else if (localFileStatus === LOCAL_FILE_STATUS.DOWNLOADED) {
      updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTING);
      ipcRenderer
        .invoke('decrypt', { encryptedPath, decryptedPath, aespassword })
        .then(() => {
          updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTED);
        })
        .then(openInApp)
        .catch((error) => {
          alert(error);
          updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DOWNLOADED);
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
    <div className="fileactions">
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

export default FileActions;
