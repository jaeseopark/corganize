/* eslint-disable react/button-has-type */
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
import FileView from './FileView';
import PageControl from './PageControl';
import TableHeaderGroup from './TableHeaderGroup';
import TableRow from './TableRow';

import './TableView.scss';
import GlobalFilter from './GlobalFilter';

const columnConfigs = [
  'isactive',
  'ispublic',
  'storageservice',
  'size',
  'lastupdated',
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

  const data = useMemo(() => files || [], [files]);
  const columns = useMemo(
    () =>
      columnConfigs.concat([
        {
          accessor: 'filename',
          Header: 'filename',
          id: 'filename',
          Cell: (props) => {
            const { row } = props;
            const { original: file } = row;
            const displayString = format(props);
            const isExpanded = file.fileid === expandedFileid;
            const isClipboarded = file.fileid === clipboardedFileid;
            return (
              <>
                <span
                  role="button"
                  onClick={() => {
                    setExpendedFileid(isExpanded ? null : file.fileid);
                  }}
                >
                  {displayString}
                </span>
                <FileView
                  file={file}
                  isClipboarded={isClipboarded}
                  onClipboard={setClipboardedFileId}
                  onDownload={({ target }) => {
                    library.downloadFile(target);
                  }}
                />
              </>
            );
          },
        },
      ]),
    [expandedFileid, clipboardedFileid, library]
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
      const { corganizeClient } = library;
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
