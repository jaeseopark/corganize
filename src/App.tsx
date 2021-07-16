import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import classNames from 'classnames';
import MainView from './components/MainView';
import LibrarySelector from './components/LibrarySelector';
import Library from './entity/Library';

// See MainView.renderBuffer to understand how this variable is used.
const renderBuffer = { alertContent: null };

const Corganize = () => {
  const [library, setLibrary] = useState<Library | null>(null);
  const [alertContent, setAlertContent] = useState(null);

  useEffect(() => {}, [library]);

  let closeTimeoutId: number | null = null;

  const closeAlert = (shouldClearTimeout = false) => {
    if (shouldClearTimeout) {
      clearTimeout(closeTimeoutId);
    }
    setAlertContent(null);
    renderBuffer.alertContent = null;
  };

  const showAlert = (el, timeout = 2000) => {
    if (!renderBuffer.alertContent) {
      closeTimeoutId = setTimeout(closeAlert, timeout);
      setAlertContent(el);
      renderBuffer.alertContent = el;
    } else {
      // Try again in 0.1s
      setTimeout(() => showAlert(el, timeout), 100);
    }
  };

  const onLibraryChange = (lib: Library) => {
    ipcRenderer.send('changeLibraryConfig', lib.config);
    setLibrary(lib);
  };

  if (!library) {
    return <LibrarySelector onLibraryChange={onLibraryChange} />;
  }

  const alertClassName = classNames('alert', 'alert-light', {
    hidden: !alertContent,
  });

  return (
    <>
      <div
        className={alertClassName}
        role="alert"
        onClick={() => closeAlert(true)}
      >
        {alertContent}
      </div>
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
