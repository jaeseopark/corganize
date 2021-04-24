/* eslint-disable import/prefer-default-export */
import { ReadStream, WriteStream } from 'fs';
import { Decrypt } from 'node-aescrypt';

export async function decryptAes256Cbc(
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
