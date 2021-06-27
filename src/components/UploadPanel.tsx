import React, { useState } from 'react';
import { ipcRenderer } from 'electron';
import { File } from '../entity/File';
import Button from './Button';

type Upload = {
  status: string;
  localPath: string;
  file: File;
};

const UploadView = ({ upload }) => {
  return (
    <div key={upload.file.fileid}>
      <span className="localPath">{upload.localPath}</span>
      <span className="status">{upload.status}</span>
    </div>
  );
};

const UploadPanel = ({ uploadFile }) => {
  const [uploads, setUploads] = useState<Upload[]>([]);

  const addUpload = (localPath) => {
    const timestamp = Date.now();
    const file: File = {
      fileid: 'uuid123',
      sourceurl: 'local',
      filename: `Local Upload ${timestamp}`,
      lastupdated: timestamp,
      encryptedPath: null,
      decryptedPath: null,
    };

    const upload = {
      status: 'uploading',
      localPath,
      file,
    };

    setUploads([...uploads, upload]);

    uploadFile(file, localPath).then(() => {
      upload.status = 'complete';
      setUploads([...uploads]);
    });
  };

  const handleBrowseClick = () => {
    ipcRenderer.invoke('openAnyFile').then((localPaths: string[]) => {
      if (localPaths) localPaths.forEach((localPath) => addUpload(localPath));
    });
  };

  // TODO: add drag-drop support

  return (
    <div className="upload-panel">
      <div className="dragdrop">
        <Button onClick={handleBrowseClick}>Browse</Button>
      </div>
      <div className="files">
        {uploads.map((u) => (
          // eslint-disable-next-line react/jsx-key
          <UploadView upload={u} />
        ))}
      </div>
    </div>
  );
};

export default UploadPanel;
