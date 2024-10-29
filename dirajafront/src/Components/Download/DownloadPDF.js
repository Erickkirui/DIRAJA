import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// const DownloadPDF = ({ tableId, fileName }) => {
//   const generatePDF = () => {
//     const input = document.getElementById(tableId);
//     if (input) {
//       html2canvas(input, { scale: 2 }).then((canvas) => {
//         const imgData = canvas.toDataURL('image/png');
//         const pdf = new jsPDF('p', 'pt', 'a4'); // Use landscape mode if needed
//         const imgWidth = pdf.internal.pageSize.width - 20; // Margins
//         const imgHeight = (canvas.height * imgWidth) / canvas.width;

//         pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight); // Add image to PDF
const DownloadPDF = ({ tableId, fileName }) => {
  const generatePDF = () => {
    const input = document.getElementById(tableId);
    if (input) {
      // Increase scale factor for better resolution
      const scaleFactor = 3; // Increase as needed for better clarity

      html2canvas(input, { scale: scaleFactor }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        // Initialize jsPDF with a larger page size (A3 for example)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a3', // Choose larger page size like A3 for bigger content area
        });

        const pageWidth = pdf.internal.pageSize.getWidth(); // Get page width in mm
        const pageHeight = pdf.internal.pageSize.getHeight(); // Get page height in mm
        const imgWidth = pageWidth - 20; // Adjust image width with margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add the first page
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add more pages as necessary
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save the PDF with the provided filename
        pdf.save(`${fileName}.pdf`);
      }).catch((error) => {
        console.error("Error generating PDF: ", error);
      });
    } else {
      console.error("Element not found for PDF generation");
    }
  };

  const printTable = () => {
    const input = document.getElementById(tableId);
    if (input) {
      // Use html2canvas to ensure consistency in rendering
      const scaleFactor = 3; // Same scale factor used for better quality
      html2canvas(input, { scale: scaleFactor }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");

        // Create a new window for printing
        const newWin = window.open("");
        newWin.document.write(`
          <html>
            <head>
              <title>${fileName} Table</title>
            </head>
            <body style="margin:0; padding:0;">
              <img src="${imgData}" style="width:100%;"/>
            </body>
          </html>
        `);
        newWin.document.close();
        
        // Wait for the image to load and then trigger print
        newWin.onload = () => {
          newWin.print();
          newWin.close();
        };
      }).catch((error) => {
        console.error("Error generating print preview: ", error);
      });
    } else {
      console.error("Table not found for printing");
    }
  };

  return (
    <div>
      <button
        onClick={generatePDF}
        style={{
          backgroundColor: 'transparent', // No background color
          padding: '10px', // Padding of 10px
          border: '1px solid #ccc', // 1px solid border with color #cc
          display: 'flex', // Flex to align items
          alignItems: 'center', // Center items vertically
          borderRadius: '5px', 
        }}
        
      >
        Download PDF
        <img 
        src='/images/pdf.png' 
        alt="Export Icon"
        style={{
          width: '20px', // Width of 20px
          height: '20px', // Height of 20px
          marginLeft: '5px', // Margin to space the image from the text
        }} 
      />
      </button>
      {/* <button
        onClick={printTable}
        
      >
        Print
      </button> */}
    </div>
  );
};

export default DownloadPDF;




