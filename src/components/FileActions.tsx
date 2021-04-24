import { existsSync } from 'fs';
import React from 'react';

import Button from './Button';

const FileActions = ({ file, downloadFile, openFile, downloadManager }) => {
  const { fileid, locationref, storageservice, encryptedPath } = file;

  const percentage = downloadManager.downloads[fileid];

  let actionButton = null;
  if (existsSync(encryptedPath)) {
    actionButton = <Button onClick={() => openFile(file)}>Open</Button>;
  } else if (percentage !== undefined) {
    actionButton = <Button disabled>{percentage}%</Button>;
  } else if (storageservice && storageservice !== 'None' && locationref) {
    actionButton = <Button onClick={() => downloadFile(file)}>DL</Button>;
  }

  return <div className="fileactions">{actionButton}</div>;
};

export default FileActions;
