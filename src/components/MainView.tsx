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
import TableView from './TableView';
import FileActions from './FileActions';
import {
  getCommonActions,
  getLocalActions,
  getRemoteActions,
} from '../uiutils/contextMenuUtils';
import { File } from '../entity/File';
import { ContextMenuOption } from '../entity/props';
import { hiddenColumns } from '../uiutils/columnUtils';
import Library from '../entity/Library';
import BurgerMenu, { BurgerMenuSpacer } from './BurgerMenu';
import HyperSquirrelClient from '../client/hypersquirrel';

import { getBurgerMenuOptions as getAllBurgerMenuOptions } from '../uiutils/burgerMenuUtils';
import OrphanAnalysisPanel from './OrphanAnalysisPanel';
import ScrapePanel from './ScrapePanel';
import { retrieveFilesAsync } from '../uiutils/fileRetrievalUtils';
import DuplicateAnalysisPanel from './DuplicateAnalysisPanel';
import { getAllColumns, openFileFullscreen } from '../uiutils/mainViewUtils';

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
  const [hsClient] = useState(
    new HyperSquirrelClient(library.config.hypersquirrel)
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

  const openOrphanPanel = () => {
    setFullscreenComponent({
      title: 'Delete Orphan Files',
      body: (
        <OrphanAnalysisPanel
          files={files}
          localPath={library.config.local.path}
        />
      ),
    });
  };

  const openScrapePanel = (url: string | null = null) => {
    setFullscreenComponent({
      title: 'Scrape',
      body: (
        <ScrapePanel
          corganizeClient={corganizeClient}
          hsClient={hsClient}
          defaultUrl={url}
        />
      ),
    });
  };

  const getContextMenuOptions = (inputFile: File): ContextMenuOption[] => {
    const file =
      renderBuffer.files.find((f: File) => f.fileid === inputFile.fileid) ||
      inputFile;
    return [
      ...getLocalActions(file, rerender, showAlert),
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
        <DuplicateAnalysisPanel
          files={files}
          getContextMenuOptions={getContextMenuOptions}
        />
      ),
    });
  };

  const getBurgerMenuOptions = () =>
    getAllBurgerMenuOptions(
      files,
      allFilesLoaded,
      openScrapePanel,
      openOrphanPanel,
      openDuplicateAnalysisPanel
    );

  const openFile = (file: File) => {
    openFileFullscreen(file, updateFile, getContextMenuOptions, setFullscreenComponent, library);
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
    }
  };

  const populateFileBuffer = (): Promise<null> => {
    const progressCallback = (moreFiles: File[]) => {
      renderBuffer.files = renderBuffer.files.concat(moreFiles);
      setFiles(renderBuffer.files);
    };

    return retrieveFilesAsync(corganizeClient, library, progressCallback);
  };

  const focusTable = () => {
    if (tableRef?.current) {
      tableRef.current.focus();
    }
  };

  useEffect(() => {
    if (!files) {
      populateFileBuffer()
        .then(() => setAllFilesLoaded(true))
        .catch((error) => showAlert(error.message));
    }
    if (renderBuffer.shouldFocusTable) {
      renderBuffer.shouldFocusTable = false;
      focusTable();
    }
  }, [files, populateFileBuffer, showAlert]);

  if (!files) {
    return <h2 className="center">Loading...</h2>;
  }

  const isFullscreenActive = !!fullscreenComponent;

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
