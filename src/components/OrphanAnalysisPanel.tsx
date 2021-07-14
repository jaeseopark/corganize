import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { File } from '../entity/File';
import { getLocalFiles, getRemoteFiles } from '../redux/files/slice';
import { deleteAllAsync } from '../utils/fileUtils';
import Button from './Button';

const OrphanAnalysisPanel = () => {
  const remoteFiles: File[] = useSelector(getRemoteFiles);
  const localFiles: string[] = useSelector(getLocalFiles);
  const [orphans, setOrphans] = useState<string[] | null>(null);
  const [errorObj, setErrorObj] = useState<Error | null>(null);

  const findOrphans = () => {
    const pathsInLibrary = remoteFiles
      .filter((f) => f.storageservice && f.storageservice !== 'None')
      .map((f) => f.encryptedPath);

    setOrphans(
      localFiles.filter(
        (p) => p.endsWith('.aes') && !pathsInLibrary.includes(p)
      )
    );
  };

  useEffect(() => {
    if (!orphans) findOrphans();
  });

  const deleteOrphans = () => {
    deleteAllAsync(orphans)
      .then(() => setOrphans([]))
      .catch(setErrorObj);
  };

  if (errorObj) {
    return <span>{JSON.stringify(errorObj, null, 2)}</span>;
  }

  if (!orphans) return 'Progressing...';

  return (
    <div>
      <Button
        onClick={deleteOrphans}
        disabled={orphans && orphans.length === 0}
      >
        {`Delete ${orphans.length} orphan files`}
      </Button>
    </div>
  );
};

export default OrphanAnalysisPanel;
