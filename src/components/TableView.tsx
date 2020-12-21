/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import { useTable, useSortBy } from 'react-table';
import PropTypes from 'prop-types';
import Library from '../library';

import { columnDefinition, hiddenColumns } from '../columnDefinition';

import './TableView.scss';

const TableView = ({ library }) => {
  const [filesRequested, setFilesRequested] = useState(false);
  const [files, setFiles] = useState(null);
  const data = useMemo(() => files || [], [files]);
  const columns = useMemo(() => columnDefinition, []);
  const tableInstance = useTable({
    columns,
    data,
    initialState: { hiddenColumns },
    useSortBy,
  });

  useEffect(() => {
    if (!files && !filesRequested) {
      const { corganizeClient } = library;
      const promise = corganizeClient.getFiles();
      // eslint-disable-next-line promise/catch-or-return
      promise
        .then((r) => {
          return r.json();
        })
        // eslint-disable-next-line promise/always-return
        .then((responseBody) => {
          setFiles(responseBody.files);
        });
      setFilesRequested(true);
    }
  }, [files, filesRequested, library]);

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

  if (!files) {
    return <h2 className="center">Loading...</h2>;
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <table className="table" {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => {
              let sortIndicator = '';
              if (column.isSorted) {
                sortIndicator = column.isSortedDesc ? ' 🔽' : ' 🔼';
              }
              return (
                <th
                  scope="col"
                  {...getColumnHeaderProps(column)}
                  className={column.id}
                >
                  {column.render('Header')}
                  <span>{sortIndicator}</span>
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
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
          );
        })}
      </tbody>
    </table>
  );
};

TableView.propTypes = {
  library: PropTypes.shape(Library).isRequired,
};

export default TableView;
