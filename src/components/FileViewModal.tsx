import React from 'react';
import ReactPlayer from 'react-player';
import { isMac } from '../utils/browserUtils';
import Button from './Button';

import './FileViewModal.scss';

const finderLabel = () => (isMac() ? 'Finder' : 'Explorer');

const FileViewModal = ({
  file,
  ext,
  onClose,
  encryptedPath,
  decryptedPath,
  mediamStream,
}) => {
  const { filename } = file;

  const onKeyUp = (event) => {
    const { key, keyCode } = event;
    if ((key || keyCode) === 'Escape') {
      onClose();
    }
  };

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
    throw new Error('Not Implemented');
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
            <Button type="button" className="btn btn-primary">
              Reveal in {finderLabel()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewModal;
