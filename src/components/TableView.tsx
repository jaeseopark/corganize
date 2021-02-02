/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-key */
import React from 'react';
import classNames from 'classnames';

import PageControl from './PageControl';
import TableHeaderGroup from './TableHeaderGroup';
import TableRow from './TableRow';

import './TableView.scss';

const TableView = ({
  tableInstance,
  isVisible,
  getConextMenuOptions,
}) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
  } = tableInstance;

  const className = classNames('tableview', {
    hidden: !isVisible,
  });

  return (
    <div className={className}>
      <table className="table" {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <TableHeaderGroup headerGroup={headerGroup} />
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => (
            <TableRow
              row={row}
              prepareRow={prepareRow}
              getConextMenuOptions={getConextMenuOptions}
            />
          ))}
        </tbody>
      </table>
      <PageControl {...tableInstance} />
    </div>
  );
};

export default TableView;
