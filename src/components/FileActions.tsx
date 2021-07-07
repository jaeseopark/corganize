/* eslint-disable promise/always-return */
/* eslint-disable react/prop-types */
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import { useUpdate } from 'react-use';

import Button from './Button';

const FileActions = ({ file, localFiles, downloadFile, openFile }) => {
  const { fileid, locationref, storageservice, encryptedPath } = file;
  const [download] = useState({ percentage: null });

  const rerender = useUpdate();

  useEffect(() => {
    const channel = `download${fileid}`;
    const downloadListener = (_event, { percentage, isInitial }) => {
      if (
        isInitial ||
        percentage >= download.percentage + 1 ||
        percentage === 100
      ) {
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
  if (localFiles.includes(encryptedPath)) {
    actionButton = <Button onClick={() => openFile(file)}>Open</Button>;
  } else if (download.percentage !== null) {
    actionButton = <Button disabled>{download.percentage}%</Button>;
  } else if (storageservice && storageservice !== 'None' && locationref) {
    actionButton = <Button onClick={() => downloadFile(file)}>DL</Button>;
  }

  return <div className="fileactions">{actionButton}</div>;
};

export default FileActions;
