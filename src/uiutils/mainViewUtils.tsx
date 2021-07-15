/* eslint-disable import/prefer-default-export */
import React from 'react';
import ContextMenuWrapper from '../components/ContextMenuWrapper';
import FileView from '../components/FileView';
import { File } from '../entity/File';
import Library from '../entity/Library';
import { ContextMenuOption } from '../entity/props';
import { toHumanFileSize } from '../utils/numberUtils';
import { hasAtLeast1Change } from '../utils/objectUtils';

export function openFileFullscreen(
  file: File,
  updateFile: (f: File) => Promise<File>,
  getContextMenuOptions: (inputFile: File) => ContextMenuOption[],
  setFullscreenComponent: React.Dispatch<React.SetStateAction<null>>,
  library: Library
) {
  const { encryptedPath, decryptedPath, filename, size } = file;
  const contextMenuOptions = getContextMenuOptions(file);
  const updateFileWrapper = (partialProps: File) => {
    if (hasAtLeast1Change(file, partialProps)) {
      updateFile({ ...file, ...partialProps });
    }
  };

  const sizeTag = <span className="size">{`${toHumanFileSize(size)}`}</span>;
  const title = (
    <ContextMenuWrapper
      id="fileview-title"
      component={
        <span>
          {filename}
          {sizeTag}
        </span>
      }
      options={contextMenuOptions}
    />
  );
  const body = (
    <FileView
      encryptedPath={encryptedPath}
      decryptedPath={decryptedPath}
      aespassword={library.getAesPassword()}
      updateFile={updateFileWrapper}
      contextMenuOptions={contextMenuOptions}
    />
  );

  setFullscreenComponent({ title, body });
}
