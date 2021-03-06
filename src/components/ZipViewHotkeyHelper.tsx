import React from 'react';

const keyAssignment = {
  'z/v': '±10 files',
  'x/c': '±5 file',
  arrows: '±1 file',
  space: '+1 file',
  '[': 'start',
  ']': 'end',
  esc: 'quit',
};

const ZipViewHotkeyHelper = () => (
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

export default ZipViewHotkeyHelper;
