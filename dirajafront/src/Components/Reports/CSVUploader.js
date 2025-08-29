import React, { useState } from "react";
import Papa from "papaparse";

const CSVUploader = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "text/csv") {
      setError("Please upload a valid .csv file");
      return;
    }

    Papa.parse(file, {
      header: true, // Treat first row as headers
      skipEmptyLines: true,
      complete: function (results) {
        setData(results.data);
        setError("");
      },
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">CSV File Uploader</h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4"
      />

      {error && <p className="text-red-500">{error}</p>}

      {data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                {Object.keys(data[0]).map((header, idx) => (
                  <th
                    key={idx}
                    className="border px-4 py-2 bg-gray-200 text-left"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((value, i) => (
                    <td key={i} className="border px-4 py-2">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CSVUploader;
