import React from 'react';
import { File } from '../entity/File';

type FavButtonProps = {
  file: File;
  toggleFav: (file: File) => void;
};

const FavButton = ({ file, toggleFav }: FavButtonProps) => {
  const onClick = () => {
    toggleFav(file);
  };

  const { dateactivated } = file;
  const classNames = `${String(!!dateactivated)} icon`;

  return <div onClick={onClick} className={classNames} />;
};

export default FavButton;
