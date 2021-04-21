import React, { useEffect, useState } from 'react';
import { File } from '../entity/File';
import { toHumanFileSize } from '../utils/numberUtils';
import ContextMenuWrapper from './ContextMenuWrapper';

import './DuplicateAnalysisPanel.scss';

const GroupBy = {
  FILENAME: 'filename',
  SIZE: 'size',
};

const DuplicateAnalysisPanel = ({
  files,
  getContextMenuOptions,
}: {
  files: File[];
  getContextMenuOptions: Function;
}) => {
  const [groupBy, setGroupBy] = useState<string>(GroupBy.FILENAME);
  const [grouppedFiles, setGrouppedFiles] = useState(null);

  const onDropdownChange = (event) => {
    setGroupBy(event.target.value);
    setGrouppedFiles(null);
  };

  const getGrouppedFiles = (files: File[]): File[] => {
    const freq = [...files].reduce((acc, f: File) => {
      const key = f[groupBy];
      if (acc[key]) {
        acc[key].push(f);
      } else {
        acc[key] = [f];
      }
      return acc;
    }, {});

    return Object.values(freq).filter((val) => val.length > 1);
  };

  useEffect(() => {
    if (!grouppedFiles) {
      setGrouppedFiles(getGrouppedFiles(files));
    }
  }, [grouppedFiles, files, groupBy, getGrouppedFiles]);

  const getTableRows = (files: File[]) =>
    files.map((file) => (
      // eslint-disable-next-line react/jsx-key
      <tr>
        <td className="fileid">{file.fileid}</td>
        <td className="filename">
          <ContextMenuWrapper
            id={file.fileid}
            component={<span>{file.filename}</span>}
            options={getContextMenuOptions(file)}
          />
        </td>
        <td>{toHumanFileSize(file.size)}</td>
      </tr>
    ));

  if (!grouppedFiles) return <span>Loading...</span>;

  return (
    <div className="duplicate-analysis-wrapper">
      <select className="group-by" onChange={onDropdownChange} value={groupBy}>
        <option value={GroupBy.FILENAME}>Filename</option>
        <option value={GroupBy.SIZE}>Size</option>
      </select>
      <div className="duplicate-analysis">
        <table>
          <thead>
            <tr>
              <th className="fileid">Fielid</th>
              <th className="filename">Filename</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>{grouppedFiles.map(getTableRows)}</tbody>
        </table>
      </div>
    </div>
  );
};

export default DuplicateAnalysisPanel;
