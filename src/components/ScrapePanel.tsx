/* eslint-disable promise/always-return */
import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import CorganizeClient from '../client/corganize';
import HyperSquirrelClient from '../client/hypersquirrel';

import './ScrapePanel.scss';
import { ignoreEvent } from '../uiutils/eventUtils';
import Button from './Button';
import { useUpdate } from 'react-use';

const FILENAME_LENGTH = 10;
const DEFAULT_STATUS = 'idle';

type ScrapePanelProps = {
  corganizeClient: CorganizeClient;
  hsClient: HyperSquirrelClient;
  defaultUrl: string | null;
};

const Card = ({ card, onSend, onScape }) => {
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
      <Button onClick={() => onScape(sourceurl)}>Scrape</Button>
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
}: ScrapePanelProps) => {
  const [cards, setCards] = useState([]);
  const urlRef = useRef(null);

  const rerender = useUpdate();

  const scrape = (event = null) => {
    if (event) event.preventDefault();

    const urls = urlRef?.current.value.split(',');

    hsClient
      .scrapeAsync(...urls)
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
          <Card card={card} onSend={createFile} onScape={scrapeUrl} />
        ))}
      </div>
    </div>
  );
};

export default ScrapePanel;
