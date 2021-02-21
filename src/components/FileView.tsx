/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { existsSync, readFileSync } from 'fs';
import { ipcRenderer } from 'electron';
import { Document, Page } from 'react-pdf';

import './FileView.scss';

import ZipViewer from './ZipViewer';
import { guessMimetypeAsync } from '../utils/fileUtils';

type FileViewProps = {
  encryptedPath: string,
  aespassword: string,
  onDetectMimetype: Function
};

const FileView = ({ encryptedPath, aespassword, onDetectMimetype }: FileViewProps) => {
  const decryptedPath = `${encryptedPath}.dec`;
  const [content, setContent] = useState<Element | null>(null);

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
      decryptPromise
        .then(() => guessMimetypeAsync(decryptedPath))
        .then((mimetype) => {
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
              const msg = `Unsupported: ${mimetype}`;
              return <span>{msg}</span>;
          }
        })
        .then((value) => setContent(value))
        .catch((error) => {
          const errorString = JSON.stringify(error, null, 2);
          setContent(<pre>{errorString}</pre>);
        });
    }
  }, [content]);

  return content || <span>Decrypting...</span>;
};

export default FileView;
