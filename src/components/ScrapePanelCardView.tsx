import React from 'react';
import classnames from 'classnames';
import Button from './Button';
import { File } from '../entity/File';

const FILENAME_LENGTH = 10;

export type Card = {
  file: File;
  status: string;
  error?: string;
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

export default CardView;
