import { ipcRenderer } from 'electron';
import { existsSync } from 'fs';
import React, { useEffect, useState } from 'react';

type FileDecryptViewProps = {
  encryptedPath: string;
  decryptedPath: string;
  aespassword: string;
  onDecrypt: Function;
};

type DecryptProgressPayload = {
  percentage: number;
};

const FileDecryptView = ({
  encryptedPath,
  decryptedPath,
  aespassword,
  onDecrypt,
}: FileDecryptViewProps) => {
  const [_, setPercentage] = useState(0);
  const renderBuffer = { percentage: 0 };

  useEffect(() => {
    const channel = `decrypt${encryptedPath}`;
    const downloadListener = (
      _event,
      { percentage }: DecryptProgressPayload
    ) => {
      if (percentage > renderBuffer.percentage) {
        renderBuffer.percentage = percentage;
        setPercentage(percentage);
      }
    };

    if (!renderBuffer.percentage) {
      ipcRenderer.on(channel, downloadListener);

      let decryptPromise = null;
      if (existsSync(decryptedPath)) {
        decryptPromise = Promise.resolve();
      } else {
        decryptPromise = ipcRenderer.invoke('decrypt', {
          encryptedPath,
          decryptedPath,
          aespassword,
        });
      }
      decryptPromise.then(onDecrypt);
    }

    return () => {
      ipcRenderer.removeListener(channel, downloadListener);
    };
  }, [aespassword, decryptedPath, encryptedPath, onDecrypt, renderBuffer]);

  if (renderBuffer.percentage) {
    const progressString = `Decrypting... ${renderBuffer.percentage}%`;
    return <span>{progressString}</span>;
  }

  return null;
};

export default FileDecryptView;
