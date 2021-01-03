/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable react/display-name */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react';
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
} from 'react-table';
import format from '../cellformatter';
import PageControl from './PageControl';
import TableHeaderGroup from './TableHeaderGroup';
import TableRow from './TableRow';

import './TableView.scss';
import GlobalFilter from './GlobalFilter';
import CorganizeClient from '../client/corganize';

import FileView from './FileView';

const regularColumns = [
  'isactive',
  'ispublic',
  'storageservice',
  'size',
  'lastupdated',
  'sourceurl',
].map((accessor) => {
  return {
    accessor,
    Header: accessor,
    Cell: format,
  };
});
const hiddenColumns = ['sourceurl', 'storageservice'];

const TableView = ({ library }) => {
  const [filesRequested, setFilesRequested] = useState(false);
  const [files, setFiles] = useState(null);
  const [expandedFileid, setExpendedFileid] = useState(null);
  const [clipboardedFileid, setClipboardedFileId] = useState(null);
  const [localFileStatusMap] = useState({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setRerenderTimestamp] = useState(0);

  const updateLocalFileStatus = (fileid: string, status: string | null) => {
    localFileStatusMap[fileid] = status;
    setRerenderTimestamp(Date.now());
  };

  const renderFilename = (props) => {
    const { row } = props;
    const { original: file } = row;

    const displayString = format(props);
    const isExpanded = file.fileid === expandedFileid;

    return (
      <textarea
        readOnly
        tabIndex="-1"
        role="button"
        onClick={() => {
          setExpendedFileid(isExpanded ? null : file.fileid);
        }}
        value={displayString}
      />
    );
  };

  const renderActions = ({ row }) => {
    const file = row.original;
    const { fileid } = file;
    return (
      <FileView
        file={file}
        isClipboarded={fileid === clipboardedFileid}
        encryptedPath={library.getEncryptedPath(fileid)}
        localFileStatus={localFileStatusMap[fileid]}
        aespassword={library.config.local.aes.password}
        defaultExtname={library.config.local.defaultExtname}
        updateLocalFileStatus={updateLocalFileStatus}
        setClipboardedFileId={setClipboardedFileId}
      />
    );
  };

  const data = useMemo(() => files || [], [files]);
  const columns = useMemo(
    () => {
      const computedColumns = [
        {
          accessor: 'filename',
          Header: 'filename',
          id: 'filename',
          Cell: renderFilename,
        },
        {
          id: 'actions',
          Cell: renderActions,
        },
      ];
      return regularColumns.concat(computedColumns);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedFileid, clipboardedFileid]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: { hiddenColumns },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
  } = tableInstance;

  useEffect(() => {
    if (!files && !filesRequested) {
      const corganizeClient = new CorganizeClient(library.config.server);
      const promise = corganizeClient.getFiles();
      // eslint-disable-next-line promise/catch-or-return
      promise
        .then((r) => {
          return r.json();
        })
        // eslint-disable-next-line promise/always-return
        .then((responseBody) => {
          setFiles(responseBody.files);
        });
      setFilesRequested(true);
    }
  }, [files, filesRequested, library, expandedFileid]);

  if (!files) {
    return <h2 className="center">Loading...</h2>;
  }

  return (
    <div className="tableview">
      <GlobalFilter {...tableInstance} />
      <table className="table" {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <TableHeaderGroup headerGroup={headerGroup} />
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => (
            <TableRow
              row={row}
              expandedFileid={expandedFileid}
              {...tableInstance}
            />
          ))}
        </tbody>
      </table>
      <PageControl {...tableInstance} />
    </div>
  );
};

export default TableView;
