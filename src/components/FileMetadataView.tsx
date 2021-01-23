/* eslint-disable promise/catch-or-return */
import React, { useState } from 'react';
import { copyTextToClipboard } from '../utils/clipboardUtils';

import './FileMetadataView.scss';

const FileMetadataView = ({ file }) => {
  const [isClipboarded, setIsClipboarded] = useState(false);

  const { sourceurl } = file;

  const getClipboardButton = () => (
    <div className="copy-to-clipboard">
      <button
        type="button"
        className={isClipboarded ? 'btn btn-success' : 'btn btn-light'}
        onClick={(result) => {
          if (result) {
            copyTextToClipboard(sourceurl).then(() => {
              setIsClipboarded(true);
              return setTimeout(() => {
                setIsClipboarded(false);
              }, 1000);
            });
          }
        }}
      >
        Copy Source URL
      </button>
      {isClipboarded && <span className="copied">Copied!</span>}
    </div>
  );

  return (
    <>
      <pre>{JSON.stringify(file, null, 2)}</pre>
      {sourceurl && getClipboardButton()}
    </>
  );
};

export default FileMetadataView;
