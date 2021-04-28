import React, { useRef } from 'react';
import screenfull from 'screenfull';
import './VideoView.scss';

const TIME_HOTKEY_MAP = {
  z: -60,
  x: -15,
  c: 15,
  v: 60,
  b: 300,
};

const isHotkey = (key: string) => Object.keys(TIME_HOTKEY_MAP).includes(key);

const VideoView = ({ path, updateFile }) => {
  const el = useRef(null);

  const onMetadata = (e) => {
    const { videoWidth, videoHeight, duration } = e.target;
    if (!videoWidth || !videoHeight || !duration) return;
    updateFile({
      multimedia: {
        width: videoWidth,
        height: videoHeight,
        duration: Math.ceil(duration),
      },
    });
  };

  const jumpTimeByDelta = (deltaInSeconds) => {
    try {
      el.current.currentTime += deltaInSeconds;
    } catch (e) {}
  };

  /**
   * @param percentage 0-1.0
   */
  const jumpTimeByPercentage = (percentage: number) => {
    try {
      el.current.currentTime = el.current.duration * percentage;
    } catch (e) {}
  };

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (key === 'f') {
      if (screenfull.isEnabled) {
        screenfull.toggle(el.current);
      }
    } else if (key === 'm') {
      el.current.muted = !el.current.muted;
    } else if (key >= '0' && key <= '9') {
      jumpTimeByPercentage(parseInt(key) / 10);
    } else if (isHotkey(key)) {
      jumpTimeByDelta(TIME_HOTKEY_MAP[key]);
    }
  };

  return (
    <video
      muted
      autoPlay
      loop
      controls
      ref={el}
      onKeyUp={onKeyUp}
      onLoadedMetadata={onMetadata}
      src={path}
    />
  );
};

export default VideoView;
