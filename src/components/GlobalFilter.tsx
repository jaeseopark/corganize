/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import classNames from 'classnames';

import { useAsyncDebounce } from 'react-table';

import clearIcon from '../../assets/backspace_119404.svg';

const GlobalFilter = ({ tableInstance }) => {
  const { setGlobalFilter, gotoPage, state } = tableInstance;
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

  const className = classNames('globalfilter');

  return (
    <div className={className}>
      <input
        placeholder="Search..."
        tabIndex="4"
        value={value || ''}
        onKeyUp={onKeyUp}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
      />
      <img className="clear" src={clearIcon} onClick={clear} />
    </div>
  );
};

export default GlobalFilter;
