/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import { existsSync, readFileSync } from 'fs';
import { ipcRenderer } from 'electron';
import { Document, Page } from 'react-pdf';

import './FileView.scss';

import ZipView from './ZipView';
import { guessMimetypeAsync } from '../utils/fileUtils';
import VideoView from './VideoView';
import { ContextMenuOption } from '../entity/props';
import ContextMenuWrapper from './ContextMenuWrapper';

const getInnermostChild = (el: HTMLElement) => {
  if (el.children.length === 0) {
    return el;
  }
  const [child] = el.children;
  return getInnermostChild(child);
};

type FileViewProps = {
  encryptedPath: string;
  aespassword: string;
  onDetectMimetype: Function;
  contextMenuOptions: ContextMenuOption[];
};

const FileView = ({
  encryptedPath,
  aespassword,
  onDetectMimetype,
  contextMenuOptions,
}: FileViewProps) => {
  const decryptedPath = `${encryptedPath}.dec`;
  const [content, setContent] = useState<HTMLElement | null>(null);
  const contentRef = useRef(null);

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
            case 'video/x-matroska':
              return <VideoView path={decryptedPath} />;
            case 'text/plain':
              return <pre>{readFileSync(decryptedPath)}</pre>;
            case 'application/pdf':
              return (
                <Document file={decryptedPath}>
                  <Page pageNumber={1} />
                </Document>
              );
            case 'application/zip':
              return <ZipView path={decryptedPath} />;
            default:
              return `Unsupported: ${mimetype}`;
          }
        })
        .then((value) => setContent(value))
        .catch((error) => {
          const preformatted = <pre>{JSON.stringify(error, null, 2)}</pre>;
          setContent(preformatted);
        });
    }

    if (contentRef?.current) {
      const child = getInnermostChild(contentRef.current);
      child.focus();
    }
  }, [aespassword, content, decryptedPath, encryptedPath, onDetectMimetype]);

  const contentToDisplay: HTMLElement = content || <span>Decrypting...</span>;
  const contentWrapper = <div ref={contentRef}>{contentToDisplay}</div>;
  return (
    <ContextMenuWrapper
      id="fileview-body"
      component={contentWrapper}
      options={contextMenuOptions}
    />
  );
};

export default FileView;
