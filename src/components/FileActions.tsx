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
import DownloadProgressBar from './DownloadProgressBar';
import FileViewModal from './FileViewModal';

const LOCAL_FILE_STATUS = {
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
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
  const { fileid, sourceurl, filename, locationref, size } = file;
  const ext = getExtnameWithoutDotOrDefault(filename, defaultExtname);

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
        aespassword={aespassword}
      />
    );
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
    actionButton = <DownloadProgressBar fileid={fileid} size={size} />;
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
