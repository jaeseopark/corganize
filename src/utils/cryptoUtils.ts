/* eslint-disable import/prefer-default-export */
import { Decrypt } from 'node-aescrypt';

export async function decryptAes256Cbc(
  streamIn,
  streamOut,
  password: string,
  progressCallback: Function = null
) {
  return new Promise((resolve, reject) => {
    const through = new Decrypt(password);
    let decryptedBytes = 0;

    streamIn.on('data', (d) => {
      if (progressCallback) {
        decryptedBytes += d.length;
        progressCallback({
          decryptedBytes,
        });
      }
    });

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
