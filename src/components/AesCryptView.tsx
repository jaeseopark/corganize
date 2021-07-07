import { existsSync } from 'fs';
import React, { useEffect, useState } from 'react';
import { AesCryptOperation, decrypt } from '../utils/cryptoUtils';

type AesCryptViewProps = {
  encryptedPath: string;
  decryptedPath: string;
  aespassword: string;
  operation: AesCryptOperation;
  onFinish: () => void;
};

const AesCryptView = ({
  encryptedPath,
  decryptedPath,
  aespassword,
  operation,
  onFinish,
}: AesCryptViewProps) => {
  const [percentage, setPercentage] = useState(0);
  const [isInProgress, setInProgress] = useState(false);
  const [error, setError] = useState(null);

  const getDecryptPromise = () => {
    if (existsSync(decryptedPath)) {
      return Promise.resolve();
    }

    return decrypt(encryptedPath, decryptedPath, aespassword, setPercentage);
  };

  const getEncryptPromise = () => {
    return Promise.reject(new Error('Not implemented'));
  };

  useEffect(() => {
    if (!isInProgress) {
      setInProgress(true);
      let promise: Promise<void>;

      switch (operation) {
        case AesCryptOperation.DECRYPT:
          promise = getDecryptPromise().then(onFinish);
          break;
        case AesCryptOperation.ENCRYPT:
          promise = getEncryptPromise().then(onFinish);
          break;
        default:
          promise = Promise.reject(new Error('Invalid AesCryptOperation'));
      }

      promise.then(onFinish).catch(setError);
    }
  }, [
    isInProgress,
    decryptedPath,
    onFinish,
    encryptedPath,
    aespassword,
    operation,
    getDecryptPromise,
    getEncryptPromise,
  ]);

  const renderError = () => {
    if (!error) return null;
    return <span>{JSON.stringify(error, null, 2)}</span>;
  };

  const renderStatus = () => {
    if (percentage < 100) {
      return <span>Removing tmp file...</span>;
    }

    return (
      <div>
        <span>Decrypting...</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
    );
  };

  return <span>{renderError() || renderStatus()}</span>;
};

export default AesCryptView;
