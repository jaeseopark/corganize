import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import fs from 'fs';
import Library from '../library';
import GdriveClient from '../client/gdrive';
import Button from './Button';

const LibrarySelector = ({ onLibraryChange }) => {
  const hiddenFileInput = useRef(null);
  const authCodeTextarea = useRef(null);
  const [library, setLibrary] = useState(null);
  const [gdriveClient, setGdriveClient] = useState(null);

  const onChangeFile = (event) => {
    const path = event?.target?.files[0].path;
    if (path) {
      fs.readFile(path, (error, data) => {
        if (error) {
          throw error;
        }

        const lib = new Library(JSON.parse(data));
        const gdc = new GdriveClient(lib.config.storageservice.gdrive);
        lib.gdriveClient = gdc;

        if (!gdc.doesTokenExist()) {
          setLibrary(lib);
          setGdriveClient(gdc);
          return;
        }

        onLibraryChange(lib);
      });
    }
  };

  if (library && gdriveClient) {
    // TODO handle oauth behind the scenes
    const authUrl = gdriveClient.getAuthUrl();
    return (
      <div className="google-oauth">
        <div>
          Corganize uses Google Drive to host the files.{' '}
          <a href={authUrl} target="_blank" rel="noreferrer">
            Log in
          </a>{' '}
          to Google and paste the Authentication Code below:
        </div>
        <div>
          <textarea
            ref={authCodeTextarea}
            placeholder="Paste the Authentication Code here..."
          />
        </div>
        <Button
          onClick={() => {
            const authCode = authCodeTextarea.current.value;
            gdriveClient.saveAuthCode(authCode);
            onLibraryChange(library);
          }}
        >
          OK
        </Button>
      </div>
    );
  }

  // TODO: display recently used libraries instead of making the user select a file every time.
  return (
    <div className="library-selection">
      <h2>Choose a Library</h2>
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
