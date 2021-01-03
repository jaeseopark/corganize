/* eslint-disable import/prefer-default-export */
import { Decrypt } from 'node-aescrypt';

export async function decryptAes256Cbc(streamIn, streamOut, password: string) {
  return new Promise((resolve, reject) => {
    const through = new Decrypt(password);
    streamIn
      .pipe(through)
      .pipe(streamOut)
      .on('error', (error) => {
        throw error;
      })
      .on('finish', () => {
        resolve(null);
      });
  });
}
