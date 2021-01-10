/* eslint-disable promise/catch-or-return */
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';

import Button from './Button';

const DownloadProgressBar = ({ fileid }) => {
  const [percentage, setPercentage] = useState(0);

  const intervalId = setInterval(() => {
    ipcRenderer
      .invoke('downloadProgress', { fileid })
      .then((value) => setPercentage(value));
  }, 500);

  useEffect(() => {
    return () => {
      // this block is executed when the React component unmounts.
      clearInterval(intervalId);
    };
  });

  const label = `${percentage}%`;
  return <Button disabled>{label}</Button>;
};

export default DownloadProgressBar;
