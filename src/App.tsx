import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import TableView from './components/TableView';
import LibrarySelector from './components/LibrarySelector';

const Corganize = () => {
  const [library, setLibrary] = useState(null);

  useEffect(() => {}, [library]);

  const onLibraryChange = (library) => {
    ipcRenderer.send('changeLibraryConfig', library.config);
    setLibrary(library);
  };

  if (!library) {
    return <LibrarySelector onLibraryChange={onLibraryChange} />;
  }

  return <TableView library={library} />;
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
