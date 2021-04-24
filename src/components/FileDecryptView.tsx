import { existsSync } from 'fs';
import React, { useEffect, useState } from 'react';
import { decrypt } from '../utils/cryptoUtils';

type FileDecryptViewProps = {
  encryptedPath: string;
  decryptedPath: string;
  aespassword: string;
  onDecrypt: Function;
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
      {percentage < 100
        ? `Decrypting... ${percentage.toFixed(1)}%`
        : 'Removing tmp file...'}
    </span>
  );
};

export default FileDecryptView;
