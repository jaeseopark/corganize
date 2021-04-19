import React from 'react';
import { slide as Menu } from 'react-burger-menu';
import classNames from 'classnames';

import './BurgerMenu.scss';

export type BurgerMenuOption = {
  label: string;
  disabled: boolean;
  onClick: Function;
  className: string | null;
};

const BurgerMenu = ({ getBurgerMenuOptions }) => {
  const options: BurgerMenuOption[] = getBurgerMenuOptions();

  const closingOnClick = (onClick: Function) => {
    return () => {
      if (onClick) {
        onClick();
        // TODO: close burger menu
      }
    };
  };

  const optionToLabel = (option: BurgerMenuOption) => {
    const { label, disabled, onClick, className, ...remainingProps } = option;
    const onClickWrapper = disabled ? null : closingOnClick(onClick);
    const newClassName = classNames(className, disabled && 'disabled');

    return (
      <div
        onClick={onClickWrapper}
        className={newClassName}
        {...remainingProps}
      >
        {label}
      </div>
    );
  };

  return <Menu>{options.map(optionToLabel)}</Menu>;
};

export const BurgerMenuSpacer = () => <div className="burger-menu-spacer" />;

export default BurgerMenu;
