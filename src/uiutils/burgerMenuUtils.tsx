/* eslint-disable import/prefer-default-export */
import { File } from '../entity/File';
import { humanFileSize } from '../utils/numberUtils';

export const getBurgerMenuOptions = (
  files: File[],
  allFilesLoaded: boolean,
  openScrapePanel: Function,
  openAdminPanel: Function,
) => {
  const libSize = files.reduce((sum, f: File) => sum + (f.size || 0), 0);
  const libSizeStr = humanFileSize(libSize);

  return [
    {
      label: 'Scrape',
      onClick: openScrapePanel,
    },
    {
      label: 'Admin Panel',
      onClick: openAdminPanel,
      disabled: !allFilesLoaded,
    },
    { label: `Library Size ${libSizeStr}`, className: 'footer' },
  ];
};
