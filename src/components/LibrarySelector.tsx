import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import Library from '../entity/Library';

const LibrarySelector = ({ onLibraryChange }) => {
  const hiddenFileInput = useRef(null);
  const [selectedView, setSelectedView] = useState('active');
  const [downloadableChecked, setDownloadableChecked] = useState(true);

  const onViewDropdownChange = (event) => {
    setSelectedView(event.target.value);
  };

  const onCheckboxChange = () => {
    setDownloadableChecked(!downloadableChecked);
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
        lib.showDownloadableFilesOnly = downloadableChecked;
        onLibraryChange(lib);
      });
    }
  };

  // TODO: display recently used libraries instead of making the user select a file every time.
  return (
    <div className="library-selection">
      <h2>Choose a Library</h2>
      <div>
        <span className="view-selection-container">
          <select className="view-selection" onChange={onViewDropdownChange}>
            <option value="active">Active</option>
            <option value="recent">Recent</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </span>
        <span className="filter-downloadable-only">
          <input
            type="checkbox"
            defaultChecked={downloadableChecked}
            onChange={onCheckboxChange}
          />
          <span className="text">Show downloadable files only</span>
        </span>
      </div>
      <div className="button-container">
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
    </div>
  );
};

LibrarySelector.propTypes = {
  onLibraryChange: PropTypes.func.isRequired,
};

export default LibrarySelector;
