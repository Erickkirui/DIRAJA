import XLSX from 'sheetjs-style';

const ExportExcel = ({ data, fileName, sheetName = "Sheet1" }) => {
  const exportToExcel = () => {
    if (!data || !data.length) return; // Handle empty data

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Styling (Headers)
    const headers = Object.keys(data[0]);
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
    };

    headers.forEach((key, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      worksheet[cellAddress].s = headerStyle;
    });

    // Styling (Body)
    const bodyStyle = {
      font: { color: { rgb: "000000" } },
    };
    for (let row = 1; row <= data.length; row++) {
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
        worksheet[cellAddress].s = bodyStyle;
      }
    }

    // Create workbook and export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <button onClick={exportToExcel} style={{ marginTop: "20px", padding: "10px", cursor: "pointer" }}>
      Export to Excel
    </button>
  );
};

export default ExportExcel;
