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
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("access_token");
        const formattedDate = format(date, "yyyy-MM-dd");
        const url = `/api/mabanda/totalsalesbyshop12?date=${formattedDate}`;

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
  }, [date]);

  return (
    <div className="singleshopstock-table">
      {loading ? (
        <p>Loading sales data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : salesData ? (
        <div>
          <h2>Sales for Shop 12</h2>
          <p>
            <strong>Sales total:</strong> {salesData.total_sales_amount_paid}
          </p>

          <div className="input-container">
            <label>Filter by Date:</label>
            <DateRangePicker 
              dateRange={{ startDate: date, endDate: date }} 
              setDateRange={(range) => setDate(range.startDate)} 
            />
          </div>

          <div className="actions-container">
            <ExportExcel data={salesData} fileName="Shop12_SalesData" />
            <DownloadPDF tableId="singleshopstock-table" fileName="Shop12_SalesData" />
          </div>
        </div>
      ) : (
        <p>No sales data available.</p>
      )}
    </div>
  );
};

export default MabandaSalesDetails;
