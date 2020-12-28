import PropTypes from 'prop-types';

class Library {
  constructor(config) {
    this.config = config;
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
