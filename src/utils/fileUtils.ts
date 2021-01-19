/* eslint-disable import/prefer-default-export */
import { unlink, readdirSync, lstatSync, rmdirSync } from 'fs';

const path = require('path');

export const purgeDecryptedFiles = (dir: string) => {
  const filenames = readdirSync(dir).filter((f) => !f.endsWith('.aes'));
  return Promise.allSettled(
    filenames.map((filename) => {
      const fullPath = path.join(dir, filename);
      return new Promise((resolve, reject) => {
        if (lstatSync(fullPath).isDirectory()) {
          rmdirSync(fullPath, { recursive: true });
          resolve(filename);
        } else {
          unlink(fullPath, (error) => {
            if (error) reject(error);
            resolve(filename);
          });
        }
      });
    })
  );
};
