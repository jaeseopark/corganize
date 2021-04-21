/* eslint-disable import/prefer-default-export */
import React from 'react';
import ContextMenuWrapper from '../components/ContextMenuWrapper';
import Filename from '../components/Filename';
import FileView from '../components/FileView';
import { File } from '../entity/File';
import Library from '../entity/Library';
import { ContextMenuOption } from '../entity/props';
import { humanFileSize } from '../utils/numberUtils';
import { regularColumns } from './columnUtils';

export function openFileFullscreen(
  file: File,
  updateFile: (fileid: string, props: File) => any,
  getContextMenuOptions: (inputFile: File) => ContextMenuOption[],
  setFullscreenComponent: React.Dispatch<React.SetStateAction<null>>,
  library: Library
) {
  const { encryptedPath, decryptedPath, filename, size } = file;
  const contextMenuOptions = getContextMenuOptions(file);

  const sizeTag = <span className="size">{`${humanFileSize(size)}`}</span>;
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
      updateFile={updateFile}
      contextMenuOptions={contextMenuOptions}
    />
  );

  setFullscreenComponent({ title, body });
}

export function getAllColumns(
  setFullscreenComponent: React.Dispatch<React.SetStateAction<null>>,
  renderActions: ({ row }: { row: any }) => JSX.Element,
  renderFav: ({ value, row }: { value: any; row: any }) => JSX.Element
) {
  return regularColumns.concat([
    {
      id: 'filename',
      accessor: 'filename',
      Header: 'filename',
      Cell: (props) => Filename({ ...props, setFullscreenComponent }),
    },
    {
      id: 'actions',
      Cell: renderActions,
    },
    {
      id: 'dateactivated',
      accessor: 'dateactivated',
      Header: 'fav',
      Cell: renderFav,
    },
  ]);
}
