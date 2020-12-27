/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */

import React from 'react';

const TableRow = ({ row, prepareRow, expandedFileid, visibleColumns }) => {
  const { original: file } = row;
  prepareRow(row);
  const subcomponent = expandedFileid === file.fileid && (
    <tr>
      <td colSpan={visibleColumns.length}>
        <pre>{JSON.stringify(file, null, 2)}</pre>
      </td>
    </tr>
  );
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
      {subcomponent}
    </>
  );
};

export default TableRow;
