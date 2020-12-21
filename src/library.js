import PropTypes from 'prop-types';
import CorganizeClient from './client/corganize';

class Library {
  constructor(config) {
    this.config = config;
    this.corganizeClient = new CorganizeClient(config.server);
  }
}

Library.propTypes = {
  corganizeClient: PropTypes.shape(CorganizeClient).isRequired,
};

export default Library;
