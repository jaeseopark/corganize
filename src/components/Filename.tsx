import React from 'react';
import cls from 'classnames';
import { getMetadata } from '../uiutils/multimediaUtils';
import { toHumanDuration } from '../utils/numberUtils';
import { htmlDecode } from '../utils/stringUtils';

const renderMultimediaIcons = (width, height, duration, size) => {
  const { isVertical: vertical, resolution, bitrate } = getMetadata(
    width,
    height,
    duration,
    size
  );
  const ortCls = cls('icon', 'orientation', { vertical });

  return (
    <>
      <div className="tag duration">{toHumanDuration(duration)}</div>
      {resolution && <div className="tag resolution">{resolution}</div>}
      <div className="tag bitrate">{bitrate}</div>
      <div className={ortCls} />
    </>
  );
};

const maybeRenderMultimediaIcons = (file) => {
  const { multimedia, size } = file;
  if (multimedia) {
    const { width, height, duration } = multimedia;
    if (width && height && duration && size) {
      return renderMultimediaIcons(width, height, duration, size);
    }
  }
  return null;
};

const Filename = ({ row, value }) => {
  return (
    <>
      {maybeRenderMultimediaIcons(row.original)}
      <textarea
        className="filename"
        readOnly
        tabIndex="-1"
        value={htmlDecode(String(value))}
      />
    </>
  );
};

export default Filename;
