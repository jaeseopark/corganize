/* eslint-disable promise/catch-or-return */
import { existsSync } from 'fs';
import React, { useEffect, useState } from 'react';
import { decrypt } from '../utils/cryptoUtils';

type FileDecryptViewProps = {
  encryptedPath: string;
  decryptedPath: string;
  aespassword: string;
  onDecrypt: () => void;
};

const FileDecryptView = ({
  encryptedPath,
  decryptedPath,
  aespassword,
  onDecrypt,
}: FileDecryptViewProps) => {
  const [percentage, setPercentage] = useState(0);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (!isDecrypting) {
      setIsDecrypting(true);

      let decryptPromise = null;
      if (existsSync(decryptedPath)) {
        decryptPromise = Promise.resolve();
      } else {
        decryptPromise = decrypt(
          encryptedPath,
          decryptedPath,
          aespassword,
          setPercentage
        );
      }

      decryptPromise.then(onDecrypt);
    }
  }, [isDecrypting, decryptedPath, onDecrypt, encryptedPath, aespassword]);

  return (
    <span>
      {percentage < 100 ? (
        <div>
          <span>Decrypting...</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      ) : (
        'Removing tmp file...'
      )}
    </span>
  );
};

export default FileDecryptView;
