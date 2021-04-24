import React from 'react';
import classnames from 'classnames';
import Filename from '../components/Filename';
import {
  nullableSelectColumnFilter,
  SelectColumnFilter,
} from './SelectColumnFilter';
import { toRelativeHumanTime } from '../utils/numberUtils';

export const hiddenColumns = [
  'sourceurl',
  'storageservice',
  'fileid',
  'encryptedPath',
];

const valueAsDivClass = (...baseClassname) => (value) => {
  return <div className={classnames(...baseClassname, value)} />;
};

const valueAsMimetypeIcon = valueAsDivClass('icon', 'mimetype');

export function getAllColumns(
  setFullscreenComponent: React.Dispatch<React.SetStateAction<null>>,
  renderActions: ({ row }: { row: any }) => JSX.Element,
  renderFav: ({ value, row }: { value: any; row: any }) => JSX.Element
) {
  const hidden = hiddenColumns.map((id) => {
    return {
      id,
      accessor: id,
    };
  });

  const custom = [
    {
      id: 'lastupdated',
      accessor: 'lastupdated',
      Header: 'modded',
      Cell: ({ value }) => toRelativeHumanTime(value),
    },
    {
      id: 'mimetype',
      accessor: 'mimetype',
      Header: 'mimetype',
      Filter: SelectColumnFilter,
      filter: nullableSelectColumnFilter,
      Cell: ({ value }) => valueAsMimetypeIcon((value || '').replace('/', '-')),
    },
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
  ];

  return [...hidden, ...custom];
}
