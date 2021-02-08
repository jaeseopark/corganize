import { unlink, readdirSync, lstatSync, rmdirSync } from 'fs';
import { glob } from 'glob';

import FileType from 'file-type';

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

const getDirectories = (src: string, callback) => {
  glob(`${src}/**/*`, callback);
};

export const listDirRecursively = (dir: string, includeFolders = false) => {
  return new Promise((resolve, reject) => {
    getDirectories(dir, (error, response) => {
      if (error) reject(error);
      resolve(
        response.filter(
          (path) => includeFolders || !lstatSync(path).isDirectory()
        )
      );
    });
  });
};

export const guessMimetypeAsync = (path) => {
  return FileType.fromFile(path)
    .then((result) => result?.mime)
    .then((mimetype) => {
      if (mimetype) return mimetype;
      throw {
        message: 'Could not detect the mime type',
        path
      };
    });
};
