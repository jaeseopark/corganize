import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useUpdate } from 'react-use';
import HyperSquirrelClient from '../client/hypersquirrel';

import { ignoreEvent } from '../uiutils/eventUtils';
import { File } from '../entity/File';
import Button from './Button';

import './ScrapePanel.scss';
import CardView, { Card } from './ScrapePanelCardView';

type ScrapePanelProps = {
  hsClient: HyperSquirrelClient;
  defaultUrl: string | null;
  files: File[];
  createFile: (file: File) => Promise<File>;
};

const fileToCard = (file: File) => {
  return { file, status: 'idle' };
};

const ScrapePanel = ({
  hsClient,
  defaultUrl,
  files,
  createFile,
}: ScrapePanelProps) => {
  const [isScraping, setScraping] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const urlRef = useRef(null);

  const rerender = useUpdate();

  const existingFileIds = useMemo(() => files.map((f) => f.fileid), [files]);

  const scrape = (event = null) => {
    if (event) event.preventDefault();

    if (isScraping) return;

    setScraping(true);

    const urls = urlRef?.current.value.split(',');

    // eslint-disable-next-line promise/catch-or-return
    hsClient
      .scrapeAsync(...urls)
      .then((scrapedFiles) =>
        scrapedFiles
          .filter((file) => !existingFileIds.includes(file.fileid))
          .map(fileToCard)
      )
      .then(setCards)
      .catch(setError)
      .finally(() => setScraping(false));
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
      // eslint-disable-next-line promise/always-return
      .then(() => {
        card.status = 'complete';
      })
      .catch((e: Error) => {
        card.status = 'error';
        card.error = JSON.stringify(e);
      })
      .finally(rerender);

  const getInputBar = () => (
    <div className="input-bar">
      <form onSubmit={scrape}>
        <input
          required
          ref={urlRef}
          type="text"
          onKeyUp={ignoreEvent}
          disabled={isScraping}
        />
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

  if (error) {
    return <pre>{JSON.stringify(error)}</pre>;
  }

  return (
    <div className="scrape-panel">
      {getInputBar()}
      {getGrid()}
    </div>
  );
};

export default ScrapePanel;
