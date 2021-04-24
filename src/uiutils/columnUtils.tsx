import React from 'react';
import classnames from 'classnames';
import Filename from '../components/Filename';
import {
  nullableSelectColumnFilter,
  SelectColumnFilter,
} from './SelectColumnFilter';
import { toHumanFileSize, toRelativeHumanTime } from '../utils/numberUtils';

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
  const hidden = hiddenColumns.map((accessor) => {
    return {
      accessor,
    };
  });

  const custom = [
    {
      accessor: 'lastupdated',
      Header: 'modded',
      Cell: ({ value }) => toRelativeHumanTime(value),
    },
    {
      accessor: 'size',
      Cell: ({ value }) => toHumanFileSize(value),
    },
    {
      accessor: 'mimetype',
      Filter: SelectColumnFilter,
      filter: nullableSelectColumnFilter,
      Cell: ({ value }) => valueAsMimetypeIcon((value || '').replace('/', '-')),
    },
    {
      accessor: 'filename',
      Cell: (props) => Filename({ ...props, setFullscreenComponent }),
    },
    {
      id: 'actions',
      Cell: renderActions,
    },
    {
      accessor: 'dateactivated',
      Header: 'fav',
      Cell: renderFav,
    },
  ];

  return [...hidden, ...custom].map((column) => {
    if (!column.id) { column.id = column.accessor };
    if (!column.Header && column.accessor) { column.Header = column.accessor; }
    return column;
  });
}
