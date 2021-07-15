import React from 'react';

export function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach((row) => {
      options.add(row.values[id] || 'None');
    });
    return [...options.values()];
  }, [id, preFilteredRows]);

  // Render a multi-select box
  return (
    <select
      value={filterValue}
      onChange={(e) => {
        setFilter(e.target.value || undefined);
      }}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export const nullableSelectColumnFilter = (rows, id, filterValue) => {
  if (id.length > 1) {
    throw new Error('Not implemented');
  }

  return rows.filter((row) => {
    const rowValue = row.values[id[0]];
    return (
      (filterValue === 'None' && !rowValue) ||
      (filterValue !== 'None' && rowValue && rowValue.includes(filterValue))
    );
  });
};
