/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import React from 'react';

import './DownloadCenter.scss';

const DownloadCenter = ({ downloadProgress }) => {
  const activeDownloadCount = Object.values(downloadProgress).filter(
    (value) => value < 100
  ).length;

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
