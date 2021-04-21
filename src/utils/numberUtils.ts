const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

export const toHumanFileSize = (sizeInBytes: number): string => {
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  // eslint-disable-next-line no-restricted-properties
  const value = (sizeInBytes / Math.pow(1024, i)).toFixed(i < 3 ? 0 : 2);
  return `${value} ${UNITS[i]}`;
};

export function randomIntFromInterval(min, max) {
  // https://stackoverflow.com/a/7228322
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const closeEnough = (val1, val2, margin) =>
  Math.abs(val1 - val2) < margin;

export const toHumanDuration = (seconds: number): string =>
  new Date(seconds * 1000)
    .toISOString()
    .substr(seconds < 3600 ? 14 : 11, seconds < 3600 ? 5 : 8)
    .substr(seconds < 600 ? 1 : 0)
    .replaceAll('-', ':');
