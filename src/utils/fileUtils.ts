import { unlink, readdirSync } from 'fs';

const path = require('path');

export const purgeDecryptedFiles = (dir: string) => {
  const filenames = readdirSync(dir).filter((f) => !f.endsWith('.aes'));
  return Promise.allSettled(
    filenames.map((filename) => {
      const fullPath = path.join(dir, filename);
      return new Promise((resolve, reject) => {
        unlink(fullPath, (error) => {
          if (error) reject(error);
          resolve(filename);
        });
      });
    })
  );
};
