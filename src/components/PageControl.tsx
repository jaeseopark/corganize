/* eslint-disable react/prop-types */
import React from 'react';
import Button from './Button';

import './PageControl.scss';

const PageControl = ({
  canPreviousPage,
  canNextPage,
  pageOptions,
  pageCount,
  gotoPage,
  nextPage,
  previousPage,
  setPageSize,
  state,
}) => {
  const { pageIndex, pageSize } = state;
  return (
    <div className="pagecontrol">
      <Button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
        {'<<'}
      </Button>
      <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
        {'<'}
      </Button>
      <Button onClick={() => nextPage()} disabled={!canNextPage}>
        {'>'}
      </Button>
      <Button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
        {'>>'}
      </Button>
      <span className="page-indicator">
        Page {pageIndex + 1} of {pageOptions.length}
      </span>
      {/* <span>
        Go to page:
        <input
          type="number"
          defaultValue={pageIndex + 1}
          onChange={(e) => {
            const targetPage = e.target.value ? Number(e.target.value) - 1 : 0;
            gotoPage(targetPage);
          }}
          style={{ width: '100px' }}
        />
      </span> */}
      <select
        value={pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value));
        }}
      >
        {[10, 20, 30, 40, 50].map((itemsPerPage) => (
          <option key={itemsPerPage} value={itemsPerPage}>
            Show {itemsPerPage} per page
          </option>
        ))}
      </select>
    </div>
  );
};

export default PageControl;
