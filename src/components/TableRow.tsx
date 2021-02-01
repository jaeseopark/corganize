/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */

import { existsSync } from 'fs';
import React from 'react';
import { copyTextToClipboard } from '../utils/clipboardUtils';
import ContextMenuWrapper from './ContextMenuWrapper';
import FileMetadataView from './FileMetadataView';

const getPrimarylActions = (
  { fileid, storageservice, locationref },
  library
) => {
  const primaryActions = [];
  const encryptedPath = library.getEncryptedPath(fileid);
  if (existsSync(encryptedPath)) {
    primaryActions.push({
      label: 'Open',
      onClick: () => alert('open hehe'),
    });
  } else if (storageservice && storageservice !== 'None' && locationref) {
    primaryActions.push({
      label: 'Download',
      onClick: () => {},
    });
  }

  if (primaryActions.length > 0) primaryActions.push(null);
  return primaryActions;
};

const getSecondaryActions = ({ sourceurl, storageservice }, showAlert) => {
  const secondaryActions = [];
  if (storageservice !== 'None')
    secondaryActions.push({
      label: 'Delete Remote File',
      onClick: () => alert('delete remote'),
    });

  if (sourceurl)
    secondaryActions.push({
      label: 'Copy Source URL',
      onClick: () =>
        copyTextToClipboard(sourceurl).then(showAlert('Copied to clipboard')),
    });

  secondaryActions.push(null);
  return secondaryActions;
};

const TableRow = ({
  row,
  prepareRow,
  setFullscreenComponent,
  updateFile,
  showAlert,
  library,
}) => {
  prepareRow(row);

  const { filename, fileid } = row.original;

  const options = [];
  options.push(...getPrimarylActions(row.original, library));
  options.push(...getSecondaryActions(row.original, showAlert));
  options.push({
    label: 'Show Details',
    onClick: () => {
      setFullscreenComponent({
        title: filename,
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
              id={fileid}
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
