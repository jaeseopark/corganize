import format from '../cellformatter';

export const regularColumns = [
  'ispublic',
  'storageservice',
  'size',
  'lastupdated',
  'sourceurl',
  'mimetype',
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
  'mimetype',
  'fileid',
  'encryptedPath',
];
