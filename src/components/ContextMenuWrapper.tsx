import React from 'react';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { ContextMenuOption } from '../entity/props';

import './ContextMenuWrapper.scss';

type ContextMenuWrapperProps = {
  id: string;
  component: HTMLElement;
  options: ContextMenuOption[];
};

const ContextMenuWrapper = ({
  id,
  component,
  options,
}: ContextMenuWrapperProps) => {
  const optionsWithHotkeys = options
    .filter((option) => option && option.hotkey)
    .reduce((map, obj) => {
      map.set(obj.hotkey.toLowerCase(), obj.onClick);
      return map;
    }, new Map<string, () => void>());

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    const onClick = optionsWithHotkeys.get(key);
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
            <MenuItem key={label} className="custom-root" onClick={onClick}>
              {label}
            </MenuItem>
          );
        })}
      </ContextMenu>
    </div>
  );
};

export default ContextMenuWrapper;
