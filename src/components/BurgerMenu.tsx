import React, { useMemo } from 'react';
import { slide as Menu } from 'react-burger-menu';
import classNames from 'classnames';

import './BurgerMenu.scss';
import { useSelector } from 'react-redux';
import { getHiddenFiles, getRemoteFiles } from '../redux/files/slice';
import { toHumanFileSize } from '../utils/numberUtils';

export type BurgerMenuOption = {
  label: string;
  onClick?;
  disabled?: boolean;
  className?: string;
};

type BurgerMenuProps = {
  scrapePreset: string[];
  allFilesLoaded: boolean;
  openScrapePanel: Function;
  openOrphanAnalysisPanel: Function;
  openDuplicateAnalysisPanel: Function;
  openUploadPanel: Function;
};

const BurgerMenu = ({
  scrapePreset,
  allFilesLoaded,
  openScrapePanel,
  openOrphanAnalysisPanel,
  openDuplicateAnalysisPanel,
  openUploadPanel,
}: BurgerMenuProps) => {
  const remote = useSelector(getRemoteFiles);
  const hidden = useSelector(getHiddenFiles);

  const getMainOptions = (): BurgerMenuOption[] => [
    {
      label: 'Upload',
      onClick: openUploadPanel,
    },
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
  ];

  const getFooterOption = (): BurgerMenuOption => {
    const libSize = toHumanFileSize(
      remote.reduce((sum: number, f: File) => sum + (f.size || 0), 0)
    );
    return {
      label: `R${remote.length} (${libSize}), H${hidden.length}`,
      className: 'footer',
    };
  };

  const options: BurgerMenuOption[] = useMemo(
    () => [...getMainOptions(), getFooterOption()],
    [remote, hidden]
  );

  const closingOnClick = (onClick: () => void) => {
    return () => {
      if (onClick) {
        onClick();
        // TODO: close burger menu
      }
    };
  };

  const optionToLabel = (option: BurgerMenuOption) => {
    const { label, disabled, onClick, className } = option;
    const onClickWrapper = disabled ? null : closingOnClick(onClick);
    const newClassName = classNames(className, { disabled });

    return (
      <div key={label} onClick={onClickWrapper} className={newClassName}>
        {label}
      </div>
    );
  };

  return <Menu>{options.map(optionToLabel)}</Menu>;
};

export const BurgerMenuSpacer = () => <div className="burger-menu-spacer" />;

export default BurgerMenu;
