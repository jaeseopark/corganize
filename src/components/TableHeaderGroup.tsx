/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';

const TableHeaderGroup = ({ headerGroup }) => {
  const getColumnHeaderProps = (column) => {
    try {
      const sortByToggleProps = column.getSortByToggleProps();
      return column.getHeaderProps(sortByToggleProps);
    } catch (error) {
      const { message } = error;
      if (message === 'column.getSortByToggleProps is not a function') {
        return column.getHeaderProps();
      }

      throw error;
    }
  };

  return (
    <tr {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map((column) => {
        let displayString = column.render('Header');
        if (column.isSorted) {
          displayString += column.isSortedDesc ? ' 🔽' : ' 🔼';
        }
        const { onClick, ...columnHeaderProps } = getColumnHeaderProps(column);
        return (
          <th
            key={column.id}
            scope="col"
            {...columnHeaderProps}
            className={column.id}
          >
            <span role="button" onClick={onClick}>
              {displayString}
            </span>
          </th>
        );
      })}
    </tr>
  );
};

export default TableHeaderGroup;
