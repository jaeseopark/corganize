/* eslint-disable react/prop-types */
import { exec } from 'child_process';
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { existsSync } from 'fs';
import { ipcRenderer } from 'electron';
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

const FileViewModal = ({ file, ext, onClose, encryptedPath, aespassword }) => {
  const { filename } = file;
  const decryptedPath = `${encryptedPath}.${ext}`;
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (!content) {
      let decryptPromise = null;
      if (existsSync(decryptedPath)) {
        decryptPromise = Promise.resolve();
      } else {
        decryptPromise = ipcRenderer.invoke('decrypt', {
          encryptedPath,
          decryptedPath,
          aespassword,
        });
      }
      // eslint-disable-next-line promise/catch-or-return
      decryptPromise
        .then(() => {
          switch (ext) {
            case 'mp4':
              return <ReactPlayer url={decryptedPath} controls muted playing />;
            default:
              return 'Unsupported File Type';
          }
        })
        .then((value) => setContent(value));
    }
  }, [content]);

  const onClickReveal = () => {
    switch (os.platform()) {
      case 'win32':
        exec(`explorer /select,${encryptedPath}`);
        break;
      default:
        throw new Error('Not Implemented');
    }
  };

  const closeButton = (
    <button
      type="button"
      className="close"
      data-dismiss="modal"
      aria-label="Close"
      onClick={onClose}
    >
      <span aria-hidden="true">&times;</span>
    </button>
  );

  return (
    <div className="modal fileviewmodal" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{filename}</h5>
            {content && closeButton}
          </div>
          <div className="modal-body">{content || 'Decrypting...'}</div>
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
