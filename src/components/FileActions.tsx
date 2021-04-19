/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React, { useEffect, useState } from 'react';

import Button from './Button';

const FileActions = ({ file, downloadFile, openFile }) => {
  const { fileid, locationref, storageservice, encryptedPath } = file;
  const [download] = useState({ percentage: null });
  const [, setRerenderTimestamp] = useState(null);

  const rerender = () => setRerenderTimestamp(Date.now());

  useEffect(() => {
    const channel = `download${fileid}`;
    const downloadListener = (_event, { percentage, isInitial }) => {
      if (isInitial || percentage >= download.percentage + 10) {
        download.percentage = percentage;
        if (percentage !== 100) {
          rerender();
        } else {
          // If the file is small, the component must have been re-rendering very rapidly.
          // Give it a little break to ensure the final render happens properly.
          setTimeout(() => {
            rerender();
          }, 100);
        }
      }
    };
    ipcRenderer.on(channel, downloadListener);
    return () => {
      ipcRenderer.removeListener(channel, downloadListener);
    };
  });

  let actionButton = null;
  if (existsSync(encryptedPath)) {
    actionButton = <Button onClick={() => openFile(file)}>Open</Button>;
  } else if (download.percentage !== null) {
    actionButton = <Button disabled>{download.percentage}%</Button>;
  } else if (storageservice && storageservice !== 'None' && locationref) {
    actionButton = <Button onClick={() => downloadFile(file)}>DL</Button>;
  }

  return <div className="fileactions">{actionButton}</div>;
};

export default FileActions;
