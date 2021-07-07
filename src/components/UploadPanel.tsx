import React, { useState } from 'react';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { File } from '../entity/File';
import Button from './Button';
import { useUpdate } from 'react-use';

type Upload = {
  uploadid: string;
  status: string;
  localPath: string;
  file?: File;
  error?: Error;
};

type UploadPanelProps = {
  uploadFile: (localPath: string) => Promise<File>;
};

const UploadView = ({ upload }) => {
  return (
    <div className="upload-view">
      <span className="localPath">{upload.localPath}</span>
      <span className="status">{upload.status}</span>
    </div>
  );
};

const UploadPanel = ({ uploadFile }: UploadPanelProps) => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const rerender = useUpdate();

  const addUpload = (localPath: string) => {
    const upload: Upload = {
      uploadid: uuidv4().toString(),
      status: 'uploading',
      localPath,
    };

    setUploads([...uploads, upload]);

    // eslint-disable-next-line promise/catch-or-return
    uploadFile(localPath)
      // eslint-disable-next-line promise/always-return
      .then((file) => {
        upload.file = file;
        upload.status = 'complete';
      })
      .catch((err) => {
        upload.status = 'error';
        upload.error = err;
      })
      .finally(() => rerender());
  };

  const handleBrowseClick = () => {
    // eslint-disable-next-line promise/catch-or-return
    ipcRenderer.invoke('openAnyFile').then((localPaths: string[]) => {
      // eslint-disable-next-line promise/always-return
      if (localPaths) localPaths.forEach((localPath) => addUpload(localPath));
    });
  };

  // TODO: add drag-drop support

  return (
    <div className="upload-panel">
      <div className="dragdrop">
        <Button onClick={handleBrowseClick}>Browse</Button>
      </div>
      <div className="uploads">
        {uploads.map((u) => (
          <UploadView key={u.uploadid} upload={u} />
        ))}
      </div>
    </div>
  );
};

export default UploadPanel;
