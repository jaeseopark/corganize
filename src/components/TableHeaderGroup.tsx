/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';

const TableHeaderGroup = ({ headerGroup }) => (
  <tr {...headerGroup.getHeaderGroupProps()}>
    {headerGroup.headers.map((column) => {
      let sortClassName = null;
      if (column.isSorted) {
        sortClassName = column.isSortedDesc ? 'sorted desc' : 'sorted asc';
      }
      const { onClick, ...columnHeaderProps } = column.getHeaderProps(
        column.getSortByToggleProps()
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
          {sortClassName && <span className={sortClassName} />}
        </th>
      );
    })}
  </tr>
);

export default TableHeaderGroup;
