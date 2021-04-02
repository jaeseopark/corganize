import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import CorganizeClient from '../client/corganize';
import HyperSquirrelClient from '../client/hypersquirrel';
import { File } from '../entity/File';

import './ScrapePanel.scss';
import { randomIntFromInterval } from '../utils/numberUtils';
import { ignoreEvent } from '../uiutils/eventUtils';
import Button from './Button';

type ScrapePanelProps = {
  corganizeClient: CorganizeClient;
  hsClient: HyperSquirrelClient;
};

const ScrapePanel = ({ corganizeClient, hsClient }: ScrapePanelProps) => {
  const Row = ({ file }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
      if (!isSubmitted && !isComplete) {
        setTimeout(() => {
          Promise.resolve()
            .then(() => setIsSubmitted(true))
            .then(() => corganizeClient.createFile(file, true))
            .then(() => setIsComplete(true));
        }, randomIntFromInterval(1, 5000));
      }
    });

    const { fileid, filename, sourceurl } = file;

    const getStatus = () => {
      if (isComplete) return 'complete';
      if (isSubmitted) return 'submitted';
      return 'pending';
    };

    return (
      <tr>
        <td className={classNames('icon', getStatus())} />
        <td>{fileid}</td>
        <td>{filename}</td>
        <td>{sourceurl}</td>
      </tr>
    );
  };

  const [scrapedFiles, setScrapedFiles] = useState<File[] | null>(null);
  const urlRef = useRef(null);

  const scrape = (event) => {
    event.preventDefault();
    hsClient.scrapeAsync(urlRef?.current.value).then(setScrapedFiles);
  };

  const table = scrapedFiles && (
    <table className="files">
      <tbody>
        {scrapedFiles.map((f: File) => (
          <Row file={f} />
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
        </form>
      </div>
      {table}
    </div>
  );
};

export default ScrapePanel;
