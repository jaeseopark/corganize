import React, { useState } from 'react';
import { File } from '../entity/File';
import { deleteAllAsync, listDirAsync } from '../utils/fileUtils';
import { humanFileSize } from '../utils/numberUtils';
import Button from './Button';

type AdminPanelProps = {
  files: File[];
  localPath: string;
};

const AdminPanel = ({ files, localPath }: AdminPanelProps) => {
  const [lfnil, setLfnil] = useState<string[] | null>(null);
  const [errorObj, setErrorObj] = useState(null);

  const calculateLfnil = () => {
    return listDirAsync(localPath, false)
      .then((localFilePaths: string[]) => {
        const pathsInLibrary = files
          .filter((f) => f.storageservice && f.storageservice !== 'None')
          .map((f) => f.encryptedPath);
        return localFilePaths.filter(
          (p) => p.endsWith('.aes') && !pathsInLibrary.includes(p)
        );
      })
      .then((tmpLfnil) => setLfnil(tmpLfnil))
      .catch(setErrorObj);
  };
  const purgeLfnil = () => {
    const p = lfnil ? Promise.resolve() : calculateLfnil();
    p.then(() => deleteAllAsync(lfnil))
      .then(() => setLfnil([]))
      .catch(setErrorObj);
  };

  const handleLfnilClick = () => {
    if (lfnil) {
      purgeLfnil();
    } else {
      calculateLfnil();
    }
  };

  if (errorObj) {
    return <span>{JSON.stringify(errorObj, null, 2)}</span>;
  }

  const lfnilLabel = lfnil
    ? `Purege ${lfnil.length} file(s)`
    : 'Local files not in library';

  const total_bytes = files.reduce((sum, f: File) => sum + (f.size || 0), 0);

  return (
    <div>
      <div>
        <span>{humanFileSize(total_bytes)}</span>
      </div>
      <Button onClick={handleLfnilClick} disabled={lfnil && lfnil.length === 0}>
        {lfnilLabel}
      </Button>
    </div>
  );
};

export default AdminPanel;
