/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { existsSync, readFileSync } from 'fs';
import { ipcRenderer } from 'electron';
import { Document, Page } from 'react-pdf';

import './FileView.scss';

import ZipViewer from './ZipViewer';

const FileType = require('file-type');

const FileView = ({ encryptedPath, aespassword, onDetectMimetype }) => {
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
        .then((result) => {
          const mimetype = result?.mime;
          if (mimetype) {
            onDetectMimetype(mimetype);
          }

          switch (mimetype) {
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
              return `Unsupported: ${mimetype}`;
          }
        })
        .then((value) => setContent(value));
    }
  }, [content]);

  return content || <span>Decrypting...</span>;
};

export default FileView;
