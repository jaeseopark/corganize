/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';

const TableHeaderGroup = ({ headerGroup }) => (
  <tr {...headerGroup.getHeaderGroupProps()}>
    {headerGroup.headers.map((column) => {
      const { onClick, ...columnHeaderProps } = column.getHeaderProps(
        column.getSortByToggleProps()
      );
      const maybeSort = column.isSorted && (
        <span className={column.isSortedDesc ? 'sorted desc' : 'sorted asc'} />
      );
      const maybeFilter = column.canFilter && column.Filter && (
        <div>{column.render('Filter')}</div>
      );

      return (
        <th
          key={column.id}
          scope="col"
          {...columnHeaderProps}
          className={column.id}
        >
          <span role="button" onClick={onClick}>
            {column.render('Header')}
          </span>
          {maybeSort}
          {maybeFilter}
        </th>
      );
    })}
  </tr>
);

export default TableHeaderGroup;
