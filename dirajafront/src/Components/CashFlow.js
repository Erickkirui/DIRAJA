import React, { useEffect, useState } from "react";
import axios from "axios";

const CashFlowStatement = () => {
  const [operatingActivities, setOperatingActivities] = useState([]);
  const [financingActivities, setFinancingActivities] = useState([]);
  const [netCashFlow, setNetCashFlow] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  const fetchCashFlowData = async () => {
    setLoading(true);
    setError("");
  
    const token = localStorage.getItem("access_token");
  
    if (!token) {
      setError("Authorization token not found.");
      setLoading(false);
      return;
    }
  
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  
    try {
      const [payableRes, receivableRes, stockRes] = await Promise.all([
        axios.get("/api/diraja/accountspayable", config),
        axios.get("/api/diraja/accountsreceivable", config),
        axios.get("/api/diraja/shopstock/bydate", config),
      ]);
  
      // Accounts Payable and Receivable
      const operatingData = [
        { description: "Accounts Receivable", amount: receivableRes.data.total_balance || 0 },
        { description: "Accounts Payable", amount: payableRes.data.total_balance || 0 },
      ];
  
      // Shop Stocks: Flatten `stock_breakdown`
      const shopStocks = stockRes.data.shop_stocks.flatMap((shop) =>
        shop.stock_breakdown.map((item) => ({
          description: `Stock: ${shop.shop_name}: ${item.item_name}`,
          amount: item.total_value || 0,
        }))
      );
  
      // Combine Operating Data and Shop Stocks
      setOperatingActivities([...operatingData, ...shopStocks]);
  
      // Financing Activities (Static Example)
      const financingData = [
        { description: "Share Capital Account", amount: 42453.16 }, // Replace with real data if dynamic
      ];
      setFinancingActivities(financingData);
  
      // Calculate Net Cash Flow
      const totalOperating = operatingData.concat(shopStocks).reduce((sum, item) => sum + item.amount, 0);
      const totalFinancing = financingData.reduce((sum, item) => sum + item.amount, 0);
  
      setNetCashFlow({
        operating: totalOperating,
        financing: totalFinancing,
        netIncrease: totalOperating + totalFinancing,
      });
  
    } catch (err) {
      console.error("Error fetching cash flow data:", err);
      setError("Failed to fetch cash flow data. Please try again.");
    } finally {
      setLoading(false);
    }
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

      <button onClick={fetchCashFlowData}>Refresh Data</button>
    </div>
  );
};

export default CashFlowStatement;
