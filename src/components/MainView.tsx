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

import './MainView.scss';
import GlobalFilter from './GlobalFilter';
import CorganizeClient from '../client/corganize';

import FileActions from './FileActions';
import DownloadCenter from './DownloadCenter';
import FullscreenView from './FullscreenView';
import Filename from './Filename';
import TableView from './TableView';

const regularColumns = [
  'ispublic',
  'storageservice',
  'size',
  'lastupdated',
  'sourceurl',
  'mimetype',
].map((id) => {
  return {
    id,
    accessor: id,
    Header: id,
    Cell: format,
  };
});
const hiddenColumns = ['sourceurl', 'storageservice', 'ispublic', 'mimetype'];

// MainView.state.files will grow in size as the data is retrieved via server side pagination.
// Unfortunately, updating a state value within a React component can be slow at times; causing some chunks to be skipped, etc.
// This array acts as the buffer so the UI can render reliably.
let filesRenderBuffer = [];
// Similarly, alertContent needs a buffer.
let alertContentBuffer = null;

const MainView = ({ library }) => {
  const [files, setFiles] = useState(null);
  const [clipboardedFileid, setClipboardedFileId] = useState(null);
  const [localFileStatusMap] = useState({});
  const [rerenderTimestamp, setRerenderTimestamp] = useState(0);
  const [fullscreenComponent, setFullscreenComponent] = useState(null);
  const [] = useState(null);
  const [alertContent, setAlertContent] = useState(null);
  const [corganizeClient] = useState(
    new CorganizeClient(library.config.server)
  );

  const updateLocalFileStatus = (fileid: string, status: string | null) => {
    localFileStatusMap[fileid] = status;
    setRerenderTimestamp(Date.now());
  };

  const showAlert = (el, timeout = 2000) => {
    if (!alertContentBuffer) {
      setTimeout(() => {
        setAlertContent(null);
        alertContentBuffer = null;
      }, timeout);
      setAlertContent(el);
      alertContentBuffer = el;
    } else {
      // Try again in 0.1s
      setTimeout(() => showAlert(el, timeout), 100);
    }
  };

  const setMimetype = (fileid: string, mimetype: string) => {
    corganizeClient.updateFile(fileid, { mimetype }).then(() => {
      const file = filesRenderBuffer.find((f) => f.fileid === fileid);
      if (file) file.mimetype = mimetype;
      setRerenderTimestamp(Date.now());
    });
  };

  const toggleFav = (file) => {
    const { fileid, dateactivated } = file;
    corganizeClient
      .updateFile(fileid, { isactive: !dateactivated })
      .then(() => {
        if (dateactivated) {
          delete file.dateactivated;
        } else {
          file.dateactivated = Date.now();
        }
        const newStateStr = dateactivated ? 'unfavorited' : 'favorited';
        setRerenderTimestamp(Date.now()); // This forces a re-render of the columns
        showAlert(`The file has been ${newStateStr}`);
      });
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
        setMimetype={setMimetype}
      />
    );
  };

  const renderFav = ({ value, row }) => {
    const onClick = () => {
      const { original: file } = row;
      toggleFav(file);
    };

    const classNames = `${String(!!value)} icon`;
    return <div onClick={onClick} className={classNames} />;
  };

  const data = useMemo(() => files || [], [files]);
  const columns = useMemo(() => {
    const computedColumns = [
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
    return regularColumns.concat(computedColumns);
  }, [clipboardedFileid, rerenderTimestamp]);

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        hiddenColumns,
        columnOrder: ['dateactivated'],
      },
      autoResetPage: false,
    },
    useGlobalFilter,
    useSortBy,
    useColumnOrder,
    usePagination
  );

  useEffect(() => {
    if (!files) {
      const progressCallback = (moreFiles) => {
        filesRenderBuffer = filesRenderBuffer.concat(moreFiles);
        setFiles(filesRenderBuffer);
      };
      corganizeClient.getActiveFilesWithPagination(progressCallback);
    }

    return () => {
      // cleanup function
    };
  }, []);

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
    <>
      {alertContent && (
        <div className="alert alert-light" role="alert">
          {alertContent}
        </div>
      )}
      <GlobalFilter {...tableInstance} />
      <DownloadCenter />
      <TableView tableInstance={tableInstance} />
    </>
  );
};

export default MainView;
