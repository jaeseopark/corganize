/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import { readFileSync } from 'fs';
import { Document, Page } from 'react-pdf';

import './FileView.scss';

import ZipView from './ZipView';
import { guessMimetypeAsync } from '../utils/fileUtils';
import VideoView from './VideoView';
import { ContextMenuOption } from '../entity/props';
import ContextMenuWrapper from './ContextMenuWrapper';
import FileDecryptView from './FileDecryptView';

const getInnermostChild = (el: HTMLElement) => {
  if (el.children.length === 0) {
    return el;
  }
  const [child] = el.children;
  return getInnermostChild(child);
};

type FileViewProps = {
  encryptedPath: string;
  decryptedPath: string;
  aespassword: string;
  onDetectMimetype: Function;
  contextMenuOptions: ContextMenuOption[];
};

const FileView = ({
  encryptedPath,
  decryptedPath,
  aespassword,
  onDetectMimetype,
  contextMenuOptions,
}: FileViewProps) => {
  const [content, setContent] = useState<HTMLElement | null>(null);
  const contentRef = useRef(null);

  const getContent = () => {
    return guessMimetypeAsync(decryptedPath)
      .then((mimetype: string) => {
        if (mimetype) {
          onDetectMimetype(mimetype);
        }
        return mimetype;
      })
      .then((mimetype: string) => {
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
            return <span tabIndex="1">{`Unsupported: ${mimetype}`}</span>;
        }
      });
  };

  const onDecrypt = () => {
    getContent()
      .then((value) => setContent(value))
      .catch((error) => {
        const preformatted = (
          <pre tabIndex="1">{JSON.stringify(error, null, 2)}</pre>
        );
        setContent(preformatted);
      });
  };

  useEffect(() => {
    if (contentRef?.current) {
      const child = getInnermostChild(contentRef.current);
      child.focus();
    }
  }, [content]);

  if (!content) {
    return (
      <FileDecryptView
        encryptedPath={encryptedPath}
        decryptedPath={decryptedPath}
        aespassword={aespassword}
        onDecrypt={onDecrypt}
      />
    );
  }

  const contentWrapper = <div ref={contentRef}>{content}</div>;
  return (
    <ContextMenuWrapper
      id="fileview-body"
      component={contentWrapper}
      options={contextMenuOptions}
    />
  );
};

export default FileView;
