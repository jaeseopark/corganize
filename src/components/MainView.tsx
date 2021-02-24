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
import {
  getCommonActions,
  getLocalActions,
  getRemoteActions,
} from '../utils/contextMenuUtils';
import PurgeCenterLauncher from './PurgeCenterLauncher';

const regularColumns = [
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
const hiddenColumns = [
  'sourceurl',
  'storageservice',
  'ispublic',
  'mimetype',
  'fileid',
  'encryptedPath',
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

  const rerender = (_ = null) => setRerenderTimestamp(Date.now());

  const deleteFile = (fileid: string) => {
    corganizeClient
      .deleteFile(fileid)
      .then(() => {
        // const i = renderBuffer.files.findIndex((f) => f.fileid === fileid);
        // renderBuffer.files.splice(i, 1);
        // return setFiles(renderBuffer.files);
        // How do i delete a row?
        return null;
      })
      .then(showAlert('file has been deleted'))
      .then(rerender)
      .catch(showAlert);
  };

  const updateFile = (fileid: string, props) => {
    const file = renderBuffer.files.find((f) => f.fileid === fileid);
    return corganizeClient
      .updateFile(fileid, props)
      .then((newFile) => Object.assign(file, newFile))
      .then(rerender)
      .then(() => {
        return showAlert('File has been updated');
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
        const newValue = dateactivated ? 'unfavorited' : 'favorited';
        return `The file has been ${newValue}`;
      })
      .then(showAlert)
      .then(rerender)
      .catch(showAlert);
  };

  const renderActions = ({ row }) => {
    const file = row.original;
    return (
      <FileActions
        file={file}
        aespassword={library.config.local.aes.password}
        setFullscreenComponent={setFullscreenComponent}
        updateFile={updateFile}
        showAlert={showAlert}
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
      const filterMoreFiles = (moreFiles) => {
        if (!library.showDownloadableFilesOnly) return moreFiles;
        return moreFiles.filter((f) => f.storageservice !== 'None');
      };

      const progressCallback = (moreFiles) => {
        moreFiles.forEach((file) => {
          file.encryptedPath = library.getEncryptedPath(file.fileid);
        });
        renderBuffer.files = renderBuffer.files.concat(
          filterMoreFiles(moreFiles)
        );
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
  }, [corganizeClient, files, library, showAlert]);

  const getConextMenuOptions = (inputFile) => {
    const file =
      renderBuffer.files.find((f) => f.fileid === inputFile.fileid) ||
      inputFile;
    return [
      ...getLocalActions(file, rerender, showAlert),
      ...getRemoteActions(file, updateFile, rerender, showAlert),
      ...getCommonActions(file, setFullscreenComponent, deleteFile),
    ];
  };

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
      <PurgeCenterLauncher
        setFullscreenComponent={setFullscreenComponent}
        isVisible={!fullscreenComponent}
        files={files}
        localPath={library.config.local.path}
      />
      <GlobalFilter {...tableInstance} isVisible={!fullscreenComponent} />
      <DownloadCenter isVisible={!fullscreenComponent} />
      <TableView
        tableInstance={tableInstance}
        isVisible={!fullscreenComponent}
        getConextMenuOptions={getConextMenuOptions}
      />
    </>
  );
};

export default MainView;
