import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import MainView from './components/MainView';
import LibrarySelector from './components/LibrarySelector';

const Corganize = () => {
  const [library, setLibrary] = useState(null);

  useEffect(() => {}, [library]);

  const onLibraryChange = (lib) => {
    ipcRenderer.send('changeLibraryConfig', lib.config);
    setLibrary(lib);
  };

  if (!library) {
    return <LibrarySelector onLibraryChange={onLibraryChange} />;
  }

  return <MainView library={library} />;
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
