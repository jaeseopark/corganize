import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';

const DownloadCenter = () => {
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [intervalId, setIntervalId] = useState(null);

  const createIntervalId = () => {
    return setInterval(() => {
      const allDownloads = ipcRenderer.invoke('downloadProgressAll');
      setActiveDownloads(
        Object.keys(allDownloads)
          .filter((key) => allDownloads[key] < 100)
          .map((key) => allDownloads[key])
      );
    }, 500);
  };

  useEffect(() => {
    if (intervalId === null) {
      setIntervalId(createIntervalId());
    }
  }, []);

  return <div>Active Downloads: {activeDownloads.length}</div>;
};

export default DownloadCenter;
