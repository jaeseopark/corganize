import React from 'react';
import format from '../cellformatter';
import Filename from '../components/Filename';
import { nullableSelectColumnFilter, SelectColumnFilter } from './SelectColumnFilter';

export const regularColumns = [
  'ispublic',
  'storageservice',
  'size',
  'lastupdated',
  'sourceurl',
  'fileid',
  'encryptedPath',
].map((id) => {
  return {
    id,
    accessor: id,
    Header: id,
    Cell: format,
  };
});

export const hiddenColumns = [
  'sourceurl',
  'storageservice',
  'ispublic',
  'fileid',
  'encryptedPath',
];

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
    {
      id: 'mimetype',
      accessor: 'mimetype',
      Header: 'mimetype',
      Filter: SelectColumnFilter,
      filter: nullableSelectColumnFilter,
      Cell: format,
    },
  ]);
}
