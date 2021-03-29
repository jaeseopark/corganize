import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useTable,
  useSortBy,
  usePagination,
  useGlobalFilter,
  useColumnOrder,
} from 'react-table';
import { existsSync } from 'fs';
import classNames from 'classnames';
import { ipcRenderer } from 'electron';

import './MainView.scss';
import GlobalFilter from './GlobalFilter';
import CorganizeClient from '../client/corganize';

import DownloadCenter, { isBeingDownloaded } from './DownloadCenter';
import FullscreenView from './FullscreenView';
import Filename from './Filename';
import TableView from './TableView';
import FileActions from './FileActions';
import {
  getCommonActions,
  getLocalActions,
  getRemoteActions,
} from '../utils/contextMenuUtils';
import AdminPanelLauncher from './AdminPanelLauncher';
import { File } from '../entity/File';
import { ContextMenuOption } from '../entity/props';
import { htmlDecode } from '../utils/stringUtils';
import ContextMenuWrapper from './ContextMenuWrapper';
import FileView from './FileView';
import { hiddenColumns, regularColumns } from '../uiutils/columnUtils';
import Library from '../entity/Library';

type MainViewRenderBuffer = {
  files: File[];
  shouldFocusTable: boolean;
};

type MainViewProps = {
  library: Library;
  showAlert: Function;
};

// MainView.state.files will grow in size as the data is retrieved via server side pagination.
// Unfortunately, updating a state value within a React component can be slow at times; causing some chunks to be skipped, etc.
// This array acts as the buffer so the UI can render reliably.
const renderBuffer: MainViewRenderBuffer = {
  files: [],
  shouldFocusTable: false,
};

const MainView = ({ library, showAlert }: MainViewProps) => {
  const [files, setFiles] = useState(null);
  const [allFilesLoaded, setAllFilesLoaded] = useState(false);
  const [rerenderTimestamp, setRerenderTimestamp] = useState(0);
  const [fullscreenComponent, setFullscreenComponent] = useState(null);
  const [corganizeClient] = useState(
    new CorganizeClient(library.config.server)
  );

  const tableRef = useRef(null);

  const rerender = (_ = null) => setRerenderTimestamp(Date.now());

  const downloadFile = (file: File) => {
    const { fileid } = file;
    if (fileid.length <= 128) {
      ipcRenderer.invoke('download', file);
    } else {
      showAlert('fileid too long');
    }
  };

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

  const updateFile = (fileid: string, props: File) => {
    const file = renderBuffer.files.find((f: File) => f.fileid === fileid);
    if (!file) {
      showAlert('File not found in renderBuffer');
      return Promise.resolve(null);
    }

    return corganizeClient
      .updateFile(fileid, props)
      .then((newFile: File) => {
        if (newFile) return Object.assign(file, newFile);
        throw { message: 'File not found' };
      })
      .then(rerender)
      .then(() => 'File has been updated')
      .then(showAlert)
      .catch((error) => showAlert(error.message));
  };

  const toggleFav = (file: File) => {
    const { fileid, dateactivated } = file;
    corganizeClient
      .updateFile(fileid, { isactive: !dateactivated })
      .then((newFile: File) => {
        if (dateactivated) {
          delete file.dateactivated;
        } else {
          file.dateactivated = Date.now();
        }
        file.lastupdated = newFile.lastupdated;
        const newValue = dateactivated ? 'unfavorited' : 'favorited';
        return `The file has been ${newValue}`;
      })
      .then(showAlert)
      .then(rerender)
      .catch(showAlert);
  };

  const getConextMenuOptions = (inputFile: File): ContextMenuOption[] => {
    const file =
      renderBuffer.files.find((f: File) => f.fileid === inputFile.fileid) ||
      inputFile;
    return [
      ...getLocalActions(file, rerender, showAlert),
      ...getRemoteActions(file, updateFile, rerender, showAlert),
      ...getCommonActions(file, setFullscreenComponent, toggleFav, deleteFile),
    ];
  };

  const openFile = (file: File) => {
    const { mimetype, fileid, encryptedPath, decryptedPath, filename } = file;
    const onDetectMimetype = (detected: string) => {
      if (!mimetype) {
        updateFile(fileid, { mimetype: detected });
      }
    };

    const contextMenuOptions = getConextMenuOptions(file);

    setFullscreenComponent({
      title: (
        <ContextMenuWrapper
          id="fileview-title"
          component={<span>{filename}</span>}
          options={contextMenuOptions}
        />
      ),
      body: (
        <FileView
          encryptedPath={encryptedPath}
          decryptedPath={decryptedPath}
          aespassword={library.getAesPassword()}
          onDetectMimetype={onDetectMimetype}
          contextMenuOptions={contextMenuOptions}
        />
      ),
    });
  };

  const renderActions = ({ row }) => {
    const { original: file } = row;
    return (
      <FileActions
        file={file}
        openFile={openFile}
        downloadFile={downloadFile}
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

  const downloadOrOpenFile = (file: File) => {
    if (isBeingDownloaded(file.fileid)) {
      showAlert('Download in progress');
      return;
    }

    if (existsSync(file.encryptedPath)) {
      openFile(file);
    } else if (file.storageservice) {
      downloadFile(file);
    } else {
      showAlert('Nothing to open or download');
    }
  };

  const loadFiles = (): Promise<null> => {
    const filterMoreFiles = (moreFiles: File[]) => {
      const {
        showDownloadableFilesOnly: sdfo,
        hideDownloadedFiles: hdf,
      } = library;

      if (!sdfo && !hdf) return moreFiles;

      return moreFiles.filter(
        (f: File) =>
          (!sdfo || f.storageservice !== 'None') &&
          (!hdf || !existsSync(f.encryptedPath))
      );
    };

    const progressCallback = (moreFiles: File[]) => {
      moreFiles.forEach((file: File) => {
        file.encryptedPath = library.getEncryptedPath(file.fileid);
        file.decryptedPath = library.getDecryptedPath(file.fileid);
        file.filename = htmlDecode(file.filename);
      });
      renderBuffer.files = renderBuffer.files.concat(
        filterMoreFiles(moreFiles)
      );
      setFiles(renderBuffer.files);
    };

    switch (library.view) {
      case 'recent': {
        const limit = 20000;
        return corganizeClient.getRecentFilesWithPagination(
          progressCallback,
          limit
        );
      }
      case 'active': {
        return corganizeClient.getActiveFilesWithPagination(progressCallback);
      }
      case 'incomplete': {
        return corganizeClient.getIncompleteFilesWithPagination(
          progressCallback
        );
      }
      default: {
        const message = `Invalid view: ${library.view}`;
        return Promise.reject({ message });
      }
    }
  };

  const focusTable = () => {
    if (tableRef?.current) {
      tableRef.current.focus();
    }
  };

  useEffect(() => {
    if (!files) {
      loadFiles()
        .then(() => setAllFilesLoaded(true))
        .catch((error) => showAlert(error.message));
    }
    if (renderBuffer.shouldFocusTable) {
      renderBuffer.shouldFocusTable = false;
      focusTable();
    }
  }, [files, loadFiles, showAlert]);

  if (!files) {
    return <h2 className="center">Loading...</h2>;
  }

  const mainViewClassNames = classNames('mainview', {
    hidden: !!fullscreenComponent,
  });

  return (
    <>
      {fullscreenComponent && (
        <FullscreenView
          fullscreenComponent={fullscreenComponent}
          onClose={() => {
            renderBuffer.shouldFocusTable = true;
            setFullscreenComponent(null);
          }}
        />
      )}
      <div className={mainViewClassNames}>
        <AdminPanelLauncher
          setFullscreenComponent={setFullscreenComponent}
          allFilesLoaded={allFilesLoaded}
          files={files}
          localPath={library.config.local.path}
        />
        <GlobalFilter tableInstance={tableInstance} />
        <DownloadCenter />
        <TableView
          downloadOrOpenFile={downloadOrOpenFile}
          tableInstance={tableInstance}
          getConextMenuOptions={getConextMenuOptions}
          tableRef={tableRef}
          focusTable={focusTable}
        />
      </div>
    </>
  );
};

export default MainView;
