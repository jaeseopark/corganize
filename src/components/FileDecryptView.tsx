import { createReadStream, createWriteStream, existsSync } from 'fs';
import React, { useEffect, useState } from 'react';
import { decryptAes256Cbc } from '../utils/cryptoUtils';
import {
  createParentPath,
  getFileSizeInBytes,
  moveFileAsync,
} from '../utils/fileUtils';

const ProgressStream = require('progress-stream');

type FileDecryptViewProps = {
  fileid: string;
  encryptedPath: string;
  decryptedPath: string;
  aespassword: string;
  onDecrypt: Function;
};

const FileDecryptView = ({
  fileid,
  encryptedPath,
  decryptedPath,
  aespassword,
  onDecrypt,
}: FileDecryptViewProps) => {
  const [percentage, setPercentage] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const decrypt = () => {
    createParentPath(decryptedPath);

    const ps = ProgressStream({
      length: getFileSizeInBytes(encryptedPath),
      time: 100,
    });

    ps.on('progress', ({ percentage }) => {
      console.log(percentage);
      setPercentage(percentage);
    });

    const tmpDecryptedPath = `${decryptedPath}.tmp`;
    const streamIn = createReadStream(encryptedPath);
    const streamOut = createWriteStream(tmpDecryptedPath);
    return decryptAes256Cbc(streamIn, streamOut, aespassword, ps)
      .then(() => {
        streamIn.close();
        streamOut.close();
        return null;
      })
      .then(() => moveFileAsync(tmpDecryptedPath, decryptedPath));
  };

  useEffect(() => {
    if (!isDecrypting) {
      setIsDecrypting(true);

      let decryptPromise = null;
      if (existsSync(decryptedPath)) {
        decryptPromise = Promise.resolve();
      } else {
        decryptPromise = decrypt();
      }

      decryptPromise.then(onDecrypt);
    }
  }, [
    aespassword,
    decrypt,
    decryptedPath,
    encryptedPath,
    fileid,
    isDecrypting,
    onDecrypt,
  ]);

  return (
    <span>
      {percentage < 100
        ? `Decrypting... ${percentage.toFixed(1)}%`
        : 'Removing tmp file...'}
    </span>
  );
};

export default FileDecryptView;
