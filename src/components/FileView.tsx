/* eslint-disable react/button-has-type */
/* eslint-disable react/prop-types */

import React, { useState } from 'react';
import { copyTextToClipboard } from '../utils/dist/clipboardUtils';

import './FileView.scss';

const FileView = ({ file }) => {
  const [copied, setCopied] = useState(false);
  const { sourceurl } = file;

  const onSourceUrlCopy = () => {
    const copySuccess = copyTextToClipboard(sourceurl);
    if (copySuccess) {
      setCopied(true);
    }
  };

  return (
    <span>
      {sourceurl && (
        <div className="copy-to-clipboard">
          <button
            type="button"
            className={copied ? 'btn btn-success' : 'btn btn-light'}
            onClick={onSourceUrlCopy}
          >
            {copied ? 'Copied' : 'Copy Source URL'}
          </button>
        </div>
      )}
    </span>
  );
};

export default FileView;
