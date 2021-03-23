import { CorganizeClientProps } from './props';

const fs = require('fs');
const path = require('path');

type LibraryConfig = {
  server: CorganizeClientProps;
  storageservice: {
    gdrive: {
      creds: {
        path: string;
      };
    };
  };
  local: {
    path: string;
    tmpPath?: string;
  };
};

const getPath = (parent: string, fileid: string, ext: string) => {
  const fileidNew = fileid.replace('/', 'slash');
  return path.join(parent, `${fileidNew}.${ext}`);
};

class Library {
  config: LibraryConfig;

  view: string | null;

  showDownloadableFilesOnly: boolean | null;

  hideDownloadedFiles: boolean | null;

  constructor(config: LibraryConfig) {
    this.config = config;
    this.view = null;
    this.showDownloadableFilesOnly = null;
    this.hideDownloadedFiles = null;

    if (!fs.existsSync(config.local.path)) {
      fs.mkdirSync(config.local.path);
    }
  }

  getEncryptedPath(fileid: string) {
    return getPath(this.config.local.path, fileid, 'aes');
  }

  getTmpPath() {
    return this.config.local.tmpPath || this.config.local.path;
  }

  getDecryptedPath(fileid: string) {
    return getPath(this.getTmpPath(), fileid, 'dec');
  }

  getDownloadPath(fileid: string) {
    return getPath(this.getTmpPath(), fileid, 'download');
  }
}

export default Library;
