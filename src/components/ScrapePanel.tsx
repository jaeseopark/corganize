/* eslint-disable promise/always-return */
import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import CorganizeClient from '../client/corganize';
import HyperSquirrelClient from '../client/hypersquirrel';

import './ScrapePanel.scss';
import { ignoreEvent } from '../uiutils/eventUtils';
import Button from './Button';
import { File } from '../entity/File';

const FILENAME_LENGTH = 10;

type ScrapePanelProps = {
  corganizeClient: CorganizeClient;
  hsClient: HyperSquirrelClient;
  defaultUrl: string | null;
  existingFileIds: string[];
};

type Card = {
  file: File;
  status: string;
  error: Error;
};

type CardViewProps = {
  card: Card;
  onSend: (card: Card) => void;
  onScrape: (url: string) => void;
};

const CardView = ({ card, onSend, onScrape }: CardViewProps) => {
  const { file, status, error } = card;
  const { sourceurl, thumbnailurl, filename, fileid } = file;

  const title = `${fileid}: ${filename.substring(0, FILENAME_LENGTH)}`;
  const complete = status === 'complete';
  const clickable = status === 'idle';
  const onSendCard = () => {
    if (clickable) onSend(card);
  };

  return (
    <div className="card">
      <img
        className={classnames('thumbnail', { clickable })}
        src={thumbnailurl || 'not.found.jpg'}
        onClick={onSendCard}
      />
      <Button onClick={() => onScrape(sourceurl)}>Scrape</Button>
      <span className={classnames('caption', { error, complete })}>
        {error || title}
      </span>
    </div>
  );
};

const ScrapePanel = ({
  corganizeClient,
  hsClient,
  defaultUrl,
  existingFileIds,
}: ScrapePanelProps) => {
  const [cards, setCards] = useState<Card[]>([]);
  const urlRef = useRef(null);

  const [, setRerenderTimestamp] = useState<number>(0);
  const rerender = () => setRerenderTimestamp(Date.now());

  const scrape = (event = null) => {
    if (event) event.preventDefault();

    const urls = urlRef?.current.value.split(',');

    hsClient
      .scrapeAsync(...urls)
      .then((files) =>
        files
          .filter((file) => !existingFileIds.includes(file.fileid))
          .map((file) => {
            return { file, status: 'idle' };
          })
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

  const createFile = (card: Card) =>
    corganizeClient
      .createFile(card.file)
      .then(() => {
        card.status = 'complete';
      })
      .catch((error) => {
        card.status = 'error';
        card.error = JSON.stringify(error);
      })
      .finally(() => {
        rerender();
      });

  return (
    <div>
      <div className="input-bar">
        <form onSubmit={scrape}>
          <input required ref={urlRef} type="text" onKeyUp={ignoreEvent} />
          <Button type="submit">Scrape</Button>
        </form>
      </div>
      <div className="grid">
        {cards.map((card) => (
          <CardView
            key={card.file.fileid}
            card={card}
            onSend={createFile}
            onScrape={scrapeUrl}
          />
        ))}
      </div>
    </div>
  );
};

export default ScrapePanel;
