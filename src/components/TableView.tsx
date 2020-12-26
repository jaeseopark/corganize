/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable react/display-name */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import format from '../cellformatter';
import Downloader from './Downloader';

import './TableView.scss';

const hiddenColumns = ['sourceurl'];

const TableView = ({ library }) => {
  const [filesRequested, setFilesRequested] = useState(false);
  const [files, setFiles] = useState(null);
  const [expandedFileid, setExpendedFileid] = useState(null);

  const data = useMemo(() => files || [], [files]);
  const columns = useMemo(
    () => [
      {
        accessor: 'isactive',
        Cell: format,
      },
      {
        accessor: 'ispublic',
        Cell: format,
      },
      {
        accessor: 'storageservice',
        Cell: format,
      },
      {
        accessor: 'size',
        Header: 'Size',
        Cell: format,
      },
      {
        accessor: 'lastupdated',
        Header: 'Updated',
        Cell: format,
      },
      {
        accessor: 'filename',
        Header: 'Filename',
        id: 'filename',
        Cell: (props) => {
          const { row } = props;
          const { original: file } = row;
          const displayString = format(props);
          return (
            <span role="button" onClick={() => setExpendedFileid(file.fileid)}>
              {displayString}
            </span>
          );
        },
      },
      {
        accessor: 'sourceurl',
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    visibleColumns,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { hiddenColumns },
    },
    useSortBy,
    usePagination
  );

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

  const renderRowSubComponent = useCallback(({ row }) => {
    const { original: file } = row;
    return <Downloader file={file} />;
  }, []);

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

  const pagination = (
    <div className="pagination">
      <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
        {'<<'}
      </button>{' '}
      <button onClick={() => previousPage()} disabled={!canPreviousPage}>
        {'<'}
      </button>{' '}
      <button onClick={() => nextPage()} disabled={!canNextPage}>
        {'>'}
      </button>{' '}
      <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
        {'>>'}
      </button>{' '}
      <span>
        Page{' '}
        <strong>
          {pageIndex + 1} of {pageOptions.length}
        </strong>{' '}
      </span>
      <span>
        | Go to page:{' '}
        <input
          type="number"
          defaultValue={pageIndex + 1}
          onChange={(e) => {
            const targetPage = e.target.value ? Number(e.target.value) - 1 : 0;
            gotoPage(targetPage);
          }}
          style={{ width: '100px' }}
        />
      </span>{' '}
      <select
        value={pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value));
        }}
      >
        {[10, 20, 30, 40, 50].map((itemsPerPage) => (
          <option key={itemsPerPage} value={itemsPerPage}>
            Show {itemsPerPage}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
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
          {page.map((row) => {
            prepareRow(row);
            const { original: file } = row;
            const subcomponent = expandedFileid === file.fileid && (
              <tr>
                <td colSpan={visibleColumns.length}>
                  {renderRowSubComponent({ row })}
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
          })}
        </tbody>
      </table>
      {pagination}
    </>
  );
};

export default TableView;
