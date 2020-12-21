import React from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import Library from '../library';

import './LibrarySelector.scss';

const LibrarySelector = ({ onLibraryChange }) => {
  const hiddenFileInput = React.useRef(null);

  const handleBrowseClick = () => {
    hiddenFileInput.current.click();
  };

  const onChangeFile = (event) => {
    const path = event?.target?.files[0].path;
    if (path) {
      fs.readFile(path, (error, data) => {
        if (error) {
          throw error;
        }

        onLibraryChange(new Library(JSON.parse(data)));
      });
    }
  };

  // TODO: display recently used libraries instead of making the user select a file every time.
  return (
    <div className="library-selection">
      <h2>Choose a Library</h2>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleBrowseClick}
      >
        Choose File
      </button>
      <input
        type="file"
        ref={hiddenFileInput}
        onChange={onChangeFile}
        style={{ display: 'none' }}
      />
    </div>
  );
};

LibrarySelector.propTypes = {
  onLibraryChange: PropTypes.func.isRequired,
};

export default LibrarySelector;
