import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/singleshopsale.css";
import ExportExcel from "../Components/Download/ExportExcel";
import DownloadPDF from "../Components/Download/DownloadPDF";
import DateRangePicker from "../Components/DateRangePicker";
import { format } from "date-fns";

const MabandaSalesDetails = () => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("access_token");
        const formattedStart = format(dateRange.startDate, "yyyy-MM-dd");
        const formattedEnd = format(dateRange.endDate, "yyyy-MM-dd");

        const url = `/api/diraja/totalmabandasales?start_date=${formattedStart}&end_date=${formattedEnd}`;

        console.log("Fetching sales from URL:", url);

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("API Response:", response.data);

        setSalesData(response.data);
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Failed to fetch sales data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [dateRange]);

  return (
    <div className="singleshopstock-table">
      {loading ? (
        <p>Loading sales data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : salesData ? (
        <div>
          <h2>Sales for Mabanda</h2>
          <p>
            <strong>Sales total:</strong> {salesData.total_sales_amount_paid || "Ksh 0.00"}
          </p>

          <div className="input-container">
            <label>Filter by Date Range:</label>
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          </div>

          {/* Sales Table */}
          <div className="table-container">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Sale Date</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(salesData?.sales) && salesData.sales.length > 0 ? (
                  salesData.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.sale_date}</td>
                      <td>{sale.item_name || "N/A"}</td>
                      <td>{sale.quantity || 0}</td>
                      <td>{sale.amount_paid}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No sales records found for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Export Options */}
          <div className="actions-container">
            <ExportExcel data={salesData?.sales || []} fileName="Mabanda_SalesData" />
            <DownloadPDF tableId="singleshopstock-table" fileName="Mabanda_SalesData" />
          </div>
        </div>
      ) : (
        <p>No sales data available.</p>
      )}
    </div>
  );
};

export default MabandaSalesDetails;
