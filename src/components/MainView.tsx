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

import DownloadCenter from './DownloadCenter';
import FullscreenView from './FullscreenView';
import Filename from './Filename';
import TableView from './TableView';
import FileActions from './FileActions';
import { ipcRenderer } from 'electron';

const regularColumns = [
  'ispublic',
  'storageservice',
  'size',
  'lastupdated',
  'sourceurl',
  'mimetype',
  'fileid',
].map((id) => {
  return {
    id,
    accessor: id,
    Header: id,
    Cell: format,
  };
});
const hiddenColumns = [
  'sourceurl',
  'storageservice',
  'ispublic',
  'mimetype',
  'fileid',
];

// MainView.state.files will grow in size as the data is retrieved via server side pagination.
// Unfortunately, updating a state value within a React component can be slow at times; causing some chunks to be skipped, etc.
// This array acts as the buffer so the UI can render reliably.
const renderBuffer = { files: [] };

const MainView = ({ library, showAlert }) => {
  const [files, setFiles] = useState(null);
  const [rerenderTimestamp, setRerenderTimestamp] = useState(0);
  const [fullscreenComponent, setFullscreenComponent] = useState(null);
  const [corganizeClient] = useState(
    new CorganizeClient(library.config.server)
  );

  const rerender = () => setRerenderTimestamp(Date.now());

  const updateFile = (fileid: string, props) => {
    const file = renderBuffer.files.find((f) => f.fileid === fileid);
    return corganizeClient
      .updateFile(fileid, props)
      .then((newFile) => Object.assign(file, newFile))
      .then(rerender())
      .then(showAlert('File has been updated'));
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
        rerender();
        showAlert(`The file has been ${newStateStr}`);
      });
  };

  const renderActions = ({ row }) => {
    const file = row.original;
    const { fileid } = file;
    return (
      <FileActions
        file={file}
        encryptedPath={library.getEncryptedPath(fileid)}
        aespassword={library.config.local.aes.password}
        setFullscreenComponent={setFullscreenComponent}
        updateFile={updateFile}
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
  }, [rerenderTimestamp]);

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
        renderBuffer.files = renderBuffer.files.concat(moreFiles);
        setFiles(renderBuffer.files);
      };

      switch (library.view) {
        case 'recent': {
          const limit = 20000;
          corganizeClient.getRecentFilesWithPagination(progressCallback, limit);
          break;
        }
        case 'active': {
          corganizeClient.getActiveFilesWithPagination(progressCallback);
          break;
        }
        case 'incomplete': {
          corganizeClient.getIncompleteFilesWithPagination(progressCallback);
          break;
        }
        default: {
          showAlert(`Invalid view: ${library.view}`);
          break;
        }
      }
    }

    const downloadListener = (_event, { percentage }) => {
      if (percentage === 100) rerender();
    };
    ipcRenderer.on('downloadProgress', downloadListener);

    return () => {
      ipcRenderer.removeListener('downloadProgress', downloadListener);
    };
  }, []);

  if (!files) {
    return <h2 className="center">Loading...</h2>;
  }

  return (
    <>
      {fullscreenComponent && (
        <FullscreenView
          title={fullscreenComponent.title}
          content={fullscreenComponent.body}
          onClose={() => setFullscreenComponent(null)}
        />
      )}
      <GlobalFilter {...tableInstance} isVisible={!fullscreenComponent} />
      <DownloadCenter isVisible={!fullscreenComponent} />
      <TableView
        tableInstance={tableInstance}
        isVisible={!fullscreenComponent}
        setFullscreenComponent={setFullscreenComponent}
        updateFile={updateFile}
        rerenderRowData={rerender}
        showAlert={showAlert}
        library={library}
      />
    </>
  );
};

export default MainView;
