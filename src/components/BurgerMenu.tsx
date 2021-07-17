import React, { useMemo } from 'react';
import { slide as Menu } from 'react-burger-menu';
import classNames from 'classnames';

import './BurgerMenu.scss';
import { useDispatch, useSelector } from 'react-redux';
import { getHiddenFiles, getRemoteFiles } from '../redux/files/slice';
import { toHumanFileSize } from '../utils/numberUtils';
import { setFullscreen } from '../redux/fullscreen/slice';
import OrphanAnalysisPanel from './OrphanAnalysisPanel';

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
  openDuplicateAnalysisPanel: Function;
  openUploadPanel: Function;
};

const BurgerMenu = ({
  scrapePreset,
  allFilesLoaded,
  openScrapePanel,
  openDuplicateAnalysisPanel,
  openUploadPanel,
}: BurgerMenuProps) => {
  const dispatch = useDispatch();
  const remote = useSelector(getRemoteFiles);
  const hidden = useSelector(getHiddenFiles);

  const openOrphanPanel = () =>
    dispatch(
      setFullscreen({
        title: 'Delete Orphan Files',
        body: <OrphanAnalysisPanel />,
      })
    );

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
      onClick: openOrphanPanel,
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
    const onClickWrapper = !disabled ? closingOnClick(onClick) : undefined;
    const newClassName = classNames(className, { disabled });

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events
      <div key={label} onClick={onClickWrapper} className={newClassName}>
        {label}
      </div>
    );
  };

  return <Menu>{options.map(optionToLabel)}</Menu>;
};

export const BurgerMenuSpacer = () => <div className="burger-menu-spacer" />;

export default BurgerMenu;
