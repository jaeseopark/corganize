import React from 'react';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

import './ContextMenuWrapper.scss';

const attributes = {
  className: 'custom-root',
  disabledClassName: 'custom-disabled',
  dividerClassName: 'custom-divider',
  selectedClassName: 'custom-selected',
};

const ContextMenuWrapper = ({ id, component, options }) => {
  return (
    <>
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
    </>
  );
};

export default ContextMenuWrapper;
