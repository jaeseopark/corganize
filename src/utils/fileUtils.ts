import { unlink, readdirSync } from 'fs';

const path = require('path');

const SUPPORTED_IN_APP_FILE_TYPE = ['mp4'];

export const getExtnameWithoutDotOrDefault = (
  filename: string,
  defaultExtname: string
) => {
  const ext = (path.extname(filename) || '').replace('.', '');
  if (!SUPPORTED_IN_APP_FILE_TYPE.includes(ext)) {
    return defaultExtname;
  }
  return ext;
};

export const isSupportedInAppFileType = (ext: string) => {
  return SUPPORTED_IN_APP_FILE_TYPE.includes(ext);
};

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
