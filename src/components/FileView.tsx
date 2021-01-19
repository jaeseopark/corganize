/* eslint-disable react/prop-types */
import { exec } from 'child_process';
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { existsSync, readFileSync } from 'fs';
import { ipcRenderer } from 'electron';
import os from 'os';
import { Document, Page } from 'react-pdf';
import Button from './Button';

import './FileView.scss';

import ZipViewer from './ZipViewer';

const FileType = require('file-type');

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

const FileView = ({ encryptedPath, aespassword }) => {
  const decryptedPath = `${encryptedPath}.dec`;
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
        .then(() => FileType.fromFile(decryptedPath))
        .then((response) => {
          switch (response?.mime) {
            case 'video/mp4':
              return <ReactPlayer url={decryptedPath} controls muted playing />;
            case 'text/plain':
              return <pre>{readFileSync(decryptedPath)}</pre>;
            case 'application/pdf':
              return (
                <Document file={decryptedPath}>
                  <Page pageNumber={1} />
                </Document>
              );
            case 'application/zip':
              return <ZipViewer path={decryptedPath} />;
            default:
              return `Unsupported: ${response?.mime}`;
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

  return (
    <div>
      {content || 'Decrypting...'}
      <div className="footer">
        <Button onClick={onClickReveal}>
          {`Reveal in ${getFileManagerAppName()}`}
        </Button>
      </div>
    </div>
  );
};

export default FileView;
