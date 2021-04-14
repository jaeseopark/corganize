/* eslint-disable import/prefer-default-export */
/* eslint-disable prefer-promise-reject-errors */
import { existsSync } from 'fs';
import CorganizeClient from '../client/corganize';
import { File } from '../entity/File';
import Library from '../entity/Library';
import { htmlDecode } from '../utils/stringUtils';

export const retrieveFilesAsync = (
  corganizeClient: CorganizeClient,
  library: Library,
  progressCallback: Function
) => {
  const {
    showDownloadableFilesOnly: sdfo,
    hideDownloadedFiles: hdf,
    view,
  } = library;

  const shouldKeep = (f: File) => {
    if (!sdfo && !hdf) return true;

    return (
      (!sdfo || f.storageservice !== 'None') &&
      (!hdf || !existsSync(f.encryptedPath))
    );
  };

  const decorateFile = (f: File) => {
    f.encryptedPath = library.getEncryptedPath(f.fileid);
    f.decryptedPath = library.getDecryptedPath(f.fileid);
    f.filename = htmlDecode(f.filename);
    return f;
  };

  const callbackWrapper = (files: File[]) => {
    const filteredAndDecorated = files.filter(shouldKeep).map(decorateFile);
    progressCallback(filteredAndDecorated);
  };

  switch (view) {
    case 'recent': {
      const limit = 20000;
      return corganizeClient.getRecentFilesWithPagination(
        callbackWrapper,
        limit
      );
    }
    case 'active': {
      return corganizeClient.getActiveFilesWithPagination(callbackWrapper);
    }
    case 'incomplete': {
      return corganizeClient.getIncompleteFilesWithPagination(callbackWrapper);
    }
    default: {
      const message = `Invalid view: ${view}`;
      return Promise.reject({ message });
    }
  }
};
