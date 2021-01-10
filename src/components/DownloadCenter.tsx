import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';

const DownloadCenter = () => {
  const [activeDownloadCount, setActiveDownloadCount] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const createIntervalId = () => {
    return setInterval(() => {
      ipcRenderer.invoke('downloadProgressAll').then((allDownloads) => {
        if (allDownloads) {
          setActiveDownloadCount(
            Object.values(allDownloads).filter((value) => value < 100).length
          );
        }
      });
    }, 500);
  };

  useEffect(() => {
    if (intervalId === null) {
      setIntervalId(createIntervalId());
    }
  }, []);

  return <div>Active Downloads: {activeDownloadCount}</div>;
};

export default DownloadCenter;
