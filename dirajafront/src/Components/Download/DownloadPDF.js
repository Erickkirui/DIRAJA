import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DownloadPDF = ({ containerId, tableId, fileName }) => {
  const generatePDF = () => {
    let input;
    if (containerId) {
      input = document.getElementById(containerId);
    } else if (tableId) {
      input = document.getElementById(tableId);
    }

    if (input) {
      const scaleFactor = 3;

      html2canvas(input, { scale: scaleFactor }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a3',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 20; // Start below the title

        // Add title to the first page
        pdf.setFontSize(16); // Adjust font size as needed
        pdf.text(fileName, pageWidth / 2, 15, { align: "center" });

        // Add the first page with the content image
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if necessary
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.text(fileName, pageWidth / 2, 15, { align: "center" }); // Add title on each page
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${fileName}.pdf`);
      }).catch((error) => {
        console.error("Error generating PDF: ", error);
      });
    } else {
      console.error("Element not found for PDF generation");
    }
  };

  return (
    <div>
      <button
        onClick={generatePDF}
        style={{
          backgroundColor: 'transparent',
          padding: '10px',
          border: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '5px',
        }}
      >
        Download PDF
        <img 
          src='/images/pdf.png' 
          alt="Export Icon"
          style={{
            width: '20px',
            height: '20px',
            marginLeft: '5px',
          }} 
        />
      </button>
    </div>
  );
};

export default DownloadPDF;
