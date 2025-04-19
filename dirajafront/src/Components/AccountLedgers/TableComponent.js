import React from 'react';

function TableComponent({ columns, data }) {
  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr className="table-header-row">
            {columns.map((col, idx) => (
              <th key={idx} className="table-header-cell">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx} className="table-row">
              {columns.map((col, cIdx) => (
                <td key={cIdx} className="table-cell">
                  {row[col.toLowerCase()]} {/* match keys like id, name, type */}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableComponent;
