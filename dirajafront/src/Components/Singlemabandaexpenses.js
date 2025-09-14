import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/singleshopsale.css";
import ExportExcel from "../Components/Download/ExportExcel";
import DownloadPDF from "../Components/Download/DownloadPDF";
import DateRangePicker from "../Components/DateRangePicker";
import { format } from "date-fns";

const MabandaExpenseDetails = () => {
  const [expenseData, setExpenseData] = useState({ total_expense_amount: "Ksh 0.00", expenses: [] });
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
        if (!accessToken) {
          throw new Error("No access token found. Please log in.");
        }

        const formattedStart = format(dateRange.startDate, "yyyy-MM-dd");
        const formattedEnd = format(dateRange.endDate, "yyyy-MM-dd");

        console.log("Fetching data from:", `api/diraja/totalmabandaexpenses?start_date=${formattedStart}&end_date=${formattedEnd}`);

        const response = await axios.get(`api/diraja/totalmabandaexpenses`, {
          params: { start_date: formattedStart, end_date: formattedEnd },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("API Response:", response.data);

        if (!response.data || !response.data.expenses) {
          setExpenseData({ total_expense_amount: "Ksh 0.00", expenses: [] });
        } else {
          setExpenseData({
            total_expense_amount: response.data.total_expenses_amount || "Ksh 0.00",
            expenses: response.data.expenses_records || [],
          });
        }
      } catch (err) {
        console.error("Error fetching expense data:", err);
        setError("Failed to fetch expense data. Please try again.");
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
      ) : (
        <div>
          <h2>Expenses for Mabanda</h2>
          <p>
            <strong>Total Expenses:</strong> {expenseData.total_expense_amount}
          </p>

          <div className="input-container">
            <label>Filter by Date Range:</label>
            <DateRangePicker 
              dateRange={dateRange} 
              setDateRange={(range) => {
                console.log("New Date Range:", range);
                setDateRange({ ...range });
              }} 
            />
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
                    <td>{expense.amount ? `Ksh ${expense.amount.toLocaleString()}` : "Ksh 0.00"}</td>
                    <td>{expense.expense_date || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No expenses found for the selected period.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MabandaExpenseDetails;
