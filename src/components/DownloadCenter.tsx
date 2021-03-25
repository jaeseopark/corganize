/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import './DownloadCenter.scss';

const downloads = {};

const DownloadCenter = () => {
  const [activeDownloadCount, setActiveDownloadCount] = useState(0);

  useEffect(() => {
    const downloadListener = (_event, { fileid, percentage, isInitial }) => {
      if (isInitial || percentage > downloads[fileid]) {
        downloads[fileid] = percentage;
        setActiveDownloadCount(
          Object.values(downloads).filter((value) => value < 100).length
        );
      }
    };
    ipcRenderer.on('downloadProgress', downloadListener);

    return () => {
      ipcRenderer.removeListener('downloadProgress', downloadListener);
    };
  });

  const className = classNames('download-center', {
    zero: activeDownloadCount === 0,
  });

  return (
    <div className={className}>
      <div className="download-center-icon" />
      <div className="active-download-count-badge">
        <div className="active-download-count-text">{activeDownloadCount}</div>
      </div>
    </div>
  );
};

export default DownloadCenter;
