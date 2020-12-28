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
import fs from 'fs';
import format from '../cellformatter';
import PageControl from './PageControl';
import TableHeaderGroup from './TableHeaderGroup';
import TableRow from './TableRow';
import { copyTextToClipboard } from '../utils/dist/clipboardUtils';

import './TableView.scss';
import GlobalFilter from './GlobalFilter';
import CorganizeClient from '../client/corganize';
import Button from './Button';

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

const LOCAL_FILE_STATUS = {
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  DECRYPTING: 'decrypting',
  DECRYPTED: 'decrypted',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TableView = ({ library }) => {
  const [filesRequested, setFilesRequested] = useState(false);
  const [files, setFiles] = useState(null);
  const [expandedFileid, setExpendedFileid] = useState(null);
  const [clipboardedFileid, setClipboardedFileId] = useState(null);
  const [localFileStatusMap] = useState({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [localFileLastUpdated, setLocalFileLastUpdated] = useState(0);

  const updateLocalFileStatus = (fileid, status) => {
    localFileStatusMap[fileid] = status;
    setLocalFileLastUpdated(Date.now());
  };

  async function downloadFile(file) {
    // TODO: Improve with a proper Worker Queue design
    updateLocalFileStatus(file.fileid, LOCAL_FILE_STATUS.DOWNLOADING);
    await sleep(2500);
    updateLocalFileStatus(file.fileid, LOCAL_FILE_STATUS.DOWNLOADED);
  }

  const doesFileExistLocally = (fileid) => {
    const path = `/tmp/corganize/${fileid}.enc`;
    try {
      return fs.existsSync(path);
    } catch {
      return null;
    }
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
      >
        {displayString}
      </textarea>
    );
  };

  const renderActions = (props) => {
    const { row } = props;
    const { original: file } = row;
    const { fileid, sourceurl, storageservice } = file;
    const isClipboarded = fileid === clipboardedFileid;

    const onOpen = () => {
      if (localFileStatusMap[fileid] === LOCAL_FILE_STATUS.DOWNLOADED) {
        updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTING);
        sleep(1500);
        // TODO: decrypt
        updateLocalFileStatus(fileid, LOCAL_FILE_STATUS.DECRYPTED);
      }

      // TODO: open decrypted file
    };

    return (
      <div className="fileview">
        {sourceurl && (
          <div className="copy-to-clipboard">
            <button
              type="button"
              className={isClipboarded ? 'btn btn-success' : 'btn btn-light'}
              onClick={() => {
                const copySuccess = copyTextToClipboard(sourceurl);
                if (copySuccess) {
                  setClipboardedFileId(fileid);
                }
              }}
            >
              {isClipboarded ? 'Copied' : 'Copy Source URL'}
            </button>
          </div>
        )}
        {storageservice &&
          !localFileStatusMap[fileid] &&
          !doesFileExistLocally(fileid) && (
            <Button
              onClick={() => {
                downloadFile(file);
              }}
            >
              Download
            </Button>
          )}
        {localFileStatusMap[fileid] === LOCAL_FILE_STATUS.DOWNLOADING && (
          <Button disabled>Downloading...</Button>
        )}
        {(localFileStatusMap[fileid] === LOCAL_FILE_STATUS.DOWNLOADED ||
          localFileStatusMap[fileid] === LOCAL_FILE_STATUS.DECRYPTED) && (
          <Button onClick={onOpen}>Open</Button>
        )}
        {localFileStatusMap[fileid] === LOCAL_FILE_STATUS.DECRYPTING && (
          <Button disabled>Opening...</Button>
        )}
      </div>
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
