import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Spin, Alert } from "antd";

const MonthlyIncomeChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch monthly income data
  const fetchMonthlyAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/api/diraja/monthly-analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      const formattedData = response.data.monthly_income.map((item) => ({
        month: monthNames[item.month - 1],
        revenue: item.total_income,
      }));

      setData(formattedData);
      setError("");
    } catch (err) {
      console.error("Error fetching monthly analytics:", err);
      setError("Failed to fetch monthly income data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyAnalytics();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(value);

  if (loading)
    return <Spin size="large" style={{ display: "block", margin: "50px auto" }} />;
  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <div
      style={{
        width: "100%",
        height: 400,
        background: "#fff",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <h2 style={{ textAlign: "left", marginBottom: 20, color: "#4B0082" }}>
        Monthly Revenue
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis
            label={{ value: "Revenue (KES)", angle: -90, position: "insideLeft" }}
            tickFormatter={formatCurrency}
          />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend verticalAlign="top" height={36} />
          <Bar
            dataKey="revenue"
            fill="#7B1FA2" // Deep purple
            radius={[6, 6, 0, 0]}
            barSize={45}
            name="Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyIncomeChart;
