/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';

import './DownloadCenter.scss';

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

  return (
    <div className={`download-center ${activeDownloadCount === 0 && 'zero'}`}>
      <div className="download-center-icon" />
      <div className="active-download-count-badge">
        <div className="active-download-count-text">{activeDownloadCount}</div>
      </div>
    </div>
  );
};

export default DownloadCenter;
