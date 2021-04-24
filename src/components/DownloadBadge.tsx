import React from 'react';
import classNames from 'classnames';

import './DownloadBadge.scss';

const DownloadBadge = ({ activeCount }) => {
  const className = classNames('download-center', {
    zero: activeCount === 0,
  });

  return (
    <div className={className}>
      <div className="download-center-icon" />
      <div className="active-download-count-badge">
        <div className="active-download-count-text">{activeCount}</div>
      </div>
    </div>
  );
};

export default DownloadBadge;
