import React, { useEffect, useState } from "react";

const SalesSummaryTable = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState({
    totalPurchaseValue: 0,
    totalAmountPaid: 0,
  });

  useEffect(() => {
    fetch("https://kulima.co.ke/api/diraja/Sale-Summery", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch sales summary");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Fetched sales summary:", data);

        // Calculate totals for purchase_value and amount_paid
        const totalPurchaseValue = data.reduce((sum, item) => sum + item.purchase_value, 0);
        const totalAmountPaid = data.reduce((sum, item) => sum + item.total_amount_paid, 0);

        setSalesData(data);
        setTotals({ totalPurchaseValue, totalAmountPaid });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching sales summary:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Function to format numbers with commas
  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  // Render loading state or error if there's any
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Sales Summary</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Batch Number</th>
            <th>Metric</th>
            <th>Initial Quantity Transferred</th>
            <th>Total Quantity Sold</th>
            <th>Purchase Value</th>
            <th>Total Amount Paid</th>
            <th>Remaining Quantity</th>
            <th>Shop ID</th>
          </tr>
        </thead>
        <tbody>
          {salesData.map((item, index) => (
            <tr key={index}>
              <td>{item.item_name}</td>
              <td>{item.batch_number}</td>
              <td>{item.metric}</td>
              <td>{item.initial_quantity_transferred}</td>
              <td>{item.total_quantity_sold}</td>
              <td>{formatNumber(item.purchase_value.toFixed(2))}</td>
              <td>{formatNumber(item.total_amount_paid.toFixed(2))}</td>
              <td>{item.remaining_quantity}</td>
              <td>{item.shop_id}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5"><strong>Totals</strong></td>
            <td><strong>{formatNumber(totals.totalPurchaseValue.toFixed(2))}</strong></td>
            <td><strong>{formatNumber(totals.totalAmountPaid.toFixed(2))}</strong></td>
            <td colSpan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SalesSummaryTable;
