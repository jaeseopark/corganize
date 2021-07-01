import React, { useState } from 'react';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { File } from '../entity/File';
import Button from './Button';
import Library from '../entity/Library';

type Upload = {
  status: string;
  localPath: string;
  file: File;
};

type UploadPanelProps = {
  uploadFile: (file: File, localPath: string) => Promise<File>;
};

const UploadView = ({ upload }) => {
  return (
    <div key={upload.file.fileid}>
      <span className="localPath">{upload.localPath}</span>
      <span className="status">{upload.status}</span>
    </div>
  );
};

const UploadPanel = ({ uploadFile }: UploadPanelProps) => {
  const [uploads, setUploads] = useState<Upload[]>([]);

  const addUpload = (localPath) => {
    const timestamp = Date.now();
    const file: File = {
      fileid: uuidv4().toString(),
      sourceurl: 'local',
      filename: `Local Upload ${timestamp}`,
      lastupdated: timestamp,
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
          <UploadView key={u.file.fileid} upload={u} />
        ))}
      </div>
    </div>
  );
};

export default UploadPanel;
