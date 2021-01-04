import { exec } from 'child_process';
import React from 'react';
import ReactPlayer from 'react-player';
import os from 'os';
import Button from './Button';

import './FileViewModal.scss';

const getFileManagerAppName = () => {
  switch (os.platform()) {
    case 'win32':
      return 'Explorer';
    case 'darwin':
      return 'Finder';
    default:
      // For all unknown systems
      return 'File Manager';
  }
};

const FileViewModal = ({
  file,
  ext,
  onClose,
  encryptedPath,
  decryptedPath,
  mediamStream,
}) => {
  const { filename } = file;

  let fileView = null;
  switch (ext) {
    case 'mp4':
      if (!decryptedPath && mediamStream) {
        throw new Error('Not implemented');
      } else {
        fileView = <ReactPlayer url={decryptedPath} controls muted playing />;
      }
      break;
    default:
      break;
  }

  const onClickReveal = () => {
    switch (os.platform()) {
      case 'win32':
        exec(`explorer /select,${encryptedPath}`);
        break;
      default:
        throw new Error('Not Implemented');
    }
  };

  return (
    <div className="modal fileviewmodal" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{filename}</h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={onClose}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">{fileView}</div>
          <div className="modal-footer">
            <Button onClick={onClickReveal}>
              {`Reveal in ${getFileManagerAppName()}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewModal;
