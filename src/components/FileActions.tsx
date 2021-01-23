/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React from 'react';

import Button from './Button';
import FileView from './FileView';

const FileActions = ({
  file,
  encryptedPath,
  aespassword,
  setFullscreenComponent,
  updateFile,
  downloadPercentage,
}) => {
  const { fileid, locationref, filename, mimetype } = file;

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
  if (downloadPercentage < 100) {
    actionButton = <Button disabled>{downloadPercentage}%</Button>;
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
