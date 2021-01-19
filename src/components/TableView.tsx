/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
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
  useColumnOrder,
} from 'react-table';
import format from '../cellformatter';
import PageControl from './PageControl';
import TableHeaderGroup from './TableHeaderGroup';
import TableRow from './TableRow';

import './TableView.scss';
import GlobalFilter from './GlobalFilter';
import CorganizeClient from '../client/corganize';

import FileActions from './FileActions';
import DownloadCenter from './DownloadCenter';
import FullscreenView from './FullscreenView';

const regularColumns = [
  'ispublic',
  'storageservice',
  'size',
  'lastupdated',
  'sourceurl',
].map((id) => {
  return {
    id,
    accessor: id,
    Header: id,
    Cell: format,
  };
});
const hiddenColumns = ['sourceurl', 'storageservice', 'ispublic'];

const TableView = ({ library }) => {
  const [filesRequested, setFilesRequested] = useState(false);
  const [files, setFiles] = useState(null);
  const [expandedFileid, setExpendedFileid] = useState(null);
  const [clipboardedFileid, setClipboardedFileId] = useState(null);
  const [localFileStatusMap] = useState({});
  const [, setRerenderTimestamp] = useState(0);
  const [fullscreenComponent, setFullscreenComponent] = useState(null);

  const corganizeClient = new CorganizeClient(library.config.server);

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
      <FileActions
        file={file}
        isClipboarded={fileid === clipboardedFileid}
        encryptedPath={library.getEncryptedPath(fileid)}
        localFileStatus={localFileStatusMap[fileid]}
        aespassword={library.config.local.aes.password}
        updateLocalFileStatus={updateLocalFileStatus}
        setClipboardedFileId={setClipboardedFileId}
        setFullscreenComponent={setFullscreenComponent}
      />
    );
  };

  const renderFav = ({ value, row }) => {
    const onClick = () => {
      const { original: file } = row;
      const { fileid, dateactivated } = file;
      corganizeClient.updateFav(fileid, !dateactivated).then(() => {
        delete file.dateactivated;
        // TODO: How do I force the cell to show the new value?
        // https://github.com/tannerlinsley/react-table/discussions/2340
      });
    };

    const classNames = `${String(!!value)} icon`;
    return <div onClick={onClick} className={classNames} />;
  };

  const data = useMemo(() => files || [], [files]);
  const columns = useMemo(
    () => {
      const computedColumns = [
        {
          id: 'filename',
          accessor: 'filename',
          Header: 'filename',
          Cell: renderFilename,
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
      return regularColumns.concat(computedColumns);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedFileid, clipboardedFileid]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: { hiddenColumns, columnOrder: ['dateactivated'] },
    },
    useGlobalFilter,
    useSortBy,
    useColumnOrder,
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
      const promise = corganizeClient.getActiveFiles();
      promise
        .then((r) => {
          return r.json();
        })
        .then((responseBody) => {
          setFiles(responseBody.files);
        });
      setFilesRequested(true);
    }
  }, [files, filesRequested, library, expandedFileid]);

  if (!files) {
    return <h2 className="center">Loading...</h2>;
  }

  if (fullscreenComponent) {
    return (
      <FullscreenView
        title={fullscreenComponent.title}
        content={fullscreenComponent.body}
        onClose={() => setFullscreenComponent(null)}
      />
    );
  }

  return (
    <div className="tableview">
      <GlobalFilter {...tableInstance} />
      <DownloadCenter />
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
