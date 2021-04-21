/* eslint-disable import/prefer-default-export */

import { closeEnough } from '../utils/numberUtils';

export const getMetadata = (width, height, durationInSeconds, sizeInBytes) => {
  const dimensions = [height, width];
  const isVertical = height > width;

  // Expressed in Megabits per second.
  const bitrate = Math.floor((sizeInBytes / 1024 ** 2 / durationInSeconds) * 8);

  if (isVertical) dimensions.reverse();

  const [short] = dimensions;
  const isCommonAspectRatio = closeEnough(width / height, 16 / 9, 0.15);

  return {
    isVertical,
    resolution: isCommonAspectRatio ? `${short}p` : null,
    bitrate,
  };
};
