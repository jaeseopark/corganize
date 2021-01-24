import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import MainView from './components/MainView';
import LibrarySelector from './components/LibrarySelector';

// See MainView.renderBuffer to understand how this variable is used.
const renderBuffer = { alertContent: null };

const Corganize = () => {
  const [library, setLibrary] = useState(null);
  const [alertContent, setAlertContent] = useState(null);

  useEffect(() => {}, [library]);

  const showAlert = (el, timeout = 2000) => {
    if (!renderBuffer.alertContent) {
      setTimeout(() => {
        setAlertContent(null);
        renderBuffer.alertContent = null;
      }, timeout);
      setAlertContent(el);
      renderBuffer.alertContent = el;
    } else {
      // Try again in 0.1s
      setTimeout(() => showAlert(el, timeout), 100);
    }
  };

  const onLibraryChange = (lib) => {
    ipcRenderer.send('changeLibraryConfig', lib.config);
    setLibrary(lib);
  };

  if (!library) {
    return <LibrarySelector onLibraryChange={onLibraryChange} />;
  }

  return (
    <>
      {alertContent && (
        <div className="alert alert-light" role="alert">
          {alertContent}
        </div>
      )}
      <MainView library={library} showAlert={showAlert} />
    </>
  );
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
