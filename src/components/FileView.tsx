/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */

import React from 'react';
import { copyTextToClipboard } from '../utils/dist/clipboardUtils';
import Button from './Button';

import './FileView.scss';

const FileView = ({ file, isClipboarded, onClipboard, onDownload }) => {
  const { sourceurl, storageservice } = file;

  const onSourceUrlCopy = () => {
    const copySuccess = copyTextToClipboard(sourceurl);
    if (copySuccess) {
      onClipboard(file.fileid);
    }
  };

  return (
    <div className="fileview">
      {sourceurl && (
        <div className="copy-to-clipboard">
          <button
            type="button"
            className={isClipboarded ? 'btn btn-success' : 'btn btn-light'}
            onClick={onSourceUrlCopy}
          >
            {isClipboarded ? 'Copied' : 'Copy Source URL'}
          </button>
        </div>
      )}
      {storageservice && (
        <Button
          onClick={() => {
            onDownload({ target: file });
          }}
        >
          Download
        </Button>
      )}
    </div>
  );
};

export default FileView;
