/* eslint-disable import/prefer-default-export */
export const getMetadata = (width, height, durationInSeconds, sizeInBytes) => {
  const dimensions = [height, width];
  const isVertical = height > width;

  // Expressed in Megabits per second.
  const bitrate = Math.floor((sizeInBytes / 1024 ** 2 / durationInSeconds) * 8);

  if (isVertical) dimensions.reverse();

  const [short] = dimensions;

  const displayProps = {
    isVertical,
    width,
    height,
    resolutionShorthand: `${short}p`,
    bitrate,
  };
};
