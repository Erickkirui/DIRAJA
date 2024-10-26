import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DownloadPDF = ({ tableId, fileName }) => {
  const generatePDF = () => {
    const input = document.getElementById(tableId);
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4'); // Use landscape mode if needed
        const imgWidth = pdf.internal.pageSize.width - 20; // Margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight); // Add image to PDF

        // Save the PDF
        pdf.save(`${fileName}.pdf`);
      });
    }
  };

  const printTable = () => {
    const input = document.getElementById(tableId);
    if (input) {
      const newWin = window.open("");
      newWin.document.write(input.outerHTML);
      newWin.print();
      newWin.close();
    } else {
      console.error("Table not found");
    }
  };

  return (
    <div>
      <button onClick={generatePDF} style={{ marginTop: "20px", padding: "10px", cursor: "pointer" }}>
        Download PDF
      </button>
      <button onClick={printTable} style={{ marginTop: "20px", padding: "10px", cursor: "pointer" }}>
        Print
      </button>
    </div>
  );
};

export default DownloadPDF;
