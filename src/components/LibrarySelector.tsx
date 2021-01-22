import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import Library from '../library';

const LibrarySelector = ({ onLibraryChange }) => {
  const hiddenFileInput = useRef(null);
  const [selectedView, setSelectedView] = useState('active');

  const onViewDropdownChange = (event) => {
    setSelectedView(event.target.value);
  };

  const onChangeFile = (event) => {
    const path = event?.target?.files[0].path;
    if (path) {
      fs.readFile(path, (error, data) => {
        if (error) {
          throw error;
        }

        const lib = new Library(JSON.parse(data));
        lib.view = selectedView;
        onLibraryChange(lib);
      });
    }
  };

  // TODO: display recently used libraries instead of making the user select a file every time.
  return (
    <div className="library-selection">
      <h2>Choose a Library</h2>
      <div className="view-selection-container">
        <select className="view-selection" onChange={onViewDropdownChange}>
          <option value="active">Active</option>
          <option value="recent">Recent</option>
          <option value="incomplete">Incomplete</option>
        </select>
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          hiddenFileInput.current.click();
        }}
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
