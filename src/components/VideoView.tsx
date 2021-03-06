import React, { useRef } from 'react';
import screenfull from 'screenfull';
import './VideoView.scss';

const VideoView = ({ path }) => {
  const el = useRef(null);

  const onKeyUp = (event) => {
    if (event.key === 'f') {
      if (screenfull.isEnabled) {
        screenfull.toggle(el.current);
      }
    }
  };

  return (
    <video muted autoPlay loop controls ref={el} onKeyUp={onKeyUp} src={path} />
  );
};

export default VideoView;
