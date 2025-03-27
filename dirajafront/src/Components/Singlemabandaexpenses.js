import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/singleshopsale.css";
import ExportExcel from "../Components/Download/ExportExcel";
import DownloadPDF from "../Components/Download/DownloadPDF";
import DateRangePicker from "../Components/DateRangePicker";
import { format } from "date-fns";

const MabandaExpenseDetails = () => {
  const [expenseData, setExpenseData] = useState({ expenses: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError("");

      try {
        const accessToken = localStorage.getItem("access_token");
        const formattedStart = format(dateRange.startDate, "yyyy-MM-dd");
        const formattedEnd = format(dateRange.endDate, "yyyy-MM-dd");

        const url = `/api/diraja/totalmabandaexpenses?start_date=${formattedStart}&end_date=${formattedEnd}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setExpenseData(response.data || { expenses: [] }); // Ensure default structure
      } catch (err) {
        console.error("Error fetching expense data:", err);
        setError("Failed to fetch expense data.");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [dateRange]);

  return (
    <div className="singleshopstock-table">
      {loading ? (
        <p>Loading expense data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : expenseData ? (
        <div>
          <h2>Expenses for Mabanda</h2>
          <p>
            <strong>Total Expenses:</strong> {expenseData.total_expense_amount || "Ksh 0.00"}
          </p>

          <div className="input-container">
            <label>Filter by Date Range:</label>
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          </div>

          <div className="actions-container">
            <ExportExcel data={expenseData.expenses || []} fileName="Mabanda_Expenses" />
            <DownloadPDF tableId="singleshopstock-table" fileName="Mabanda_Expenses" />
          </div>

          <h3>Expense Records</h3>
          {expenseData.expenses.length > 0 ? (
            <table id="singleshopstock-table" className="singleshopstock-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Expense Date</th>
                </tr>
              </thead>
              <tbody>
                {expenseData.expenses.map((expense, index) => (
                  <tr key={index}>
                    <td>{expense.description}</td>
                    <td>Ksh {expense.amount.toLocaleString()}</td>
                    <td>{expense.expense_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No expenses found for the selected period.</p>
          )}
        </div>
      ) : (
        <p>No expense data available.</p>
      )}
    </div>
  );
};

export default MabandaExpenseDetails;
