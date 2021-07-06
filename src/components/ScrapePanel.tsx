/* eslint-disable promise/always-return */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import HyperSquirrelClient from '../client/hypersquirrel';

import { ignoreEvent } from '../uiutils/eventUtils';
import Button from './Button';
import { File } from '../entity/File';

import './ScrapePanel.scss';
import CardView from './ScrapePanelCardView';

type ScrapePanelProps = {
  hsClient: HyperSquirrelClient;
  defaultUrl: string | null;
  files: File[];
  createFile: (file: File) => Promise<File>;
};

type Card = {
  file: File;
  status: string;
  error?: string;
};

const ScrapePanel = ({
  hsClient,
  defaultUrl,
  files,
  createFile,
}: ScrapePanelProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const urlRef = useRef(null);

  const [, setRerenderTimestamp] = useState<number>(0);
  const rerender = () => setRerenderTimestamp(Date.now());

  const existingFileIds = useMemo(() => files.map((f) => f.fileid), [files]);

  const scrape = (event = null) => {
    if (event) event.preventDefault();

    const urls = urlRef?.current.value.split(',');

    hsClient
      .scrapeAsync(...urls)
      .then((scrapedFiles) =>
        scrapedFiles
          .filter((file) => !existingFileIds.includes(file.fileid))
          .map(
            (file): Card => {
              return { file, status: 'idle' };
            }
          )
      )
      .then(setCards)
      .catch((error) => {
        alert(`Error: ${JSON.stringify(error)}`);
      });
  };

  useEffect(() => {
    if (defaultUrl && urlRef?.current && !urlRef?.current.value) {
      urlRef.current.value = defaultUrl;
      scrape();
    }
  });

  const scrapeUrl = (url: string) => {
    urlRef.current.value = url;
    scrape();
  };

  const createFileFromCard = (card: Card) =>
    createFile(card.file)
      .then(() => {
        card.status = 'complete';
      })
      .catch((error: Error) => {
        card.status = 'error';
        card.error = JSON.stringify(error);
      })
      .finally(rerender);

  const getInputBar = () => (
    <div className="input-bar">
      <form onSubmit={scrape}>
        <input required ref={urlRef} type="text" onKeyUp={ignoreEvent} />
        <Button type="submit">Scrape</Button>
      </form>
    </div>
  );

  const getGrid = () => {
    const cardViews = cards.map((card) => (
      <CardView
        key={card.file.fileid}
        card={card}
        onSend={createFileFromCard}
        onScrape={scrapeUrl}
      />
    ));
    return <div className="grid">{cardViews}</div>;
  };

  return (
    <div>
      {getInputBar()}
      {getGrid()}
    </div>
  );
};

export default ScrapePanel;
