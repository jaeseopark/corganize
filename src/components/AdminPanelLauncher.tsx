import React from 'react';
import classNames from 'classnames';
import Button from './Button';
import AdminPanel from './AdminPanel';

const AdminPanelLauncher = ({
  setFullscreenComponent,
  isVisible,
  files,
  localPath,
}) => {
  const className = classNames('admin-panel', {
    hidden: !isVisible,
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
    >
      Admin
    </Button>
  );
};

export default AdminPanelLauncher;
