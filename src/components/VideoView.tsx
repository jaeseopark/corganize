import React, { useRef } from 'react';
import screenfull from 'screenfull';
import './VideoView.scss';

const TIME_HOTKEY_MAP = {
  z: -60,
  x: -15,
  c: 15,
  v: 60,
};

const isHotkey = (key: string) => Object.keys(TIME_HOTKEY_MAP).includes(key);

const VideoView = ({ path }) => {
  const el = useRef(null);

  const jumpTime = (deltaInSeconds) => {
    el.current.currentTime += deltaInSeconds;
  };

  const onKeyUp = (event) => {
    if (event.key === 'f') {
      if (screenfull.isEnabled) {
        screenfull.toggle(el.current);
      }
    } else if (isHotkey(event.key)) {
      jumpTime(TIME_HOTKEY_MAP[event.key]);
    }
  };

  return (
    <video muted autoPlay loop controls ref={el} onKeyUp={onKeyUp} src={path} />
  );
};

export default VideoView;
