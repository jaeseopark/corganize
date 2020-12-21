import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Library from './library';
import TableView from './components/TableView';

const fs = require('fs');

const Corganize = () => {
  const [library, setLibrary] = useState(null);

  const hiddenFileInput = React.useRef(null);

  useEffect(() => {}, [library]);

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

        setLibrary(new Library(JSON.parse(data)));
      });
    }
  };

  if (!library) {
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
  }

  const tableView = <TableView library={library} />;
  return tableView;
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Corganize} />
      </Switch>
    </Router>
  );
}
