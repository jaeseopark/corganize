/* eslint-disable promise/always-return */
import React, { useEffect, useRef, useState } from 'react';
import CorganizeClient from '../client/corganize';
import HyperSquirrelClient from '../client/hypersquirrel';
import classnames from 'classnames';

import './ScrapePanel.scss';
import { ignoreEvent } from '../uiutils/eventUtils';
import Button, { SuccessButton } from './Button';

const DEFAULT_STATUS = 'idle';

type ScrapePanelProps = {
  corganizeClient: CorganizeClient;
  hsClient: HyperSquirrelClient;
  defaultUrl: string | null;
};

const Card = ({ card, onSend, onScape }) => {
  const { file, status, error } = card;
  const { sourceurl, thumbnailurl } = file;

  const isComplete = status === 'complete';
  const onSendCard = () => {
    if (!isComplete) onSend(card);
  };

  return (
    <div className="card">
      <img
        className={classnames('thumbnail', { clickable: !isComplete })}
        src={thumbnailurl || 'not.found.jpg'}
        onClick={onSendCard}
      />
      <Button onClick={() => onScape(sourceurl)}>Scrape</Button>
      {isComplete && <SuccessButton disabled>Sent</SuccessButton>}
      {error && <span className="error">{error}</span>}
    </div>
  );
};

const ScrapePanel = ({
  corganizeClient,
  hsClient,
  defaultUrl,
}: ScrapePanelProps) => {
  const [cards, setCards] = useState([]);
  const urlRef = useRef(null);

  const [, setRerenderTimestamp] = useState(null);
  const rerender = () => setRerenderTimestamp(Date.now());

  const scrape = (event = null) => {
    if (event) event.preventDefault();

    hsClient
      .scrapeAsync(urlRef?.current.value)
      .then((files) =>
        files.map((file) => {
          return { file, status: DEFAULT_STATUS };
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

  const scrapeUrl = (url) => {
    urlRef.current.value = url;
    scrape();
  };

  const createFile = (card) =>
    corganizeClient
      .createFile(card.file)
      .then(() => {
        card.status = 'complete';
      })
      .catch((error) => {
        card.status = 'error';
        card.error = JSON.stringify({ ...error, fileid: card.file.fileid });
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
          <Card card={card} onSend={createFile} onScape={scrapeUrl} />
        ))}
      </div>
    </div>
  );
};

export default ScrapePanel;
