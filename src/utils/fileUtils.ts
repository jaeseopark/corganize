import { unlink, readdirSync, lstatSync, rmdirSync, existsSync, mkdirSync, copyFile } from 'fs';
import { glob } from 'glob';

import FileType from 'file-type';

const path = require('path');

export const MIMETYPE_DETECTION_ERROR = {
  message: 'Could not detect the mime type',
};

export const deleteAllAsync = (
  paths: string[],
  parentDir: string | null = null
) =>
  Promise.allSettled(
    paths.map((filename) => {
      const fullPath = parentDir ? path.join(parentDir, filename) : filename;
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

export const removeTmpFiles = (dir: string) => {
  const filenames = readdirSync(dir).filter((f) => !f.endsWith('.aes'));
  return deleteAllAsync(filenames, dir);
};

export const listDirAsync = (
  dir: string,
  recursively: boolean,
  includeFolders = false
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    glob(recursively ? `${dir}/**/*` : `${dir}/*`, (error, response) => {
      if (error) reject(error);
      resolve(
        response
          .filter((p) => includeFolders || !lstatSync(p).isDirectory())
          .map((p) => path.resolve(p))
      );
    });
  });
};

export const guessMimetypeAsync = (filepath: string) => {
  return FileType.fromFile(filepath)
    .then((result) => result?.mime)
    .then((mimetype) => {
      if (mimetype) return mimetype;
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw MIMETYPE_DETECTION_ERROR;
    });
};

export const createParentPath = (filepath: string) => {
  const parentPath = path.dirname(filepath);
  if (!existsSync(parentPath)) {
    mkdirSync(parentPath);
  }
};

export const moveFileAsync = (srcPath: string, destPath: string) => {
  return new Promise((resolve, reject) => {
    copyFile(srcPath, destPath, (err, _data) => {
      if (err) reject(err);
      unlink(srcPath, (innerErr, _data) => {
        if (innerErr) reject(innerErr);
        resolve(destPath);
      });
    });
  });
};
