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

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

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

          <div className="actions-container">
            <ExportExcel data={salesData.sales || []} fileName="Mabanda_SalesData" />
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
