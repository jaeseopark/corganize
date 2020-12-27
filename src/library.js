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
  corganizeClient: PropTypes.shape(CorganizeClient).isRequired,
};

export default Library;
