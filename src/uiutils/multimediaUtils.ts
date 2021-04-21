/* eslint-disable import/prefer-default-export */

import { closeEnough } from '../utils/numberUtils';

export const getMetadata = (width, height, duration, size) => {
  const dimensions = [height, width];
  const isVertical = height > width;

  // Expressed in Megabits per second.
  const bitrate = Math.ceil((size / 1024 ** 2 / duration) * 8);

  if (isVertical) dimensions.reverse();

  const [short] = dimensions;
  const isCommonAspectRatio = closeEnough(width / height, 16 / 9, 0.15);

  return {
    isVertical,
    resolution: isCommonAspectRatio ? `${short}p` : null,
    bitrate: `${bitrate}Mbps`,
  };
};
