const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

export function humanFileSize(sizeInBytes: number) {
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  // eslint-disable-next-line no-restricted-properties
  const value = (sizeInBytes / Math.pow(1024, i)).toFixed(i < 3 ? 0 : 2);
  return `${value} ${UNITS[i]}`;
}

export function randomIntFromInterval(min, max) {
  // https://stackoverflow.com/a/7228322
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const closeEnough = (val1, val2, margin) =>
  Math.abs(val1 - val2) < margin;
