/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */

import React from 'react';

const TableRow = ({ row, prepareRow }) => {
  prepareRow(row);
  return (
    <>
      <tr {...row.getRowProps()}>
        {row.cells.map((cell) => {
          const columnName = cell?.column?.id;
          return (
            <td {...cell.getCellProps()} className={columnName}>
              {cell.render('Cell')}
            </td>
          );
        })}
      </tr>
    </>
  );
};

export default TableRow;
