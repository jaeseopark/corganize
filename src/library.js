import PropTypes from 'prop-types';
import CorganizeClient from './client/corganize';

class Library {
  constructor(config) {
    this.config = config;
    this.corganizeClient = new CorganizeClient(config.server);
    this.downloadQueue = [];
  }

  downloadFile(file) {
    this.downloadQueue.push(file);
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
  }).isRequired,
};

export default Library;
