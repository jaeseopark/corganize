/* eslint-disable import/prefer-default-export */
import {
  createReadStream,
  createWriteStream,
  ReadStream,
  WriteStream,
} from 'fs';
import { Decrypt } from 'node-aescrypt';
import {
  createParentPath,
  getFileSizeInBytes,
  moveFileAsync,
} from './fileUtils';

const ProgressStream = require('progress-stream');

function decryptAes256Cbc(
  streamIn: ReadStream,
  streamOut: WriteStream,
  password: string,
  progressStream = null
) {
  return new Promise((resolve, reject) => {
    const through = new Decrypt(password);
    streamIn
      .pipe(through)
      .pipe(progressStream)
      .pipe(streamOut)
      .on('error', reject)
      .on('finish', resolve);
  });
}

export const decrypt = (
  encryptedPath: string,
  decryptedPath: string,
  aespassword: string,
  percentageCallback: Function
) => {
  const tmpDecryptedPath = `${decryptedPath}.tmp`;
  createParentPath(decryptedPath);
  createParentPath(tmpDecryptedPath);

  const ps = ProgressStream({
    length: getFileSizeInBytes(encryptedPath),
    time: 100,
  });

  ps.on('progress', ({ percentage }: { percentage: number }) => {
    percentageCallback(percentage);
  });

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
