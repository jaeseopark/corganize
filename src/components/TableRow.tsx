import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import ContextMenuWrapper from './ContextMenuWrapper';

const TableRow = ({ row, prepareRow, getConextMenuOptions }) => {
  const [,setTimestamp] = useState(null);
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
        let component;
        if (cell.column.id === 'filename') {
          component = (
            <ContextMenuWrapper
              id={row.original.fileid}
              component={cell.render('Cell')}
              options={getConextMenuOptions(row.original)}
            />
          );
        } else {
          component = cell.render('Cell');
        }

        return (
          <td {...cell.getCellProps()} className={cell?.column?.id}>
            {component}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
