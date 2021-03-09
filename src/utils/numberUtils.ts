const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

// eslint-disable-next-line import/prefer-default-export
export function humanFileSize(sizeInBytes: number) {
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  // eslint-disable-next-line no-restricted-properties
  const value = (sizeInBytes / Math.pow(1024, i)).toFixed(i < 3 ? 0 : 1);
  return `${value} ${UNITS[i]}`;
}
