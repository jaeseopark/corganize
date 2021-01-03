/* eslint-disable import/prefer-default-export */
// import { Encrypt } from 'node-aescrypt';

// import { createReadStream, createWriteStream } from 'fs';

export async function decryptAes256Cbc(streamIn, streamOut, password: string) {
  // const through = new Encrypt(password);

  return new Promise((resolve, reject) => {
    streamIn
      // .pipe(through)
      .pipe(streamOut)
      .on('error', (error) => reject(error))
      .on('finish', () => resolve(streamOut));
  });
}
