/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-key */
import React from 'react';
import { useSelector } from 'react-redux';
import { File } from '../entity/File';
import { getLocalFiles } from '../redux/files/slice';
import { shuffle } from '../utils/arrayUtils';
import { randomIntFromInterval } from '../utils/numberUtils';

import PageControl from './PageControl';
import TableHeaderGroup from './TableHeaderGroup';
import TableRow from './TableRow';

import './TableView.scss';

const TableView = ({
  downloadOrOpenFile,
  tableInstance,
  getConextMenuOptions,
  tableRef,
  focusTable,
}) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    nextPage,
    previousPage,
    gotoPage,
    pageCount,
  } = tableInstance;

  const localFiles: string[] = useSelector(getLocalFiles);

  const isLocal = (file: File) => localFiles.includes(file.encryptedPath);

  const getFirstLocalFileWithoutMimetype = () => {
    return page
      .map((row) => row.original)
      .find((file: File) => isLocal(file) && !file.mimetype);
  };

  const isActiveAndLocal = (f: File) => f.dateactivated && isLocal(f);

  const getRandomActiveLocalFile = () => {
    const files = page.map((row) => row.original).filter(isActiveAndLocal);
    const [firstFile] = shuffle(files);
    return firstFile;
  };

  const downloadAllRemoteFiles = () => {
    page
      .map((row) => row.original)
      .filter(
        (file: File) =>
          !isLocal(file) &&
          file.storageservice &&
          file.storageservice !== 'None'
      )
      .forEach((file: File) => {
        downloadOrOpenFile(file);
      });
  };

  const downloadOrOpenFileByIndex = (visibleIndex: number) => {
    if (page.length > visibleIndex) {
      const row = page[visibleIndex];
      const { original: file } = row;
      downloadOrOpenFile(file);
    }
  };

  const goToRandomPage = () =>
    gotoPage(randomIntFromInterval(1, pageCount) - 1);

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (key >= '0' && key <= '9') {
      downloadOrOpenFileByIndex(parseInt(key));
    } else if (key === '`') {
      const file = getFirstLocalFileWithoutMimetype();
      if (file) downloadOrOpenFile(file);
      else downloadAllRemoteFiles();
    } else if (key === 'arrowright' || key === ' ') {
      nextPage();
      focusTable();
    } else if (key === 'arrowleft') {
      previousPage();
      focusTable();
    } else if (key === 'r') {
      goToRandomPage();
      focusTable();
    } else if (key === 'g') {
      const file = getRandomActiveLocalFile();
      if (file) {
        downloadOrOpenFile(file);
      }
    }
  };

  return (
    <div className="tableview">
      <table ref={tableRef} className="table" {...getTableProps()} onKeyUp={onKeyUp} tabIndex="1">
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <TableHeaderGroup headerGroup={headerGroup} />
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => (
            <TableRow
              index={i}
              row={row}
              prepareRow={prepareRow}
              getConextMenuOptions={getConextMenuOptions}
            />
          ))}
        </tbody>
      </table>
      <PageControl {...tableInstance} goToRandomPage={goToRandomPage} />
    </div>
  );
};

export default TableView;
