/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React, { useEffect, useState } from 'react';

import Button from './Button';
import FileView from './FileView';

const FileActions = ({
  file,
  encryptedPath,
  aespassword,
  setFullscreenComponent,
  updateFile,
}) => {
  const { fileid, locationref, filename, mimetype } = file;
  const [download] = useState({ percentage: null });
  const [, setRerenderTimestamp] = useState(null);

  useEffect(() => {
    const channel = `download${fileid}`;
    const downloadListener = (_event, { percentage, isInitial }) => {
      if (isInitial || percentage > download.percentage) {
        download.percentage = percentage;
        setRerenderTimestamp(Date.now());
      }
    };
    ipcRenderer.on(channel, downloadListener);
    return () => {
      ipcRenderer.removeListener(channel, downloadListener);
    };
  });

  const openInApp = () => {
    const onDetectMimetype = (detected: string) => {
      if (!mimetype) {
        updateFile(fileid, { mimetype: detected });
      }
    };

    setFullscreenComponent({
      title: filename,
      body: (
        <FileView
          encryptedPath={encryptedPath}
          aespassword={aespassword}
          onDetectMimetype={onDetectMimetype}
        />
      ),
    });
  };

  let actionButton = null;
  if (download.percentage !== null && download.percentage < 100) {
    actionButton = <Button disabled>{download.percentage}%</Button>;
  } else if (existsSync(encryptedPath)) {
    actionButton = <Button onClick={openInApp}>Open</Button>;
  } else if (locationref) {
    actionButton = (
      <Button onClick={() => ipcRenderer.invoke('download', file)}>
        Download
      </Button>
    );
  }

  return <div className="fileactions">{actionButton}</div>;
};

export default FileActions;
