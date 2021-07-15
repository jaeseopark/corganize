/* eslint-disable promise/always-return */
import { createReadStream, createWriteStream } from 'fs';
import { Decrypt, Encrypt } from 'node-aescrypt';
import {
  createParentPath,
  getFileSizeInBytes,
  moveFileAsync,
} from './fsUtils';

const ProgressStream = require('progress-stream');

export enum AesCryptOperation {
  ENCRYPT,
  DECRYPT,
}

const getThroughStream = (
  aespassword: string,
  cryptType: AesCryptOperation
) => {
  switch (cryptType) {
    case AesCryptOperation.ENCRYPT:
      return new Encrypt(aespassword);
    case AesCryptOperation.DECRYPT:
      return new Decrypt(aespassword);
    default:
      throw new Error('Unknown crypt type');
  }
};

const execute = (
  cryptType: AesCryptOperation,
  pathIn: string,
  pathOut: string,
  aespassword: string,
  percentageCallback: (percentage: number) => void
): Promise<string> => {
  const tmpPath = `${pathOut}.tmp`;
  createParentPath(pathOut);
  createParentPath(tmpPath);

  const ps = ProgressStream({
    length: getFileSizeInBytes(pathIn),
    time: 100,
  });

  ps.on('progress', ({ percentage }: { percentage: number }) => {
    percentageCallback(percentage);
  });

  const streamIn = createReadStream(pathIn);
  const streamOut = createWriteStream(tmpPath);
  const through = getThroughStream(aespassword, cryptType);

  return new Promise((resolve, reject) => {
    streamIn
      .pipe(through)
      .pipe(ps)
      .pipe(streamOut)
      .on('error', reject)
      .on('finish', resolve);
  }).then(() => {
    streamIn.close();
    streamOut.close();
    return moveFileAsync(tmpPath, pathOut);
  });
};

export const decrypt = (...args) => execute(AesCryptOperation.DECRYPT, ...args);

export const encrypt = (...args) => execute(AesCryptOperation.ENCRYPT, ...args);
