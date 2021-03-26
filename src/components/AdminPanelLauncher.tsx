import React from 'react';
import classNames from 'classnames';
import Button from './Button';
import AdminPanel from './AdminPanel';

const AdminPanelLauncher = ({
  setFullscreenComponent,
  allFilesLoaded,
  files,
  localPath,
}) => {
  const className = classNames('admin-panel', {
    hidden: !allFilesLoaded,
  });

  return (
    <Button
      className={className}
      onClick={() =>
        setFullscreenComponent({
          title: 'Admin Panel',
          body: <AdminPanel files={files} localPath={localPath} />,
        })
      }
      tabIndex="4"
    >
      Admin
    </Button>
  );
};

export default AdminPanelLauncher;
