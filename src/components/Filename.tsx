import React from 'react';
import cls from 'classnames';
import { getMetadata } from '../uiutils/multimediaUtils';
import { toHumanDuration } from '../utils/numberUtils';
import { htmlDecode } from '../utils/stringUtils';
import { File } from '../entity/File';

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

const Filename = (file: File) => {
  const { multimedia, size, filename } = file;

  const maybeRenderMultimediaIcons = () => {
    if (multimedia && size) {
      const { width, height, duration } = multimedia;
      if (width && height && duration) {
        return renderMultimediaIcons(width, height, duration, size);
      }
    }
    return null;
  };

  const renderText = () => (
    <textarea
      className="filename"
      readOnly
      tabIndex="-1"
      value={htmlDecode(String(filename))}
    />
  );

  return (
    <div>
      {maybeRenderMultimediaIcons()}
      {renderText()}
    </div>
  );
};

export default Filename;
