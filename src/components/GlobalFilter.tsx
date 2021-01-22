/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { useAsyncDebounce } from 'react-table';

const GlobalFilter = ({ setGlobalFilter, gotoPage, state }) => {
  const { globalFilter } = state;

  const [value, setValue] = useState(globalFilter);
  const onChange = useAsyncDebounce((v) => {
    gotoPage(0);
    setGlobalFilter(v || undefined);
  }, 200);

  return (
    <div className="globalfilter">
      <input
        value={value || ''}
        placeholder="Search..."
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
      />
    </div>
  );
};

export default GlobalFilter;
