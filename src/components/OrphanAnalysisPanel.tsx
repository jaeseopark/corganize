import React, { useEffect, useState } from 'react';
import { File } from '../entity/File';
import { deleteAllAsync, listDirAsync } from '../utils/fileUtils';
import Button from './Button';

type OrphanAnalysisPanelProps = {
  files: File[];
  localPath: string;
};

const OrphanAnalysisPanel = ({ files, localPath }: OrphanAnalysisPanelProps) => {
  const [orphans, setOrphans] = useState<string[] | null>(null);
  const [errorObj, setErrorObj] = useState(null);

  const findOrphans = () => {
    return listDirAsync(localPath, false)
      .then((localFilePaths: string[]) => {
        const pathsInLibrary = files
          .filter((f) => f.storageservice && f.storageservice !== 'None')
          .map((f) => f.encryptedPath);
        return localFilePaths.filter(
          (p) => p.endsWith('.aes') && !pathsInLibrary.includes(p)
        );
      })
      .then(setOrphans)
      .catch(setErrorObj);
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
