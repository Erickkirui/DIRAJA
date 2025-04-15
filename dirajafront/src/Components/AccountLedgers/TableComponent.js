import React from 'react';

function TableComponent({ columns, data }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            {columns.map((col, idx) => (
              <th key={idx} className="text-left px-4 py-2 border">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-gray-100">
              {columns.map((col, cIdx) => (
                <td key={cIdx} className="px-4 py-2 border">
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
