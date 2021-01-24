/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import classNames from 'classnames';

import { useAsyncDebounce } from 'react-table';

import clearIcon from '../../assets/backspace_119404.svg';

const GlobalFilter = ({ setGlobalFilter, gotoPage, state, isVisible }) => {
  const { globalFilter } = state;

  const [value, setValue] = useState(globalFilter);

  const onChange = useAsyncDebounce((v) => {
    gotoPage(0);
    setGlobalFilter(v || undefined);
  }, 200);

  const clear = () => {
    setValue('');
    onChange('');
  };

  const onKeyUp = (event) => {
    if (event.key === 'Escape') {
      clear();
    }
  };

  const className = classNames('globalfilter', {
    hidden: !isVisible,
  });

  return (
    <div className={className}>
      <input
        value={value || ''}
        placeholder="Search..."
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        onKeyUp={onKeyUp}
      />
      <img className="clear" src={clearIcon} onClick={clear} />
    </div>
  );
};

export default GlobalFilter;
