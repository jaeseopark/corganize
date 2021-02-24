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
  };
};

class Library {
  config: LibraryConfig;

  view: string | null;

  showDownloadableFilesOnly: boolean | null;

  constructor(config: LibraryConfig) {
    this.config = config;
    this.view = null;
    this.showDownloadableFilesOnly = null;

    if (!fs.existsSync(config.local.path)) {
      fs.mkdirSync(config.local.path);
    }
  }

  getEncryptedPath(fileid: string) {
    const fileidNew = fileid.replace('/', 'slash');
    return path.join(this.config.local.path, `${fileidNew}.aes`);
  }
}

export default Library;
