import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useTable,
  useSortBy,
  usePagination,
  useFilters,
  useGlobalFilter,
  useColumnOrder,
} from 'react-table';
import classNames from 'classnames';
import { ipcRenderer } from 'electron';

import './MainView.scss';
import { basename } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import GlobalFilter from './GlobalFilter';
import CorganizeClient from '../client/corganize';

import DownloadCenter, { isBeingDownloaded } from './DownloadCenter';
import FullscreenView from './FullscreenView';
import TableView from './TableView';
import FileActions from './FileActions';
import {
  getCommonActions,
  getLocalActions,
  getRemoteActions,
} from '../uiutils/contextMenuUtils';
import { File } from '../entity/File';
import { ContextMenuOption } from '../entity/props';
import { getAllColumns, hiddenColumns } from '../uiutils/columnUtils';
import Library from '../entity/Library';
import BurgerMenu, { BurgerMenuSpacer } from './BurgerMenu';
import HyperSquirrelClient from '../client/hypersquirrel';

import OrphanAnalysisPanel from './OrphanAnalysisPanel';
import ScrapePanel from './ScrapePanel';
import retrieveFilesAsync from '../uiutils/fileRetrievalUtils';
import DuplicateAnalysisPanel from './DuplicateAnalysisPanel';
import { openFileFullscreen } from '../uiutils/mainViewUtils';
import { listDirAsync } from '../utils/fsUtils';
import UploadPanel from './UploadPanel';
import { encrypt } from '../utils/cryptoUtils';
import {
  addAllHidden,
  addAllLocal,
  addAllRemote,
  deleteRemote,
  getLocalFiles,
  getRemoteFiles,
  updateRemote,
} from '../redux/files/slice';

type MainViewProps = {
  library: Library;
  showAlert: Function;
};

let shouldFocusTable = false;

const getCorganizeClient = (library: Library) =>
  new CorganizeClient(library.config.server);

const getHyperSquirrelClient = (library: Library) =>
  new HyperSquirrelClient(library.config.hypersquirrel.remote);

const MainView = ({ library, showAlert }: MainViewProps) => {
  const dispatch = useDispatch();
  const remoteFiles: File[] = useSelector(getRemoteFiles);
  const localFiles: string[] = useSelector(getLocalFiles);
  const [allFilesLoaded, setAllFilesLoaded] = useState(false);
  const [rerenderTimestamp, setRerenderTimestamp] = useState(0);
  const [fullscreenComponent, setFullscreenComponent] = useState(null);
  const [corganizeClient] = useState(getCorganizeClient(library));
  const [hsClient] = useState(getHyperSquirrelClient(library));

  const tableRef = useRef(null);

  const rerender = (_ = null) => setRerenderTimestamp(Date.now());

  const downloadFile = (file: File) => {
    const { fileid } = file;
    if (fileid.length <= 128) {
      ipcRenderer
        .invoke('download', file)
        .then(() => dispatch(addAllLocal([file.encryptedPath])))
        .catch(showAlert);
    } else {
      showAlert('fileid is too long');
    }
  };

  const createFile = (file: File): Promise<File> =>
    corganizeClient
      .createFile(file)
      .then(() => dispatch(addAllRemote([file])))
      .then(() => file)
      .catch((error: Error) => {
        if (JSON.stringify(error).includes('Primary Key already exists')) {
          dispatch(addAllHidden([file]));
        }
        throw error;
      });

  const uploadFile = (localPath: string): Promise<File> => {
    const fileid = uuidv4().toString();
    const encryptedPath = library.getEncryptedPath(fileid);

    const cb = (percentage: number) => {
      // TODO
    };

    const file: File = {
      fileid: uuidv4(),
      decryptedPath: localPath,
      encryptedPath,
      sourceurl: 'local',
      filename: basename(localPath),
      lastupdated: Date.now(),
    };

    return encrypt(localPath, encryptedPath, library.getAesPassword(), cb)
      .then(() => ipcRenderer.invoke('upload', localPath))
      .then((gdriveFileId) =>
        createFile({
          ...file,
          locationref: gdriveFileId,
          storageservice: 'gdrive',
        })
      );
  };

  const deleteFile = (fileid: string): Promise<void> =>
    corganizeClient
      .deleteFile(fileid)
      .then(() => dispatch(deleteRemote))
      .then(() => showAlert('file has been deleted'))
      .catch(showAlert);

  const updateFile = (newFile: File): Promise<File> =>
    corganizeClient
      .updateFile(newFile)
      .then(() => dispatch(updateRemote(newFile)))
      .then(() => newFile)
      .catch((error: Error) => showAlert(error.message));

  const toggleFav = (file: File) => {
    const toggled = {
      ...file,
      dateactivated: !file.dateactivated ? Math.round(Date.now() / 1000) : 0,
    };
    return updateFile(toggled).then(() => {
      const msg = toggled.dateactivated ? 'Favorited' : 'Unfavorited';
      return showAlert(msg);
    });
  };

  const openOrphanPanel = () => {
    setFullscreenComponent({
      title: 'Delete Orphan Files',
      body: <OrphanAnalysisPanel />,
    });
  };

  const openScrapePanel = (url: string | null = null) => {
    setFullscreenComponent({
      title: 'Scrape',
      body: (
        <ScrapePanel
          createFile={createFile}
          hsClient={hsClient}
          defaultUrl={url}
        />
      ),
    });
  };

  const getContextMenuOptions = (inputFile: File): ContextMenuOption[] => {
    const file =
      remoteFiles.find((f) => f.fileid === inputFile.fileid) || inputFile;
    return [
      ...getLocalActions(file, rerender, showAlert, localFiles),
      ...getRemoteActions(
        file,
        updateFile,
        rerender,
        showAlert,
        openScrapePanel
      ),
      ...getCommonActions(file, setFullscreenComponent, toggleFav, deleteFile),
    ];
  };

  const openDuplicateAnalysisPanel = () => {
    setFullscreenComponent({
      title: 'Duplicate Analysis',
      body: (
        <DuplicateAnalysisPanel getContextMenuOptions={getContextMenuOptions} />
      ),
    });
  };

  const openUploadPanel = () => {
    setFullscreenComponent({
      title: 'Upload',
      body: <UploadPanel uploadFile={uploadFile} />,
    });
  };

  const openFile = (file: File) => {
    openFileFullscreen(
      file,
      updateFile,
      getContextMenuOptions,
      setFullscreenComponent,
      library
    );
  };

  const renderActions = ({ row }: { row: { original: File } }) => {
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

  const data = useMemo(() => remoteFiles || [], [remoteFiles]);
  const columns = useMemo(() => {
    return getAllColumns(setFullscreenComponent, renderActions, renderFav);
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
      autoResetSortBy: false,
      autoResetFilters: false,
    },
    useFilters,
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

    if (localFiles.includes(file.encryptedPath)) {
      openFile(file);
    } else if (file.storageservice) {
      downloadFile(file);
    }
  };

  const focusTable = () => {
    if (tableRef?.current) {
      tableRef.current.focus();
    }
  };

  useEffect(() => {
    if (localFiles.length > 0 || remoteFiles.length > 0) return;

    const progressCallback = (moreFiles: {
      remote: File[];
      hidden: File[];
    }) => {
      const { remote, hidden } = moreFiles;
      dispatch(addAllRemote(remote));
      dispatch(addAllHidden(hidden));
    };

    const addAllLocalToRedux = (newPaths: string[]) =>
      dispatch(addAllLocal(newPaths));

    listDirAsync(library.config.local.path, false)
      .then(addAllLocalToRedux)
      .then(() =>
        retrieveFilesAsync(
          corganizeClient,
          library,
          progressCallback,
          localFiles
        )
      )
      .then(() => setAllFilesLoaded(true))
      .catch((error: Error) => showAlert(error.message));
  }, [corganizeClient, remoteFiles, library, showAlert]);

  useEffect(() => {
    if (shouldFocusTable) {
      shouldFocusTable = false;
      focusTable();
    }
  });

  if (!allFilesLoaded && remoteFiles.length === 0) {
    return <h2 className="center">Loading...</h2>;
  }

  const maybeRenderFullScreenComponent = () => {
    if (!fullscreenComponent) return null;

    return (
      <FullscreenView
        fullscreenComponent={fullscreenComponent}
        onClose={() => {
          shouldFocusTable = true;
          setFullscreenComponent(null);
        }}
      />
    );
  };

  const maybeRenderBurgerMenu = () => {
    if (fullscreenComponent) return null;

    return (
      <BurgerMenu
        scrapePreset={library.config.hypersquirrel.preset}
        allFilesLoaded={allFilesLoaded}
        openScrapePanel={openScrapePanel}
        openOrphanAnalysisPanel={openOrphanPanel}
        openDuplicateAnalysisPanel={openDuplicateAnalysisPanel}
        openUploadPanel={openUploadPanel}
      />
    );
  };

  const renderMainView = () => (
    <div className={classNames('mainview', { hidden: !!fullscreenComponent })}>
      <BurgerMenuSpacer />
      <GlobalFilter tableInstance={tableInstance} />
      <DownloadCenter />
      <TableView
        downloadOrOpenFile={downloadOrOpenFile}
        tableInstance={tableInstance}
        getConextMenuOptions={getContextMenuOptions}
        tableRef={tableRef}
        focusTable={focusTable}
      />
    </div>
  );

  return (
    <>
      {maybeRenderFullScreenComponent()}
      {maybeRenderBurgerMenu()}
      {renderMainView()}
    </>
  );
};

export default MainView;
