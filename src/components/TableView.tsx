/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-key */
import React, { useRef } from 'react';
import { randomIntFromInterval } from '../utils/numberUtils';

import PageControl from './PageControl';
import TableHeaderGroup from './TableHeaderGroup';
import TableRow from './TableRow';

import './TableView.scss';

const TableView = ({
  downloadOrOpenFile,
  tableInstance,
  getConextMenuOptions,
  tableRef,
  focusTable,
}) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    nextPage,
    previousPage,
    gotoPage,
    pageCount,
  } = tableInstance;

  const downloadOrOpenFileByIndex = (visibleIndex: number) => {
    if (page.length > visibleIndex) {
      const row = page[visibleIndex];
      const { original: file } = row;
      downloadOrOpenFile(file);
    }
  };

  const goToRandomPage = () =>
    gotoPage(randomIntFromInterval(1, pageCount) - 1);

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (key >= '0' && key <= '9') {
      downloadOrOpenFileByIndex(parseInt(key));
      focusTable();
    } else if (key === 'arrowright' || key === ' ') {
      nextPage();
      focusTable();
    } else if (key === 'arrowleft') {
      previousPage();
      focusTable();
    } else if (key === 'r') {
      goToRandomPage();
      focusTable();
    }
  };

  return (
    <div className="tableview">
      <table ref={tableRef} className="table" {...getTableProps()} onKeyUp={onKeyUp} tabIndex="1">
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <TableHeaderGroup headerGroup={headerGroup} />
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => (
            <TableRow
              index={i}
              row={row}
              prepareRow={prepareRow}
              getConextMenuOptions={getConextMenuOptions}
            />
          ))}
        </tbody>
      </table>
      <PageControl {...tableInstance} goToRandomPage={goToRandomPage} />
    </div>
  );
};

export default TableView;
