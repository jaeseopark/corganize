import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import ContextMenuWrapper from './ContextMenuWrapper';

const getRenderComponent = (row, cell, index, getConextMenuOptions) => {
  const renderedCell = cell.render('Cell');
  switch (cell.column.id) {
    case 'filename':
      return (
        <ContextMenuWrapper
          id={row.original.fileid}
          component={renderedCell}
          options={getConextMenuOptions(row.original)}
        />
      );
    case 'actions':
      return (
        <>
          {renderedCell}
          <span className="row-index">{index}</span>
        </>
      );
    default:
      return renderedCell;
  }
};

const TableRow = ({ index, row, prepareRow, getConextMenuOptions }) => {
  const [, setTimestamp] = useState(null);
  prepareRow(row);

  const rerender = () => {
    setTimestamp(Date.now());
  };

  useEffect(() => {
    const channel = `download${row.original.fileid}`;
    const downloadListener = (_event, { percentage }) => {
      if (percentage === 100) {
        rerender();
      }
    };
    ipcRenderer.on(channel, downloadListener);
    return () => {
      ipcRenderer.removeListener(channel, downloadListener);
    };
  });

  return (
    <tr {...row.getRowProps()}>
      {row.cells.map((cell) => {
        return (
          <td {...cell.getCellProps()} className={cell?.column?.id}>
            {getRenderComponent(row, cell, index, getConextMenuOptions)}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
