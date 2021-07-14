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

import { getBurgerMenuOptions as getAllBurgerMenuOptions } from '../uiutils/burgerMenuUtils';
import OrphanAnalysisPanel from './OrphanAnalysisPanel';
import ScrapePanel from './ScrapePanel';
import retrieveFilesAsync from '../uiutils/fileRetrievalUtils';
import DuplicateAnalysisPanel from './DuplicateAnalysisPanel';
import { openFileFullscreen } from '../uiutils/mainViewUtils';
import { listDirAsync } from '../utils/fileUtils';
import UploadPanel from './UploadPanel';
import { encrypt } from '../utils/cryptoUtils';
import {
  addAll,
  addAllLocal,
  getLocalFiles,
  getRemoteFiles,
  update,
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
    corganizeClient.createFile(file).then((newFile) => {
      dispatch(addAll([newFile]));
      return file;
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

  const deleteFile = (fileid: string) =>
    corganizeClient
      .deleteFile(fileid)
      .then(() => {
        // const i = renderBuffer.files.findIndex((f) => f.fileid === fileid);
        // renderBuffer.files.splice(i, 1);
        // return setFiles(renderBuffer.files);
        // TODO: How do i delete a row?
        return null;
      })
      .then(showAlert('file has been deleted'))
      .then(rerender)
      .catch(showAlert);

  const updateFile = (fileid: string, props: File) => {
    const file = remoteFiles.find((f) => f.fileid === fileid);
    if (!file) {
      showAlert('File not found');
      return Promise.resolve(null);
    }

    const updateRedux = (f: File) => dispatch(update(f));

    return corganizeClient
      .updateFile(fileid, props)
      .then(updateRedux)
      .catch((error: Error) => showAlert(error.message));
  };

  const toggleFav = (file: File) => {
    const { fileid, dateactivated } = file;
    corganizeClient
      .updateFile(fileid, { isactive: !dateactivated })
      .then((newFile) => {
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
          files={files}
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

  const getBurgerMenuOptions = () =>
    getAllBurgerMenuOptions(
      remoteFiles,
      library.config.hypersquirrel.preset,
      allFilesLoaded,
      openScrapePanel,
      openOrphanPanel,
      openDuplicateAnalysisPanel,
      openUploadPanel
    );

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

    const progressCallback = (moreFiles: File[]) => {
      dispatch(addAll(moreFiles));
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

  const isFullscreenActive = !!fullscreenComponent;

  return (
    <>
      {fullscreenComponent && (
        <FullscreenView
          fullscreenComponent={fullscreenComponent}
          onClose={() => {
            shouldFocusTable = true;
            setFullscreenComponent(null);
          }}
        />
      )}
      {!fullscreenComponent && (
        <BurgerMenu getBurgerMenuOptions={getBurgerMenuOptions} />
      )}
      <div className={classNames('mainview', { hidden: isFullscreenActive })}>
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
    </>
  );
};

export default MainView;
