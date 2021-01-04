/* eslint-disable import/prefer-default-export */
export function humanFileSize(sizeInBytes: number) {
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  // eslint-disable-next-line no-restricted-properties
  const value = (sizeInBytes / Math.pow(1024, i)).toFixed(0);
  const unit = ['B', 'kB', 'MB', 'GB', 'TB'][i];
  return `${value} ${unit}`;
}
