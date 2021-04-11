/* eslint-disable promise/always-return */
import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { ipcRenderer } from 'electron';
import CorganizeClient from '../client/corganize';
import HyperSquirrelClient from '../client/hypersquirrel';

import './ScrapePanel.scss';
import { ignoreEvent } from '../uiutils/eventUtils';
import Button from './Button';
import { File } from '../entity/File';

const DEFAULT_STATUS = 'pending';

type ScrapePanelProps = {
  corganizeClient: CorganizeClient;
  hsClient: HyperSquirrelClient;
};

type RowData = {
  file: File;
  status: string;
  error?: string;
};

const ScrapePanel = ({ corganizeClient, hsClient }: ScrapePanelProps) => {
  const Row = ({ file, status, error }: RowData) => {
    const { fileid, filename, sourceurl } = file;

    return (
      <tr>
        <td className={classNames('icon', status)} />
        <td>{fileid}</td>
        <td>{filename}</td>
        <td>{sourceurl}</td>
        <td>{error}</td>
      </tr>
    );
  };

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
    new Promise((resolve) => {
      // eslint-disable-next-line promise/catch-or-return
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
          resolve(null);
        });
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
      .then((newRows) => {
        rows.length = 0; // clear the exisitng rows;
        newRows.forEach((row) => {
          rows.push(row);
          createFile(row);
        });
      });
  };

  const table = rows && (
    <table className="files">
      <tbody>
        {rows.map((rowData) => (
          <Row {...rowData} />
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
