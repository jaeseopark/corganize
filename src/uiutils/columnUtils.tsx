import React from 'react';
import classnames from 'classnames';
import Filename from '../components/Filename';
import {
  nullableSelectColumnFilter,
  SelectColumnFilter,
} from './SelectColumnFilter';
import { toHumanFileSize, toRelativeHumanTime } from '../utils/numberUtils';
import { File } from '../entity/File';
import FavButton from '../components/FavButton';

export const hiddenColumns = [
  'sourceurl',
  'storageservice',
  'fileid',
  'encryptedPath',
];

type ColumnCell = {
  row: {
    original: File;
  };
  value;
};

const valueAsDivClass = (...baseClassname) => (value) => {
  return <div className={classnames(...baseClassname, value)} />;
};

const valueAsMimetypeIcon = valueAsDivClass('icon', 'mimetype');

export function getAllColumns(
  renderActions: (props: ColumnCell) => JSX.Element,
  toggleFav: (file: File) => void
) {
  const hidden = hiddenColumns.map((accessor) => {
    return {
      accessor,
    };
  });

  const renderFavButton = (props: ColumnCell) => (
    <FavButton file={props.row.original} toggleFav={toggleFav} />
  );

  const custom = [
    {
      accessor: 'lastupdated',
      Header: 'modded',
      Cell: ({ value }: ColumnCell) => toRelativeHumanTime(value),
    },
    {
      accessor: 'size',
      Cell: ({ value }: ColumnCell) => toHumanFileSize(value),
    },
    {
      accessor: 'mimetype',
      Filter: SelectColumnFilter,
      filter: nullableSelectColumnFilter,
      Cell: ({ value }: ColumnCell) =>
        valueAsMimetypeIcon((value || '').replace('/', '-')),
    },
    {
      accessor: 'filename',
      Cell: (props: ColumnCell) => Filename(props.row.original),
    },
    {
      id: 'actions',
      Cell: renderActions,
    },
    {
      accessor: 'dateactivated',
      Header: 'fav',
      Cell: renderFavButton,
    },
  ];

  return [...hidden, ...custom].map((column) => {
    if (!column.id) {
      column.id = column.accessor;
    }
    if (!column.Header && column.accessor) {
      column.Header = column.accessor;
    }
    return column;
  });
}
