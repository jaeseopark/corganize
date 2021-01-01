import PropTypes from 'prop-types';

const fs = require('fs');
const path = require('path');

class Library {
  constructor(config) {
    this.config = config;
    this.gdriveClient = null;

    if (!fs.existsSync(config.local.path)) {
      fs.mkdirSync(config.local.path);
    }
  }

  getEncryptedPath(fileId) {
    return path.join(this.config.local.path, `${fileId}.enc`);
  }
}

Library.propTypes = {
  config: PropTypes.shape({
    server: PropTypes.shape({
      host: PropTypes.string,
      adpikey: PropTypes.string,
    }),
    storageservice: PropTypes.shape({
      gdrive: PropTypes.shape({
        creds: PropTypes.shape({
          path: PropTypes.string,
        }),
      }),
    }),
    local: PropTypes.shape({
      path: PropTypes.string,
    }),
  }).isRequired,
};

export default Library;
