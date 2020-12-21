import format from './cellFormatter';

export const columnDefinition = [
  {
    accessor: 'isactive',
    Cell: format,
    Header: 'IsActive',
  },
  {
    accessor: 'ispublic',
    Cell: format,
  },
  {
    accessor: 'lastupdated',
    Header: 'Updated',
    Cell: format,
  },
  {
    accessor: 'storageservice',
    Cell: format,
  },
  {
    accessor: 'size',
    Header: 'Size',
    Cell: format,
  },
  {
    accessor: 'filename',
    Header: 'Filename',
    Cell: format,
  },
  {
    accessor: 'sourceurl',
  },
];

export const hiddenColumns = ['sourceurl'];
