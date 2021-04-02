import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import Library from '../entity/Library';
import Button from './Button';

const LibrarySelector = ({ onLibraryChange }) => {
  const hiddenFileInput = useRef(null);
  const [selectedView, setSelectedView] = useState('active');
  const [downloadableChecked, setDownloadableChecked] = useState(true);
  const [hideDownloadedChecked, setHideDownloadedChecked] = useState(false);

  const onViewDropdownChange = (event) => {
    setSelectedView(event.target.value);
  };

  const onChangeDownloadable = () => {
    setDownloadableChecked(!downloadableChecked);
  };

  const onChangeHideDownloaded = () => {
    setHideDownloadedChecked(!hideDownloadedChecked);
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
        lib.hideDownloadedFiles = hideDownloadedChecked;
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
        <span className="filter">
          <input
            type="checkbox"
            defaultChecked={downloadableChecked}
            onChange={onChangeDownloadable}
          />
          <span className="text">Show downloadable files only</span>
        </span>
        <span className="filter">
          <input
            type="checkbox"
            defaultChecked={hideDownloadedChecked}
            onChange={onChangeHideDownloaded}
          />
          <span className="text">Hide downloaded files</span>
        </span>
      </div>
      <div className="button-container">
        <Button
          onClick={() => {
            hiddenFileInput.current.click();
          }}
        >
          Choose File
        </Button>
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
