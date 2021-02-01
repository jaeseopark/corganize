/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';
import {
  getLocalActions,
  getMetadataOptions,
  getRemoteActions,
} from '../utils/contextMenuUtils';

import ContextMenuWrapper from './ContextMenuWrapper';

const TableRow = ({
  row,
  prepareRow,
  library,
  setFullscreenComponent,
  updateFile,
  rerenderRowData,
  showAlert,
}) => {
  prepareRow(row);

  const options = [];
  options.push(...getLocalActions(row.original, library, rerenderRowData, showAlert));
  options.push(...getRemoteActions(row.original, updateFile, rerenderRowData, showAlert));

  // Show Metadata is always available.
  options.push({
    label: 'Show Metadata',
    onClick: () => {
      setFullscreenComponent({
        title: row.original.filename,
        body: <pre>{JSON.stringify(row.original, null, 2)}</pre>,
      });
    },
  });

  return (
    <tr {...row.getRowProps()}>
      {row.cells.map((cell) => {
        const columnName = cell?.column?.id;
        return (
          <td {...cell.getCellProps()} className={columnName}>
            <ContextMenuWrapper
              id={row.original.fileid}
              component={cell.render('Cell')}
              options={options}
            />
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
