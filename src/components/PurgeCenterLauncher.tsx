import React from 'react';
import classNames from 'classnames';
import Button from './Button';
import PurgeCenter from './PurgeCenter';

const PurgeCenterLauncher = ({
  setFullscreenComponent,
  isVisible,
  files,
  localPath,
}) => {
  const className = classNames('purge-center', {
    hidden: !isVisible,
  });

  return (
    <Button
      className={className}
      onClick={() =>
        setFullscreenComponent({
          title: 'Purge Center',
          body: <PurgeCenter files={files} localPath={localPath} />,
        })
      }
    >
      Purge
    </Button>
  );
};

export default PurgeCenterLauncher;
