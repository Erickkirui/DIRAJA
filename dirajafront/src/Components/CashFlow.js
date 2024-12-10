import React, { useEffect, useState } from "react";
import axios from "axios";

const CashFlowStatement = () => {
  const [operatingActivities, setOperatingActivities] = useState([]);
  const [financingActivities, setFinancingActivities] = useState([]);
  const [netCashFlow, setNetCashFlow] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entityType, setEntityType] = useState("Operating"); // Dropdown selection
  const [entityDescription, setEntityDescription] = useState("");
  const [entityAmount, setEntityAmount] = useState("");

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  useEffect(() => {
    const totalOperating = operatingActivities.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalFinancing = financingActivities.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    setNetCashFlow({
      operating: totalOperating,
      financing: totalFinancing,
      netIncrease: totalOperating + totalFinancing,
    });
  }, [operatingActivities, financingActivities]);

  const fetchCashFlowData = async (startDate = null, endDate = null) => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Authorization token not found.");
      setLoading(false);
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${token}` },
      params: { start_date: startDate, end_date: endDate },
    };

    try {
      const [payableRes, receivableRes, stockRes] = await Promise.all([
        axios.get("/api/diraja/accountspayable", config),
        axios.get("/api/diraja/accountsreceivable", config),
        axios.get("/api/diraja/shopstock/bydate", config),
      ]);

      const operatingData = [
        { description: "Accounts Receivable", amount: receivableRes.data.total_balance || 0 },
        { description: "Accounts Payable", amount: payableRes.data.total_balance || 0 },
      ];

      const shopStocks = stockRes.data.shop_stocks.flatMap((shop) =>
        shop.stock_breakdown.map((item) => ({
          description: `Stock: ${shop.shop_name}: ${item.item_name}`,
          amount: item.total_value || 0,
        }))
      );

      setOperatingActivities([...operatingData, ...shopStocks]);
      setFinancingActivities([]);
    } catch (err) {
      console.error("Error fetching cash flow data:", err);
      setError("Failed to fetch cash flow data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntity = (e) => {
    e.preventDefault();
    if (!entityDescription || isNaN(entityAmount)) {
      alert("Invalid input. Please enter valid data.");
      return;
    }

    const newEntity = {
      description: entityDescription,
      amount: parseFloat(entityAmount),
    };

    if (entityType === "Operating") {
      setOperatingActivities((prev) => [...prev, newEntity]);
    } else if (entityType === "Financing") {
      setFinancingActivities((prev) => [...prev, newEntity]);
    }

    // Reset form fields
    setEntityDescription("");
    setEntityAmount("");
  };

  const handleDateRangeSubmit = (e) => {
    e.preventDefault();
    fetchCashFlowData(startDate, endDate);
  };

  const handleRefreshData = () => {
    fetchCashFlowData();
  };

  const renderSection = (title, data) => (
    <div className="section">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.amount.toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="cash-flow-statement">
      <form onSubmit={handleAddEntity}>
        <h2>Add Activity</h2>
        <label>Type:</label>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="Operating">Operating Activities</option>
          <option value="Financing">Financing Activities</option>
        </select>
        <label>Description:</label>
        <input
          type="text"
          value={entityDescription}
          onChange={(e) => setEntityDescription(e.target.value)}
          required
        />
        <label>Amount:</label>
        <input
          type="number"
          value={entityAmount}
          onChange={(e) => setEntityAmount(e.target.value)}
          required
        />
        <button type="submit">Add Activity</button>
      </form>

      <form onSubmit={handleDateRangeSubmit}>
        <label>Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <label>End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
        <button type="submit">Filter by Date Range</button>
      </form>

      <button onClick={handleRefreshData}>Refresh Data</button>

      <h1>Statement of Cash Flows</h1>
      {loading && <p>Loading data...</p>}
      {error && <p className="error">{error}</p>}

      {renderSection("Operating Activities", operatingActivities)}
      {renderSection("Financing Activities", financingActivities)}

      <div className="section">
        <h2>Net Cash Flow</h2>
        <table>
          <tbody>
            <tr>
              <td>Net Cash Provided by Operating Activities</td>
              <td>{netCashFlow.operating?.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Net Cash Provided by Financing Activities</td>
              <td>{netCashFlow.financing?.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Net Cash Increase for Period</td>
              <td>{netCashFlow.netIncrease?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashFlowStatement;
