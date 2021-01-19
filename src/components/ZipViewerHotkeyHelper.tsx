import React from 'react';

const keyAssignment = {
  z: '-5 files',
  x: '-1 file',
  c: '+1 file',
  v: '+5 files',
  '[': 'start',
  ']': 'end',
  esc: 'quit',
};

const ZipViewerHotkeyHelper = () => (
  <table className="helper">
    <tbody>
      {Object.keys(keyAssignment).map((key) => {
        const desc = keyAssignment[key];
        return (
          <tr key={key}>
            <td className="key">
              <code>{key}</code>
            </td>
            <td className="desc">{desc}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

export default ZipViewerHotkeyHelper;
