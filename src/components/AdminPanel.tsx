import React, { useState } from 'react';
import { File } from '../entity/File';
import { deleteAllAsync, listDirAsync } from '../utils/fileUtils';
import Button from './Button';

type AdminPanelProps = {
  files: File[];
  localPath: string;
};

const AdminPanel = ({ files, localPath }: AdminPanelProps) => {
  const [lfnil, setLfnil] = useState<string[] | null>(null);
  const [errorObj, setErrorObj] = useState(null);
  const [inProgress, setProgressFlag] = useState(false);

  const setProgressTrueAsync = () =>
    new Promise((resolve) => {
      setProgressFlag(true);
      resolve(null);
    });

  const calculateLfnil = () => {
    return setProgressTrueAsync()
      .then(() => listDirAsync(localPath, false))
      .then((localFilePaths: string[]) => {
        const pathsInLibrary = files
          .filter((f) => f.storageservice && f.storageservice !== 'None')
          .map((f) => f.encryptedPath);
        return localFilePaths.filter(
          (p) => p.endsWith('.aes') && !pathsInLibrary.includes(p)
        );
      })
      .then(setLfnil)
      .then(() => setProgressFlag(false))
      .catch(setErrorObj);
  };

  const purgeLfnil = () => {
    setProgressTrueAsync()
      .then(() => (lfnil ? null : calculateLfnil()))
      .then(() => deleteAllAsync(lfnil))
      .then(() => setLfnil([]))
      .then(() => setProgressFlag(false))
      .catch(setErrorObj);
  };

  const handleLfnilClick = () => {
    if (lfnil) purgeLfnil();
    else calculateLfnil();
  };

  if (errorObj) {
    return <span>{JSON.stringify(errorObj, null, 2)}</span>;
  }

  if (inProgress) return 'Progressing...';

  return (
    <div>
      <Button onClick={handleLfnilClick} disabled={lfnil && lfnil.length === 0}>
        {lfnil
          ? `Purege ${lfnil.length} file(s) not in library`
          : 'Caclculate Local files not in library'}
      </Button>
    </div>
  );
};

export default AdminPanel;
