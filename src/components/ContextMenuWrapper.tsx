import React from 'react';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

import './ContextMenuWrapper.scss';

type ContextMenuWrapperProps = {
  id: string;
  component: HTMLElement;
  options: any[];
};

const attributes = {
  className: 'custom-root',
  disabledClassName: 'custom-disabled',
  dividerClassName: 'custom-divider',
  selectedClassName: 'custom-selected',
};

const ContextMenuWrapper = ({
  id,
  component,
  options,
}: ContextMenuWrapperProps) => {
  const optionsWithHotkeys = options
    .filter((option) => option && option.hotkey)
    .reduce((map, obj) => {
      map[obj.hotkey.toLowerCase()] = obj.onClick;
      return map;
    }, {});

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    const onClick = optionsWithHotkeys[key];
    if (onClick) {
      onClick();
    }
  };

  return (
    <div onKeyUp={onKeyUp}>
      <ContextMenuTrigger id={id}>{component}</ContextMenuTrigger>
      <ContextMenu id={id}>
        {options.map((option) => {
          if (!option) return <MenuItem divider />;

          const { label, onClick } = option;
          return (
            <MenuItem key={label} onClick={onClick} attributes={attributes}>
              {label}
            </MenuItem>
          );
        })}
      </ContextMenu>
    </div>
  );
};

export default ContextMenuWrapper;
