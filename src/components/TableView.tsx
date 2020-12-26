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
import FileView from './FileView';
import PageControl from './PageControl';

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
            <span
              role="button"
              onClick={() => {
                setExpendedFileid(
                  file.fileid === expandedFileid ? null : file.fileid
                );
              }}
            >
              {displayString}
            </span>
          );
        },
      },
      {
        accessor: 'sourceurl',
      },
    ],
    [expandedFileid]
  );

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: { hiddenColumns },
    },
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    visibleColumns,
    page,
  } = tableInstance;

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
  }, [files, filesRequested, library, expandedFileid]);

  const renderRowSubComponent = useCallback(({ row }) => {
    const { original: file } = row;
    return <FileView file={file} />;
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
      <PageControl {...tableInstance} />
    </>
  );
};

export default TableView;
