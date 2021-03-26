/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import Button from './Button';

import './PageControl.scss';

const PageControl = ({
  canPreviousPage,
  canNextPage,
  pageCount,
  gotoPage,
  nextPage,
  previousPage,
  setPageSize,
  state,
  goToRandomPage,
}) => {
  const { pageIndex, pageSize } = state;

  // Re-render when pageCount changes.
  useEffect(() => {}, [pageCount]);

  return (
    <div className="page-control">
      <div className="page-size">
        Show
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
          tabIndex="-1"
        >
          {[10, 20, 30, 40, 50].map((itemsPerPage) => (
            <option key={itemsPerPage} value={itemsPerPage}>
              {itemsPerPage}
            </option>
          ))}
        </select>
        items per page
      </div>
      <div className="page-nav">
        <div className="buttons">
          <Button onClick={goToRandomPage}>Random</Button>
          <Button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
            &lt;&lt;
          </Button>
          <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
            &lt;
          </Button>
          <Button onClick={() => nextPage()} disabled={!canNextPage}>
            &gt;
          </Button>
          <Button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          >
            &gt;&gt;
          </Button>
        </div>
        <div className="page-indicator">
          <span>
            Page{' '}
            <input
              className="page-jump-field"
              type="number"
              value={pageIndex + 1}
              onChange={(e) => {
                const targetPage = e.target.value
                  ? Number(e.target.value) - 1
                  : 0;
                gotoPage(targetPage);
              }}
            />{' '}
            of {pageCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PageControl;
