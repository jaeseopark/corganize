/* eslint-disable import/prefer-default-export */
import { File } from '../entity/File';
import { toHumanFileSize } from '../utils/numberUtils';

export const getBurgerMenuOptions = (
  files: File[],
  scrapePreset: string[],
  allFilesLoaded: boolean,
  openScrapePanel: Function,
  openOrphanAnalysisPanel: Function,
  openDuplicateAnalysisPanel: Function
) => {
  const libSize = files.reduce((sum, f: File) => sum + (f.size || 0), 0);
  const libSizeStr = toHumanFileSize(libSize);

  return [
    {
      label: 'Scrape',
      onClick: openScrapePanel,
    },
    {
      label: 'Scrape Preset',
      onClick: () => openScrapePanel(scrapePreset),
      disabled: !scrapePreset || scrapePreset.length === 0,
    },
    {
      label: 'Orphan Analysis',
      onClick: openOrphanAnalysisPanel,
      disabled: !allFilesLoaded,
    },
    {
      label: 'Duplicate Analysis',
      onClick: openDuplicateAnalysisPanel,
    },
    { label: `Library Size ${libSizeStr}`, className: 'footer' },
  ];
};
