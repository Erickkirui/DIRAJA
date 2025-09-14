import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/singleshopsale.css";
import ExportExcel from "../Components/Download/ExportExcel";
import DownloadPDF from "../Components/Download/DownloadPDF";
import DateRangePicker from "../Components/DateRangePicker";
import { format } from "date-fns";

const MabandaSalesDetails = () => {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError("");
      setCurrentPage(1); // Reset to first page on date change

      try {
        const accessToken = localStorage.getItem("access_token");
        let formattedStart, formattedEnd;

        // Handle period-based date selection
        if (period === "custom" && dateRange.startDate && dateRange.endDate) {
          formattedStart = format(dateRange.startDate, "yyyy-MM-dd");
          formattedEnd = format(dateRange.endDate, "yyyy-MM-dd");
        } else if (period === "today") {
          const today = new Date();
          formattedStart = format(today, "yyyy-MM-dd");
          formattedEnd = format(today, "yyyy-MM-dd");
        } else if (period === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          formattedStart = format(yesterday, "yyyy-MM-dd");
          formattedEnd = format(yesterday, "yyyy-MM-dd");
        } else if (period === "week") {
          const today = new Date();
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          formattedStart = format(weekAgo, "yyyy-MM-dd");
          formattedEnd = format(today, "yyyy-MM-dd");
        } else if (period === "month") {
          const today = new Date();
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          formattedStart = format(monthAgo, "yyyy-MM-dd");
          formattedEnd = format(today, "yyyy-MM-dd");
        }

        const url = `api/diraja/totalmabandasales?start_date=${formattedStart}&end_date=${formattedEnd}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setSales({
          total: response.data.total_sales_amount_paid,
          sales: response.data.sales_data,
        });
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Failed to fetch sales data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [dateRange, period]);

  const fullSalesList = sales?.sales ?? [];
  const totalPages = Math.ceil(fullSalesList.length / rowsPerPage);

  const paginatedSales = fullSalesList
    .slice()
    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    if (e.target.value !== "custom") {
      setDateRange({ startDate: null, endDate: null }); // Reset custom date range
    }
  };

  return (
    <div className="singleshopstock-table">
      {loading ? (
        <p>Loading sales data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : sales ? (
        <div>
          <h2>Sales for Mabanda</h2>
          <p>
            <strong>Sales total:</strong> {sales.total || "Ksh 0.00"}
          </p>

          <div className="controls">
            <select value={period} onChange={handlePeriodChange}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="custom">Custom Date</option>
            </select>

            {period === "custom" && (
              <DateRangePicker
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            )}
          </div>

          <div className="rows-per-page">
            <label>Rows per page:&nbsp;</label>
            <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={fullSalesList.length}>All</option>
            </select>
          </div>

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
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}

          {/* Export Options */}
          <div className="actions-container">
            <ExportExcel data={fullSalesList} fileName="Mabanda_sales" />
            <DownloadPDF tableId="singleshopstock-table" fileName="Mabanda_sales" />
          </div>
        </div>
      ) : (
        <p>No sales data available.</p>
      )}
    </div>
  );
};

export default MabandaSalesDetails;
