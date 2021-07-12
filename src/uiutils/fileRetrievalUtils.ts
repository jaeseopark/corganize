import CorganizeClient from '../client/corganize';
import { File } from '../entity/File';
import Library from '../entity/Library';
import { htmlDecode } from '../utils/stringUtils';

const retrieveFilesAsync = (
  corganizeClient: CorganizeClient,
  library: Library,
  progressCallback: Function,
  localFiles: string[]
) => {
  const decorateFile = (f: File) => {
    f.encryptedPath = library.getEncryptedPath(f.fileid);
    f.decryptedPath = library.getDecryptedPath(f.fileid);
    f.filename = htmlDecode(f.filename);
    return f;
  };

  // TODO: convert this to a filter in React Table
  const shouldKeep = (f: File) =>
    (!library.showDownloadableFilesOnly || f.storageservice !== 'None') &&
    (!library.hideDownloadedFiles || !localFiles.includes(f.encryptedPath));

  const callbackWrapper = (files: File[]) => {
    let retFiles = files.map(decorateFile);
    if (library.showDownloadableFilesOnly || library.hideDownloadedFiles) {
      retFiles = retFiles.filter(shouldKeep);
    }

    progressCallback(retFiles);
  };

  switch (library.view) {
    case 'recent': {
      const limit = 20000;
      return corganizeClient.getRecentFiles(callbackWrapper, limit);
    }
    case 'active': {
      return corganizeClient.getActiveFiles(callbackWrapper);
    }
    case 'incomplete': {
      return corganizeClient.getIncompleteFiles(callbackWrapper);
    }
    default: {
      const error = new Error(`Invalid view: ${library.view}`);
      return Promise.reject(error);
    }
  }
};

export default retrieveFilesAsync;
