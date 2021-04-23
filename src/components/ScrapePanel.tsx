/* eslint-disable promise/always-return */
import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { ipcRenderer } from 'electron';
import CorganizeClient from '../client/corganize';
import HyperSquirrelClient from '../client/hypersquirrel';

import './ScrapePanel.scss';
import { ignoreEvent } from '../uiutils/eventUtils';
import Button from './Button';

const DEFAULT_STATUS = 'idle';

type ScrapePanelProps = {
  corganizeClient: CorganizeClient;
  hsClient: HyperSquirrelClient;
};

const Row = ({ row, onSend }) => {
  const { file, status, error } = row;
  const { filename, thumbnailurl } = file;

  const shouldShowSend = status !== 'complete';

  return (
    <tr>
      <td className={classNames('icon', status)} />
      <td className="thumbnail">
        {thumbnailurl && <img className="thumbnail" src={thumbnailurl} />}
      </td>
      <td className="send">
        {shouldShowSend && <Button onClick={() => onSend(row)}>Send</Button>}
      </td>
      <td className="filename">{filename}</td>
      <td className="error-or-status">{error || status}</td>
    </tr>
  );
};

const ScrapePanel = ({ corganizeClient, hsClient }: ScrapePanelProps) => {
  const [rows, setRows] = useState([]);
  const urlRef = useRef(null);
  const [, setRerenderTimestamp] = useState(null);

  const rerender = () => setRerenderTimestamp(Date.now());

  const getUrlFromSecondWindow = () => {
    ipcRenderer.invoke('getUrl').then((url) => {
      if (urlRef?.current) urlRef.current.value = url;
    });
  };

  const createFile = (row: RowData) =>
    corganizeClient
      .createFile(row.file)
      .then(() => {
        row.status = 'complete';
      })
      .catch((error) => {
        row.status = 'error';
        row.error = JSON.stringify(error);
      })
      .finally(() => {
        rerender();
      });

  const scrape = (event) => {
    event.preventDefault();
    hsClient
      .scrapeAsync(urlRef?.current.value)
      .then((files) =>
        files.map((file) => {
          return { file, status: DEFAULT_STATUS };
        })
      )
      .then(setRows)
      .catch((error) => {
        alert(`Error: ${JSON.stringify(error)}`);
      });
  };

  const table = rows && (
    <table className="files">
      <tbody>
        {rows.map((row) => (
          <Row row={row} onSend={createFile} />
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="input-bar">
        <form onSubmit={scrape}>
          <input required ref={urlRef} type="text" onKeyUp={ignoreEvent} />
          <Button type="submit">Scrape</Button>
          <Button onClick={getUrlFromSecondWindow}>
            Get from the second window
          </Button>
        </form>
      </div>
      {table}
    </div>
  );
};

export default ScrapePanel;
