import React from 'react';
import classNames from 'classnames';
import { humanFileSize } from '../utils/numberUtils';

type StatsCenterProps = {
  files: File[];
  isVisible: boolean;
};

const StatsCenter = ({ files, isVisible }: StatsCenterProps) => {
  const total_bytes = files.reduce((total, file: File) => total + file.size, 0);
  const total_bytes_human = humanFileSize(total_bytes);
  const className = classNames('admin-panel', {
    hidden: !isVisible,
  });

  return <span className={className}>{total_bytes_human}</span>;
};

export default StatsCenter;
